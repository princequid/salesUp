import React from 'react';
import { LayoutDashboard, ShoppingCart, Calculator, Receipt, Settings, FileText, MoreHorizontal } from 'lucide-react';
import { useRole } from '../logic/roleUtils';

const BottomNav = ({ currentScreen, onNavigate }) => {
    const { hasAccess } = useRole();
    const [isCompact, setIsCompact] = React.useState(false);
    const [moreOpen, setMoreOpen] = React.useState(false);

    React.useEffect(() => {
        const onResize = () => setIsCompact(window.innerWidth < 430);
        onResize();
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    // Define tabs
    const tabs = [
        { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
        { id: 'productList', label: 'Products', icon: ShoppingCart },
        { id: 'recordSale', label: 'POS', icon: Calculator },
        { id: 'receiptHistory', label: 'Receipts', icon: Receipt },
        { id: 'reports', label: 'Reports', icon: FileText },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    // Filter tabs based on user access
    const visibleTabs = tabs.filter(tab => hasAccess(tab.id));

    // For compact widths, move less critical items under More
    const overflowIds = isCompact ? ['receiptHistory', 'reports'] : [];
    const primaryTabs = visibleTabs.filter(t => !overflowIds.includes(t.id));
    const overflowTabs = visibleTabs.filter(t => overflowIds.includes(t.id));

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
            {primaryTabs.map(tab => {
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
                        <Icon
                            size={24}
                            strokeWidth={isActive ? 2.5 : 2}
                            fill={isActive ? "currentColor" : "none"}
                        />
                        <span style={{ fontSize: '0.7rem' }}>{tab.label}</span>
                    </button>
                );
            })}

            {overflowTabs.length > 0 && (
                <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
                    <button
                        onClick={() => setMoreOpen(v => !v)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.35rem',
                            color: 'var(--text-secondary)',
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'color 0.2s',
                            width: '100%'
                        }}
                    >
                        <MoreHorizontal size={24} />
                        <span style={{ fontSize: '0.7rem' }}>More</span>
                    </button>
                    {moreOpen && (
                        <div
                            style={{
                                position: 'absolute',
                                bottom: '2.75rem',
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                                padding: '0.25rem',
                                minWidth: '140px'
                            }}
                            onMouseLeave={() => setMoreOpen(false)}
                        >
                            {overflowTabs.map(tab => {
                                const isActive = currentScreen === tab.id;
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => { setMoreOpen(false); onNavigate(tab.id); }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            width: '100%',
                                            padding: '0.5rem 0.75rem',
                                            background: 'transparent',
                                            border: 'none',
                                            color: isActive ? 'var(--accent-primary)' : 'var(--text-primary)',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <Icon size={18} />
                                        <span style={{ fontSize: '0.85rem' }}>{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default BottomNav;
