import React, { useState } from 'react';
import { useInventory } from '../../logic/InventoryContext';
import { ArrowLeft, Save, Building, Bell, DollarSign, Moon } from 'lucide-react';

const Settings = ({ onNavigate }) => {
    const { settings, updateSettings } = useInventory();

    // Local state for form
    const [formData, setFormData] = useState({
        businessName: settings.businessName || '',
        lowStockThreshold: settings.lowStockThreshold || 5,
        currency: settings.currency || 'USD',
        theme: settings.theme || 'dark'
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

        // If theme changed, we might want to apply classes here or in App endpoint
        // For MVP we just save it.
    };

    return (
        <div className="container">
            <header style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button
                    onClick={() => onNavigate('dashboard')}
                    style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Settings</h1>
            </header>

            <div className="glass-panel" style={{ padding: '2rem' }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Business Profile */}
                    <div>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem', color: 'var(--text-primary)' }}>Business Profile</h3>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Business Name</label>
                        <div style={{ position: 'relative' }}>
                            <Building size={18} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '1rem', color: 'var(--text-secondary)' }} />
                            <input
                                type="text"
                                name="businessName"
                                className="input-field"
                                value={formData.businessName}
                                onChange={handleChange}
                                style={{ paddingLeft: '2.5rem' }}
                                placeholder="e.g. My Awesome Store"
                            />
                        </div>
                    </div>

                    {/* Inventory Settings */}
                    <div>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem', color: 'var(--text-primary)' }}>Notifications</h3>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Low Stock Threshold</label>
                        <div style={{ position: 'relative' }}>
                            <Bell size={18} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '1rem', color: 'var(--text-secondary)' }} />
                            <input
                                type="number"
                                name="lowStockThreshold"
                                className="input-field"
                                value={formData.lowStockThreshold}
                                onChange={handleChange}
                                min="1"
                                style={{ paddingLeft: '2.5rem' }}
                            />
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Alert when stock quantity falls below this number.</p>
                    </div>

                    {/* App Preferences */}
                    <div>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem', color: 'var(--text-primary)' }}>Preferences</h3>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Currency</label>
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
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Theme</label>
                                <select
                                    name="theme"
                                    className="input-field"
                                    value={formData.theme}
                                    onChange={handleChange}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <option value="light">Light Mode</option>
                                    <option value="dark">Dark Mode</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', width: '100%', padding: '0.75rem' }}>
                        <Save size={18} style={{ marginRight: '0.5rem' }} />
                        Save Settings
                    </button>

                </form>
            </div>
        </div>
    );
};

export default Settings;
