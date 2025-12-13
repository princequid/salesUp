import React, { useState } from 'react';
import { useInventory } from '../../logic/InventoryContext';
import { ArrowLeft, Save, Building, Bell, Moon, Smartphone } from 'lucide-react';
import { AppButton, AppCard, AppInput, AppSectionHeader, AppIconButton } from '../../components';
import PageLayout from '../../components/PageLayout';

const Settings = ({ onNavigate }) => {
    const { settings, updateSettings } = useInventory();

    // Local state for form
    const [formData, setFormData] = useState({
        businessName: settings.businessName || '',
        lowStockThreshold: settings.lowStockThreshold || 5,
        currency: settings.currency || 'USD',
        theme: settings.theme || 'system'
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Simple mapping for symbols
        let symbol = '$';
        if (formData.currency === 'GHS') symbol = '₵';
        if (formData.currency === 'NGN') symbol = '₦';
        if (formData.currency === 'EUR') symbol = '€';
        if (formData.currency === 'GBP') symbol = '£';

        updateSettings({
            ...formData,
            currencySymbol: symbol,
            lowStockThreshold: parseInt(formData.lowStockThreshold, 10)
        });

        alert("Settings Saved Successfully!");
    };

    return (
        <PageLayout>
            <header style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
                <AppIconButton icon={ArrowLeft} onClick={() => onNavigate('dashboard')} size={24} color="var(--text-primary)" />
                <h1 className="text-h1">Settings</h1>
            </header>

            <AppCard style={{ padding: 'var(--spacing-lg)' }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>

                    {/* Business Profile */}
                    <div>
                        <AppSectionHeader title="Business Profile" />
                        <AppInput
                            label="Business Name"
                            name="businessName"
                            value={formData.businessName}
                            onChange={handleChange}
                            placeholder="e.g. My Awesome Store"
                            icon={Building}
                        />
                    </div>

                    {/* Inventory Settings */}
                    <div>
                        <AppSectionHeader title="Notifications" />
                        <AppInput
                            label="Low Stock Threshold"
                            name="lowStockThreshold"
                            type="number"
                            value={formData.lowStockThreshold}
                            onChange={handleChange}
                            min="1"
                            icon={Bell}
                        />
                        <p className="text-caption" style={{ color: 'var(--text-secondary)', marginTop: '-0.5rem' }}>Alert when stock quantity falls below this number.</p>
                    </div>

                    {/* App Preferences */}
                    <div>
                        <AppSectionHeader title="Preferences" />

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-lg)' }}>
                            <div>
                                <label className="text-sm" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Currency</label>
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
                            </div>
                            <div>
                                <label className="text-sm" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Theme</label>
                                <div style={{ position: 'relative' }}>
                                    <Moon size={18} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '1rem', color: 'var(--text-secondary)' }} />
                                    <select
                                        name="theme"
                                        className="input-field"
                                        value={formData.theme}
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

                    <AppButton type="submit" icon={Save} fullWidth>
                        Save Settings
                    </AppButton>

                </form>
            </AppCard>
        </PageLayout>
    );
};

export default Settings;
