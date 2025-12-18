import React, { useState, useEffect } from 'react';
import { useInventory } from '../../logic/InventoryContext';
import { useCurrency } from '../../logic/currencyContextImpl';
import { useRole } from '../../logic/roleUtils';
import { useStore } from '../../logic/storeContextImpl';
import { useTheme } from '../../logic/themeContextImpl';
import PermissionGate from '../../components/PermissionGate';
import ActionGuard from '../../components/ActionGuard';
import { useAuth } from '../../logic/AuthContext';
import cloudSyncService, { SYNC_STATUS } from '../../logic/cloudSyncService';
import { ArrowLeft, Save, Building, Bell, Moon, Smartphone, UserCircle, Cloud, CloudOff, RefreshCw, CheckCircle, XCircle, Wifi, WifiOff, Store, Plus, MapPin, Trash2 } from 'lucide-react';
import { AppButton, AppCard, AppInput, AppSectionHeader, AppIconButton } from '../../components';
import PageLayout from '../../components/PageLayout';
import { requestNotificationPermission } from '../../logic/notifications';

const Settings = ({ onNavigate }) => {
    const { settings, updateSettings, syncToCloud, syncFromCloud, getLastSyncTime, getConnectionStatus } = useInventory();
    const { currency, changeCurrency } = useCurrency();
    const { userRole, changeRole, ROLES } = useRole();
    const { stores, activeStore, addStore, updateStore, deleteStore, switchStore } = useStore();
    const { setLogoForActiveStore, clearLogoForActiveStore } = useStore();
    const { requireAuth, listCashiers, createCashier, setCashierActive, resetCashierPassword } = useAuth();
    const [logoPreview, setLogoPreview] = useState(activeStore?.logoBase64 || '');
    const { currentTheme, setTheme } = useTheme();

    const [isSavingSettings, setIsSavingSettings] = useState(false);
    const [businessNameError, setBusinessNameError] = useState('');

    const [adminSwitchPassword, setAdminSwitchPassword] = useState('');
    const [adminSwitchPasswordConfirm, setAdminSwitchPasswordConfirm] = useState('');

    const [cashiers, setCashiers] = useState([]);
    const [newCashierUsername, setNewCashierUsername] = useState('');
    const [newCashierPassword, setNewCashierPassword] = useState('');
    const [newCashierPasswordConfirm, setNewCashierPasswordConfirm] = useState('');

    const isAdminMode = userRole === ROLES.ADMIN;
    const isGuestMode = userRole === ROLES.GUEST;
    const adminOnlyText = 'Only Admins can edit this setting';
    const guestPromptText = 'You must register your business or log in to edit this setting.';

    const hashPassword = async (password) => {
        if (!window.crypto?.subtle) {
            throw new Error('Password hashing is not supported in this browser.');
        }
        const encoder = new TextEncoder();
        const data = encoder.encode(String(password));
        const digest = await window.crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(digest))
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');
    };

    const refreshCashiers = () => {
        try {
            setCashiers(listCashiers());
        } catch {
            setCashiers([]);
        }
    };

    const handleCreateCashier = async (e) => {
        if (e?.preventDefault) e.preventDefault();
        try {
            await createCashier({
                username: newCashierUsername,
                password: newCashierPassword,
                passwordConfirm: newCashierPasswordConfirm
            });
            setNewCashierUsername('');
            setNewCashierPassword('');
            setNewCashierPasswordConfirm('');
            refreshCashiers();
            alert('Cashier account created.');
        } catch (err) {
            alert(err?.message || 'Failed to create cashier.');
        }
    };

    const handleToggleCashier = async (cashier) => {
        try {
            await setCashierActive({ cashierId: cashier?.id, isActive: !(cashier?.isActive === true) });
            refreshCashiers();
        } catch (err) {
            alert(err?.message || 'Failed to update cashier.');
        }
    };

    const handleResetCashierPassword = async (cashier) => {
        const p1 = window.prompt(`Enter a new password for ${cashier?.username || 'cashier'}:`);
        if (p1 === null) return;
        const p2 = window.prompt('Confirm the new password:');
        if (p2 === null) return;

        try {
            await resetCashierPassword({ cashierId: cashier?.id, newPassword: p1, newPasswordConfirm: p2 });
            refreshCashiers();
            alert('Cashier password reset.');
        } catch (err) {
            alert(err?.message || 'Failed to reset password.');
        }
    };

    const handleSetAdminSwitchPassword = async () => {
        const p1 = String(adminSwitchPassword || '');
        const p2 = String(adminSwitchPasswordConfirm || '');

        if (!p1 || p1.length < 4) {
            alert('Password must be at least 4 characters.');
            return;
        }
        if (p1 !== p2) {
            alert('Passwords do not match.');
            return;
        }

        try {
            const hash = await hashPassword(p1);
            updateSettings({ adminSwitchPasswordHash: hash });
            setAdminSwitchPassword('');
            setAdminSwitchPasswordConfirm('');
            alert('Admin switch password updated.');
        } catch (err) {
            alert(err?.message || 'Failed to set admin password.');
        }
    };

    const handleClearAdminSwitchPassword = () => {
        const ok = window.confirm('Clear the admin switch password? Cashiers will be able to switch to Admin without a password.');
        if (!ok) return;
        updateSettings({ adminSwitchPasswordHash: '' });
        alert('Admin switch password cleared.');
    };

    // Local state for form
    const [formData, setFormData] = useState({
        businessName: activeStore?.name || settings.businessName || '',
        lowStockThreshold: settings.lowStockThreshold || 5,
        currency: settings.currency || currency.code || 'USD'
    });

    const [syncStatus, setSyncStatus] = useState(SYNC_STATUS.IDLE);
    const [lastSync, setLastSync] = useState(getLastSyncTime());
    const [isOnline, setIsOnline] = useState(getConnectionStatus() === 'online');
    const [showAddStore, setShowAddStore] = useState(false);
    const [newStoreData, setNewStoreData] = useState({ name: '', location: '' });

    useEffect(() => {
        // Subscribe to sync status updates
        const unsubscribe = cloudSyncService.subscribe((update) => {
            if (update.status) setSyncStatus(update.status);
            if (update.lastSync) setLastSync(update.lastSync);
        });

        // Update online status
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            unsubscribe();
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            businessName: activeStore?.name || settings.businessName || ''
        }));
    }, [activeStore?.id]);

    useEffect(() => {
        try {
            const next = listCashiers();
            setCashiers(next);
        } catch {
            setCashiers([]);
        }
    }, [activeStore?.id, listCashiers]);

    // Ask for notification permission in settings context (non-intrusive)
    useEffect(() => {
        requestNotificationPermission();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'theme') {
            setTheme(value);
            return; // do not store theme locally
        }

        if (!isAdminMode && (name === 'businessName' || name === 'lowStockThreshold')) {
            if (isGuestMode) requireAuth(guestPromptText);
            return;
        }

        if (name === 'businessName' && businessNameError) {
            setBusinessNameError('');
        }
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!isAdminMode) {
            if (isGuestMode) {
                requireAuth(guestPromptText);
                return;
            }
            alert(adminOnlyText);
            return;
        }

        const trimmedBusinessName = String(formData.businessName || '').trim();
        if (!trimmedBusinessName) {
            setBusinessNameError('Shop name is required');
            return;
        }

        setIsSavingSettings(true);

        // Update global currency via context
        changeCurrency(formData.currency);

        // Persist store name (single source of truth)
        try {
            updateStore(activeStore.id, { name: trimmedBusinessName });
        } catch (err) {
            setIsSavingSettings(false);
            alert(err?.message || 'Failed to update shop name.');
            return;
        }

        // Persist other settings (without currencySymbol, using global CurrencyContext)
        updateSettings({
            ...formData,
            businessName: trimmedBusinessName,
            lowStockThreshold: parseInt(formData.lowStockThreshold, 10)
        });

        setIsSavingSettings(false);
        alert("Settings Saved Successfully!");
    };

    const handleSyncNow = async () => {
        setSyncStatus(SYNC_STATUS.SYNCING);
        const result = await syncToCloud();
        if (result.success) {
            setLastSync(getLastSyncTime());
        }
    };

    const handleRestoreFromCloud = async () => {
        if (window.confirm('This will replace your local data with cloud backup. Continue?')) {
            setSyncStatus(SYNC_STATUS.SYNCING);
            const result = await syncFromCloud();
            if (result.success) {
                alert('Data restored from cloud successfully!');
                setLastSync(result.timestamp);
            } else {
                alert('Failed to restore from cloud. ' + (result.error?.message || 'No backup found.'));
            }
            setSyncStatus(SYNC_STATUS.IDLE);
        }
    };

    const formatLastSync = () => {
        if (!lastSync) return 'Never';
        const date = new Date(lastSync);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min ago`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
        return date.toLocaleDateString();
    };

    const handleAddStore = (e) => {
        e.preventDefault();
        if (!newStoreData.name.trim()) {
            alert('Store name is required');
            return;
        }
        addStore(newStoreData);
        setNewStoreData({ name: '', location: '' });
        setShowAddStore(false);
        alert('Store added successfully!');
    };

    const handleDeleteStore = (storeId) => {
        if (window.confirm('Are you sure? This will delete all data for this store.')) {
            try {
                deleteStore(storeId);
                alert('Store deleted successfully');
            } catch (err) {
                alert(err.message);
            }
        }
    };

    const handleLogoFileChange = (e) => {
        if (!isAdminMode) {
            if (isGuestMode) {
                requireAuth(guestPromptText);
                return;
            }
            alert(adminOnlyText);
            return;
        }
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        if (!/^image\//i.test(file.type)) {
            alert('Please select an image file.');
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            setLogoPreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleSaveLogo = () => {
        if (!isAdminMode) {
            if (isGuestMode) {
                requireAuth(guestPromptText);
                return;
            }
            alert(adminOnlyText);
            return;
        }
        setLogoForActiveStore(logoPreview || '');
        alert('Logo saved for this store.');
    };

    const handleRemoveLogo = () => {
        if (!isAdminMode) {
            if (isGuestMode) {
                requireAuth(guestPromptText);
                return;
            }
            alert(adminOnlyText);
            return;
        }
        clearLogoForActiveStore();
        setLogoPreview('');
        alert('Logo removed for this store.');
    };

    return (
        <PageLayout>
            <header style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
                <AppIconButton icon={ArrowLeft} onClick={() => onNavigate('dashboard')} size={24} color="var(--text-primary)" />
                <h1 className="text-h1">Settings</h1>
            </header>

            <AppCard style={{ padding: 'var(--spacing-lg)' }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                    {/* Branding / Logo */}
                    <div>
                        <AppSectionHeader title="Branding" />
                        <p className="text-caption" style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)' }}>
                            Upload a store-specific logo. It will appear in the sidebar, top bar, and receipts.
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
                            <div style={{ width: 80, height: 80, border: '1px solid var(--border-color)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)' }}>
                                {logoPreview ? (
                                    <img src={logoPreview} alt="Logo preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 6 }} />
                                ) : (
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>No Logo</span>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center', flexWrap: 'wrap' }}>
                                {isGuestMode ? (
                                    <ActionGuard action="stores.manage" reason={guestPromptText}>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleLogoFileChange}
                                            title={guestPromptText}
                                            style={{ opacity: 0.6, cursor: 'not-allowed' }}
                                        />
                                    </ActionGuard>
                                ) : (
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLogoFileChange}
                                        disabled={!isAdminMode}
                                        title={!isAdminMode ? adminOnlyText : ''}
                                        style={!isAdminMode ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
                                    />
                                )}
                                <PermissionGate action="stores.manage">
                                    <AppButton type="button" onClick={handleSaveLogo} variant="secondary">Save Logo</AppButton>
                                </PermissionGate>
                                {activeStore?.logoBase64 && (
                                    <PermissionGate action="stores.manage">
                                        <AppButton type="button" onClick={handleRemoveLogo} variant="danger">Remove Logo</AppButton>
                                    </PermissionGate>
                                )}
                            </div>
                        </div>
                        {!isAdminMode && (
                            <p className="text-caption" style={{ color: 'var(--text-secondary)', marginTop: 'var(--spacing-sm)' }}>
                                {isGuestMode ? guestPromptText : adminOnlyText}
                            </p>
                        )}
                    </div>

                    <PermissionGate action="users.manage">
                        <div>
                            <AppSectionHeader title="Admin Access" />
                            <p className="text-caption" style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)' }}>
                                Set a password required for Cashiers to switch into Admin mode.
                            </p>

                            <div style={{
                                marginBottom: 'var(--spacing-md)',
                                padding: 'var(--spacing-sm)',
                                background: 'var(--bg-secondary)',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '0.75rem',
                                color: 'var(--text-secondary)'
                            }}>
                                <strong>Status:</strong> {settings.adminSwitchPasswordHash ? 'Password enabled' : 'No password set'}
                            </div>

                            <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
                                <AppInput
                                    label="New Admin Switch Password"
                                    type="password"
                                    value={adminSwitchPassword}
                                    onChange={(e) => setAdminSwitchPassword(e.target.value)}
                                    placeholder="Enter new password"
                                />
                                <AppInput
                                    label="Confirm Password"
                                    type="password"
                                    value={adminSwitchPasswordConfirm}
                                    onChange={(e) => setAdminSwitchPasswordConfirm(e.target.value)}
                                    placeholder="Re-enter password"
                                />
                            </div>

                            <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-md)' }}>
                                <AppButton
                                    type="button"
                                    onClick={handleSetAdminSwitchPassword}
                                    style={{ flex: 1 }}
                                >
                                    Set Password
                                </AppButton>
                                <AppButton
                                    type="button"
                                    onClick={handleClearAdminSwitchPassword}
                                    style={{ flex: 1 }}
                                >
                                    Clear Password
                                </AppButton>
                            </div>
                        </div>
                    </PermissionGate>

                    <PermissionGate action="users.manage">
                        <div>
                            <AppSectionHeader title="Cashier Accounts" />
                            <p className="text-caption" style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)' }}>
                                Create and manage cashier login credentials for this business.
                            </p>

                            <div style={{
                                padding: 'var(--spacing-md)',
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-sm)',
                                display: 'grid',
                                gap: 'var(--spacing-md)',
                                marginBottom: 'var(--spacing-md)'
                            }}>
                                <AppInput
                                    label="Cashier Username"
                                    name="newCashierUsername"
                                    value={newCashierUsername}
                                    onChange={(e) => setNewCashierUsername(e.target.value)}
                                    placeholder="e.g. cashier01"
                                />

                                <AppInput
                                    label="Password"
                                    type="password"
                                    name="newCashierPassword"
                                    value={newCashierPassword}
                                    onChange={(e) => setNewCashierPassword(e.target.value)}
                                    placeholder="Minimum 4 characters"
                                />

                                <AppInput
                                    label="Confirm Password"
                                    type="password"
                                    name="newCashierPasswordConfirm"
                                    value={newCashierPasswordConfirm}
                                    onChange={(e) => setNewCashierPasswordConfirm(e.target.value)}
                                    placeholder="Re-enter password"
                                />

                                <AppButton type="button" variant="secondary" onClick={handleCreateCashier}>
                                    Create Cashier
                                </AppButton>
                            </div>

                            <div style={{
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-sm)',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    padding: '0.75rem',
                                    background: 'var(--bg-card)',
                                    borderBottom: '1px solid var(--border-color)',
                                    fontWeight: 600,
                                    fontSize: '0.9rem'
                                }}>
                                    Existing Cashiers ({cashiers.length})
                                </div>

                                {cashiers.length === 0 ? (
                                    <div style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                        No cashier accounts yet.
                                    </div>
                                ) : (
                                    <div style={{ display: 'grid' }}>
                                        {cashiers.map((cashier) => (
                                            <div
                                                key={cashier.id}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    gap: 'var(--spacing-md)',
                                                    padding: '0.75rem',
                                                    borderTop: '1px solid var(--border-color)'
                                                }}
                                            >
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                                    <div style={{ fontWeight: 600 }}>{cashier.username}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                        Status: {cashier.isActive === false ? 'Disabled' : 'Active'}
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                                    <AppButton
                                                        type="button"
                                                        variant={cashier.isActive === false ? 'secondary' : 'ghost'}
                                                        onClick={() => handleToggleCashier(cashier)}
                                                    >
                                                        {cashier.isActive === false ? 'Enable' : 'Disable'}
                                                    </AppButton>

                                                    <AppButton
                                                        type="button"
                                                        variant="ghost"
                                                        onClick={() => handleResetCashierPassword(cashier)}
                                                    >
                                                        Reset Password
                                                    </AppButton>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </PermissionGate>

                    {/* Multi-Store Management */}
                    <PermissionGate action="stores.manage">
                    <div>
                        <AppSectionHeader title="Store Management" />
                        <p className="text-caption" style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)' }}>
                            Manage multiple stores with separate inventory and sales data.
                        </p>

                        {/* Current Store Indicator */}
                        <div style={{
                            padding: 'var(--spacing-md)',
                            background: 'var(--accent-primary)',
                            color: 'var(--text-on-accent)',
                            borderRadius: 'var(--radius-sm)',
                            marginBottom: 'var(--spacing-md)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-sm)'
                        }}>
                            <Store size={20} />
                            <div>
                                <div style={{ fontWeight: 600 }}>{activeStore.name}</div>
                                {activeStore.location && (
                                    <div style={{ fontSize: '0.75rem', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <MapPin size={12} />
                                        {activeStore.location}
                                    </div>
                                )}
                            </div>
                            <div style={{ marginLeft: 'auto', fontSize: '0.7rem', opacity: 0.8 }}>
                                Active
                            </div>
                        </div>

                        {/* Stores List */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
                            {stores.map(store => (
                                <div key={store.id} style={{
                                    padding: 'var(--spacing-md)',
                                    background: store.id === activeStore.id ? 'var(--bg-secondary)' : 'var(--bg-card)',
                                    border: store.id === activeStore.id ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                                    borderRadius: 'var(--radius-sm)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--spacing-sm)'
                                }}>
                                    <Store size={18} color={store.id === activeStore.id ? 'var(--accent-primary)' : 'var(--text-secondary)'} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 500 }}>{store.name}</div>
                                        {store.location && (
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                                                <MapPin size={12} />
                                                {store.location}
                                            </div>
                                        )}
                                    </div>
                                    {store.id !== activeStore.id && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => switchStore(store.id)}
                                                style={{
                                                    padding: '0.25rem 0.75rem',
                                                    background: 'var(--accent-primary)',
                                                    color: 'var(--text-on-accent)',
                                                    border: 'none',
                                                    borderRadius: 'var(--radius-sm)',
                                                    fontSize: '0.75rem',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Switch
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteStore(store.id)}
                                                disabled={stores.length <= 1}
                                                style={{
                                                    padding: '0.25rem',
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: stores.length <= 1 ? 'var(--text-secondary)' : 'var(--accent-danger)',
                                                    cursor: stores.length <= 1 ? 'not-allowed' : 'pointer',
                                                    opacity: stores.length <= 1 ? 0.3 : 1
                                                }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Add Store Form */}
                        {!showAddStore ? (
                            <button
                                type="button"
                                onClick={() => setShowAddStore(true)}
                                style={{
                                    padding: 'var(--spacing-md)',
                                    background: 'var(--bg-secondary)',
                                    border: '1px dashed var(--border-color)',
                                    borderRadius: 'var(--radius-sm)',
                                    color: 'var(--text-primary)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    fontSize: '0.875rem'
                                }}
                            >
                                <Plus size={16} />
                                Add New Store
                            </button>
                        ) : (
                            <div style={{
                                padding: 'var(--spacing-md)',
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-sm)'
                            }}>
                                <h4 style={{ marginBottom: 'var(--spacing-md)', fontSize: '0.875rem', fontWeight: 600 }}>New Store</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                                    <AppInput
                                        label="Store Name"
                                        value={newStoreData.name}
                                        onChange={(e) => setNewStoreData(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="e.g. Downtown Branch"
                                        icon={Store}
                                    />
                                    <AppInput
                                        label="Location (Optional)"
                                        value={newStoreData.location}
                                        onChange={(e) => setNewStoreData(prev => ({ ...prev, location: e.target.value }))}
                                        placeholder="e.g. 123 Main St"
                                        icon={MapPin}
                                    />
                                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                        <button
                                            type="button"
                                            onClick={handleAddStore}
                                            style={{
                                                flex: 1,
                                                padding: '0.5rem',
                                                background: 'var(--accent-primary)',
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: 'var(--radius-sm)',
                                                fontSize: '0.875rem',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Create Store
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowAddStore(false);
                                                setNewStoreData({ name: '', location: '' });
                                            }}
                                            style={{
                                                flex: 1,
                                                padding: '0.5rem',
                                                background: 'var(--bg-card)',
                                                color: 'var(--text-primary)',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: 'var(--radius-sm)',
                                                fontSize: '0.875rem',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    </PermissionGate>

                    {/* Cloud Sync Section */}
                    <div>
                        <AppSectionHeader title="Cloud Backup & Sync" />
                        <p className="text-caption" style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)' }}>
                            Automatically backup your data to the cloud. Works offline-first.
                        </p>

                        {/* Connection Status */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-sm)',
                            padding: 'var(--spacing-md)',
                            background: isOnline ? 'var(--bg-success-soft)' : 'var(--bg-danger-soft)',
                            borderRadius: 'var(--radius-sm)',
                            marginBottom: 'var(--spacing-md)'
                        }}>
                            {isOnline ? <Wifi size={18} color="var(--accent-success)" /> : <WifiOff size={18} color="var(--accent-danger)" />}
                            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                                {isOnline ? 'Online' : 'Offline'}
                            </span>
                            {syncStatus === SYNC_STATUS.SYNCING && (
                                <RefreshCw size={16} className="spin" style={{ marginLeft: 'auto' }} />
                            )}
                        </div>

                        {/* Sync Status */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: 'var(--spacing-sm)',
                            background: 'var(--bg-secondary)',
                            borderRadius: 'var(--radius-sm)',
                            marginBottom: 'var(--spacing-md)',
                            fontSize: '0.875rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {syncStatus === SYNC_STATUS.SUCCESS && <CheckCircle size={16} color="var(--accent-success)" />}
                                {syncStatus === SYNC_STATUS.ERROR && <XCircle size={16} color="var(--accent-danger)" />}
                                {syncStatus === SYNC_STATUS.SYNCING && <RefreshCw size={16} className="spin" />}
                                {syncStatus === SYNC_STATUS.OFFLINE && <CloudOff size={16} color="var(--text-secondary)" />}
                                <span>Last sync: <strong>{formatLastSync()}</strong></span>
                            </div>
                        </div>

                        {/* Sync Actions */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-sm)' }}>
                            <PermissionGate action="settings.save">
                                <button
                                    type="button"
                                    onClick={handleSyncNow}
                                    disabled={!isOnline || syncStatus === SYNC_STATUS.SYNCING}
                                    style={{
                                        padding: 'var(--spacing-md)',
                                        background: isOnline ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                                        color: isOnline ? 'var(--text-on-success)' : 'var(--text-secondary)',
                                        border: 'none',
                                        borderRadius: 'var(--radius-sm)',
                                        cursor: isOnline && syncStatus !== SYNC_STATUS.SYNCING ? 'pointer' : 'not-allowed',
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                        opacity: isOnline ? 1 : 0.5
                                    }}
                                >
                                    {syncStatus === SYNC_STATUS.SYNCING ? (
                                        <><RefreshCw size={16} className="spin" /> Syncing...</>
                                    ) : (
                                        <><Cloud size={16} /> Sync Now</>
                                    )}
                                </button>
                            </PermissionGate>

                            <PermissionGate action="settings.save">
                                <button
                                    type="button"
                                    onClick={handleRestoreFromCloud}
                                    disabled={!isOnline || syncStatus === SYNC_STATUS.SYNCING}
                                    style={{
                                        padding: 'var(--spacing-md)',
                                        background: 'var(--bg-secondary)',
                                        color: 'var(--text-primary)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: 'var(--radius-sm)',
                                        cursor: isOnline && syncStatus !== SYNC_STATUS.SYNCING ? 'pointer' : 'not-allowed',
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                        opacity: isOnline ? 1 : 0.5
                                    }}
                                >
                                    <RefreshCw size={16} /> Restore
                                </button>
                            </PermissionGate>
                        </div>

                        <p style={{ 
                            fontSize: '0.7rem', 
                            color: 'var(--text-secondary)', 
                            marginTop: 'var(--spacing-sm)',
                            fontStyle: 'italic'
                        }}>
                            💡 Data syncs automatically every 2 seconds after changes
                        </p>
                    </div>

                    {/* Business Profile */}
                    <div>
                        <AppSectionHeader title="Business Profile" />
                        {isGuestMode ? (
                            <ActionGuard action="settings.save" reason={guestPromptText}>
                                <AppInput
                                    label="Business Name"
                                    name="businessName"
                                    value={formData.businessName}
                                    onChange={handleChange}
                                    placeholder="e.g. My Awesome Store"
                                    icon={Building}
                                    error={businessNameError}
                                    title={guestPromptText}
                                    style={{ opacity: 0.85 }}
                                />
                            </ActionGuard>
                        ) : (
                            <AppInput
                                label="Business Name"
                                name="businessName"
                                value={formData.businessName}
                                onChange={handleChange}
                                placeholder="e.g. My Awesome Store"
                                icon={Building}
                                error={businessNameError}
                                disabled={!isAdminMode}
                                title={!isAdminMode ? adminOnlyText : ''}
                            />
                        )}
                        {!isAdminMode && (
                            <p className="text-caption" style={{ color: 'var(--text-secondary)', marginTop: '-0.5rem' }}>
                                {isGuestMode ? guestPromptText : adminOnlyText}
                            </p>
                        )}
                    </div>

                    {/* Inventory Settings */}
                    <div>
                        <AppSectionHeader title="Notifications" />
                        {isGuestMode ? (
                            <ActionGuard action="settings.save" reason={guestPromptText}>
                                <AppInput
                                    label="Low Stock Threshold"
                                    name="lowStockThreshold"
                                    type="number"
                                    value={formData.lowStockThreshold}
                                    onChange={handleChange}
                                    min="1"
                                    icon={Bell}
                                    title={guestPromptText}
                                    style={{ opacity: 0.85 }}
                                />
                            </ActionGuard>
                        ) : (
                            <AppInput
                                label="Low Stock Threshold"
                                name="lowStockThreshold"
                                type="number"
                                value={formData.lowStockThreshold}
                                onChange={handleChange}
                                min="1"
                                icon={Bell}
                                disabled={!isAdminMode}
                                title={!isAdminMode ? adminOnlyText : ''}
                            />
                        )}
                        <p className="text-caption" style={{ color: 'var(--text-secondary)', marginTop: '-0.5rem' }}>
                            Alert when stock quantity falls below this number.
                            {!isAdminMode ? ` ${isGuestMode ? guestPromptText : adminOnlyText}` : ''}
                        </p>
                    </div>

                    {/* App Preferences */}
                    <div>
                        <AppSectionHeader title="Preferences" />

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-lg)' }}>
                            <div>
                                <label className="text-sm" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Currency</label>
                                <PermissionGate action="settings.updateCurrency" fallback={(
                                    <div className="input-field" style={{ opacity: 0.5 }}>Currency changes disabled for your role</div>
                                )}>
                                    <select
                                        name="currency"
                                        className="input-field"
                                        value={formData.currency}
                                        onChange={handleChange}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <option value="USD">USD ($)</option>
                                        <option value="GHS">GHS (₵)</option>
                                        <option value="NGN">NGN (₦)</option>
                                        <option value="EUR">EUR (€)</option>
                                        <option value="GBP">GBP (£)</option>
                                    </select>
                                </PermissionGate>
                            </div>
                            <div>
                                <label className="text-sm" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Theme</label>
                                <div style={{ position: 'relative' }}>
                                    <Moon size={18} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '1rem', color: 'var(--text-secondary)' }} />
                                    <select
                                        name="theme"
                                        className="input-field"
                                        value={currentTheme}
                                        onChange={handleChange}
                                        style={{ cursor: 'pointer', paddingLeft: '2.5rem' }}
                                    >
                                        <option value="light">Light Mode ☀️</option>
                                        <option value="dark">Dark Mode 🌙</option>
                                        <option value="system">System Auto 🖥️</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* User Role Section */}
                    <PermissionGate action="users.manage">
                    <div>
                        <AppSectionHeader title="User Role" />
                        <p className="text-caption" style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)' }}>
                            Select your role to customize access permissions.
                        </p>
                        
                        <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                            <button
                                type="button"
                                onClick={() => {
                                    changeRole(ROLES.ADMIN);
                                    try {
                                        localStorage.setItem('salesUp_session_v1', JSON.stringify({ isAuthenticated: true, role: ROLES.ADMIN, businessId: activeStore?.id || '', cashierId: '' }));
                                    } catch {
                                        // ignore
                                    }
                                }}
                                style={{
                                    flex: 1,
                                    padding: 'var(--spacing-md)',
                                    background: userRole === ROLES.ADMIN ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                                    color: userRole === ROLES.ADMIN ? '#fff' : 'var(--text-primary)',
                                    border: userRole === ROLES.ADMIN ? 'none' : '1px solid var(--border-color)',
                                    borderRadius: 'var(--radius-sm)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <UserCircle size={32} />
                                <div>
                                    <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Admin</div>
                                    <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Full Access</div>
                                </div>
                            </button>
                            
                            <button
                                type="button"
                                onClick={() => {
                                    changeRole(ROLES.CASHIER);
                                    try {
                                        localStorage.setItem('salesUp_session_v1', JSON.stringify({ isAuthenticated: true, role: ROLES.CASHIER, businessId: activeStore?.id || '', cashierId: '' }));
                                    } catch {
                                        // ignore
                                    }
                                }}
                                style={{
                                    flex: 1,
                                    padding: 'var(--spacing-md)',
                                    background: userRole === ROLES.CASHIER ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                                    color: userRole === ROLES.CASHIER ? '#fff' : 'var(--text-primary)',
                                    border: userRole === ROLES.CASHIER ? 'none' : '1px solid var(--border-color)',
                                    borderRadius: 'var(--radius-sm)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <UserCircle size={32} />
                                <div>
                                    <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Cashier</div>
                                    <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>POS Only</div>
                                </div>
                            </button>
                        </div>

                        <div style={{
                            marginTop: 'var(--spacing-md)',
                            padding: 'var(--spacing-sm)',
                            background: 'var(--bg-secondary)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)'
                        }}>
                            <strong>Current Role:</strong> {userRole === ROLES.ADMIN ? 'Admin (Full Access)' : 'Cashier (POS & Receipts Only)'}
                        </div>
                    </div>
                    </PermissionGate>

                    <PermissionGate action="settings.save">
                        <AppButton type="submit" icon={Save} fullWidth disabled={isSavingSettings}>
                            {isSavingSettings ? 'Saving...' : 'Save Settings'}
                        </AppButton>
                    </PermissionGate>

                </form>
            </AppCard>
        </PageLayout>
    );
};

export default Settings;
