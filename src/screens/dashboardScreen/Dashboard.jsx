import React, { useMemo } from 'react';
import { useInventory } from '../../logic/InventoryContext';
import { calculateDailyStats, getTopSellingItems } from '../../logic/reportLogic';
import { TrendingUp, DollarSign, AlertTriangle, Plus, ShoppingCart, FileText, Calculator, Settings } from 'lucide-react';
import PageLayout from '../../components/PageLayout';

const Dashboard = ({ onNavigate }) => {
    const { sales, products, settings } = useInventory();

    const stats = useMemo(() =>
        calculateDailyStats(sales, products, settings.lowStockThreshold),
        [sales, products, settings.lowStockThreshold]
    );

    const topSelling = useMemo(() =>
        getTopSellingItems(sales, products),
        [sales, products]
    );

    return (
        <PageLayout>
            {/* Header */}
            <header style={{ marginBottom: 'var(--spacing-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1>Dashboard</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{settings.businessName || 'Overview'}</p>
                </div>
                <button onClick={() => onNavigate('settings')} style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '50%', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    <Settings size={20} />
                </button>
            </header>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
                <div className="glass-panel" style={{ padding: '1.25rem', minHeight: '150px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: '4px solid var(--accent-primary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)', color: 'var(--text-secondary)' }}>
                        <DollarSign size={24} color="var(--accent-primary)" />
                        <span className="truncate" style={{ fontSize: 'var(--font-sm)', fontWeight: 600 }}>Sales Today</span>
                    </div>
                    <div className="truncate" style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>${stats.totalSales.toFixed(2)}</div>
                </div>

                <div className="glass-panel" style={{ padding: '1.25rem', minHeight: '150px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: '4px solid var(--accent-success)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                        <TrendingUp size={24} color="var(--accent-success)" />
                        <span style={{ fontSize: 'var(--font-sm)', fontWeight: 600 }}>Profit Today</span>
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>${stats.totalProfit.toFixed(2)}</div>
                </div>

                <div className="glass-panel"
                    style={{ padding: '1.25rem', minHeight: '150px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer', borderLeft: '4px solid var(--accent-danger)' }}
                    onClick={() => onNavigate('lowStock')}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                        <AlertTriangle size={24} color="var(--accent-danger)" />
                        <span style={{ fontSize: 'var(--font-sm)', fontWeight: 600 }}>Low Stock</span>
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-danger)' }}>{stats.lowStockCount}</div>
                </div>
            </div>

            {/* Top Selling Items */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h2 style={{ marginBottom: '1.25rem' }}>Top Selling Items</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {topSelling.length > 0 ? (
                        topSelling.map((item, index) => (
                            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: index < topSelling.length - 1 ? '1px solid #E2E8F0' : 'none' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <span style={{
                                        width: '24px',
                                        height: '24px',
                                        background: index === 0 ? 'var(--accent-warning)' : 'var(--bg-secondary)',
                                        color: index === 0 ? '#fff' : 'var(--text-secondary)',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.75rem',
                                        fontWeight: 'bold'
                                    }}>
                                        {index + 1}
                                    </span>
                                    <span style={{ fontWeight: 500 }}>{item.name}</span>
                                </div>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{item.quantity} units</span>
                            </div>
                        ))
                    ) : (
                        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem' }}>No sales today</p>
                    )}
                </div>
            </div>

        </PageLayout>
    );
};

export default Dashboard;
