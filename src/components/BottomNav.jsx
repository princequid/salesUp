import React from 'react';
import { LayoutDashboard, ShoppingCart, Calculator, FileText, Settings, Plus } from 'lucide-react';

const BottomNav = ({ currentScreen, onNavigate }) => {

    // Define tabs
    const tabs = [
        { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
        { id: 'productList', label: 'Products', icon: ShoppingCart },
        { id: 'recordSale', label: 'POS', icon: Calculator },
        { id: 'reports', label: 'Reports', icon: FileText },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    return (
        <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: '#FFFFFF',
            borderTop: '1px solid #E2E8F0',
            padding: '0.75rem 1rem 1.75rem', /* Integrated safe area padding */
            display: 'flex',
            justifyContent: 'space-around',
            boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.05)',
            zIndex: 1000
        }}>
            {tabs.map(tab => {
                const isActive = currentScreen === tab.id;
                const Icon = tab.icon;

                return (
                    <button
                        key={tab.id}
                        onClick={() => onNavigate(tab.id)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.35rem',
                            color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                            fontWeight: isActive ? 600 : 500,
                            cursor: 'pointer',
                            transition: 'color 0.2s',
                            width: '100%'
                        }}
                    >
                        <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                        <span style={{ fontSize: '0.7rem' }}>{tab.label}</span>
                    </button>
                );
            })}
        </div>
    );
};

export default BottomNav;
