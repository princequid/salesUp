import React, { useMemo } from 'react';
import { useInventory } from '../../logic/InventoryContext';
import { useMoneyFormatter } from '../../logic/currencyFormat';
import { useRole } from '../../logic/roleUtils';
import { calculateDailyStats, getTopSellingItems } from '../../logic/reportLogic';
import { TrendingUp, DollarSign, AlertTriangle, Plus, ShoppingCart, FileText, Calculator, Settings } from 'lucide-react';
import PageLayout from '../../components/PageLayout';
import PermissionGate from '../../components/PermissionGate';
import ChartWrapper from '../../components/ChartWrapper';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

// Lightweight count-up animation without external libraries
const CountUpValue = ({ value = 0, formatter = (v) => String(v), duration = 600 }) => {
    const [display, setDisplay] = React.useState(Number(value) || 0);
    const startRef = React.useRef(display);
    const rafRef = React.useRef(null);
    const startTimeRef = React.useRef(null);

    React.useEffect(() => {
        const target = Number(value) || 0;
        if (target === startRef.current) return; // no change

        cancelAnimationFrame(rafRef.current);
        const start = startRef.current;
        startTimeRef.current = null;

        const step = (ts) => {
            if (startTimeRef.current == null) startTimeRef.current = ts;
            const elapsed = ts - startTimeRef.current;
            const t = Math.min(1, elapsed / duration);
            // Ease-out cubic for a smooth finish
            const eased = 1 - Math.pow(1 - t, 3);
            const current = start + (target - start) * eased;
            setDisplay(current);
            if (t < 1) {
                rafRef.current = requestAnimationFrame(step);
            } else {
                startRef.current = target;
                setDisplay(target);
            }
        };

        rafRef.current = requestAnimationFrame(step);
        return () => cancelAnimationFrame(rafRef.current);
    }, [value, duration]);

    return (<span>{formatter(display)}</span>);
};

const Dashboard = ({ onNavigate }) => {
    const { sales, products, settings } = useInventory();
    const money = useMoneyFormatter();
    const { userRole, ROLES } = useRole();

    const stats = useMemo(() =>
        calculateDailyStats(sales, products, settings.lowStockThreshold),
        [sales, products, settings.lowStockThreshold]
    );

    const topSelling = useMemo(() =>
        getTopSellingItems(sales, products),
        [sales, products]
    );

    const threshold = Number(settings.lowStockThreshold) || 5;
    const lowStockItems = useMemo(() => (
        (products || [])
            .filter((p) => (Number(p.quantity) || 0) <= threshold)
            .sort((a, b) => (Number(a.quantity) || 0) - (Number(b.quantity) || 0))
    ), [products, threshold]);

    // Build trend data for the past 14 days (sales & profit)
    const trendData = useMemo(() => {
        const days = 14;
        const map = new Map();
        const now = new Date();
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(now.getDate() - i);
            d.setHours(0, 0, 0, 0);
            const key = d.toISOString().slice(0, 10);
            map.set(key, { date: new Date(d), sales: 0, profit: 0 });
        }

        (sales || []).filter(s => !s.voided).forEach(tx => {
            const d = new Date(tx.date);
            d.setHours(0,0,0,0);
            const key = d.toISOString().slice(0,10);
            if (map.has(key)) {
                const row = map.get(key);
                row.sales += Number(tx.total_price) || 0;
                row.profit += Number(tx.profit) || 0;
            }
        });

        return Array.from(map.values()).map(r => ({
            name: `${r.date.getMonth()+1}/${r.date.getDate()}`,
            sales: Number(r.sales.toFixed(2)),
            profit: Number(r.profit.toFixed(2))
        }));
    }, [sales]);

    return (
        <PageLayout>
            {/* Header */}
            <header style={{ marginBottom: 'var(--spacing-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1>Dashboard</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {settings.businessName || 'Overview'}
                        <span style={{
                            fontSize: '0.7rem',
                            padding: '0.2rem 0.5rem',
                            background: userRole === ROLES.ADMIN ? 'var(--accent-primary)' : 'var(--accent-secondary)',
                            color: '#fff',
                            borderRadius: '12px',
                            fontWeight: 600
                        }}>
                            {userRole === ROLES.ADMIN ? 'ADMIN' : 'CASHIER'}
                        </span>
                    </p>
                </div>
                <PermissionGate screen="settings">
                    <button onClick={() => onNavigate('settings')} style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '50%', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        <Settings size={20} />
                    </button>
                </PermissionGate>
            </header>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
                <div
                    className="glass-panel"
                    style={{ padding: '1.25rem', minHeight: '150px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: '4px solid var(--accent-primary)', transition: 'transform 200ms ease, box-shadow 200ms ease' }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-hover)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--glass-shadow)'; }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)', color: 'var(--text-secondary)' }}>
                        <DollarSign size={24} color="var(--accent-primary)" />
                        <span className="truncate" style={{ fontSize: 'var(--font-sm)', fontWeight: 600 }}>Sales Today</span>
                    </div>
                    <div style={{ fontSize: 'clamp(1.25rem, 2.5vw + 0.5rem, 2rem)', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2, overflowWrap: 'anywhere' }}>
                        <CountUpValue value={stats.totalSales} formatter={money} />
                    </div>
                </div>

                <div
                    className="glass-panel"
                    style={{ padding: '1.25rem', minHeight: '150px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: '4px solid var(--accent-success)', transition: 'transform 200ms ease, box-shadow 200ms ease' }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-hover)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--glass-shadow)'; }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                        <TrendingUp size={24} color="var(--accent-success)" />
                        <span style={{ fontSize: 'var(--font-sm)', fontWeight: 600 }}>Profit Today</span>
                    </div>
                    <div style={{ fontSize: 'clamp(1.25rem, 2.5vw + 0.5rem, 2rem)', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2, overflowWrap: 'anywhere' }}>
                        <CountUpValue value={stats.totalProfit} formatter={money} />
                    </div>
                </div>

                <PermissionGate screen="lowStock">
                    <div className="glass-panel"
                        style={{ padding: '1.25rem', minHeight: '150px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer', borderLeft: '4px solid var(--accent-danger)', transition: 'transform 200ms ease, box-shadow 200ms ease' }}
                        onClick={() => onNavigate('lowStock')}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-hover)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--glass-shadow)'; }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                            <AlertTriangle size={24} color="var(--accent-danger)" />
                            <span style={{ fontSize: 'var(--font-sm)', fontWeight: 600 }}>Low Stock</span>
                        </div>
                        <div style={{ fontSize: 'clamp(1.25rem, 2.5vw + 0.5rem, 2rem)', fontWeight: 800, color: 'var(--accent-danger)', lineHeight: 1.2 }}>
                            <CountUpValue value={stats.lowStockCount} formatter={(v) => Math.round(Number(v) || 0)} />
                        </div>
                    </div>
                </PermissionGate>
            </div>

            {/* Main Sections Grid */}
            <div className="dash-grid" style={{ marginTop: 'var(--spacing-md)' }}>
                {/* Analytics Card with Trend Chart */}
                <div className="glass-panel dash-span-2" style={{ padding: '1.5rem' }}>
                    <h2 className="section-title">Analytics</h2>
                    <div style={{ height: 260 }}>
                        <ChartWrapper>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trendData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                                    <XAxis dataKey="name" stroke="var(--text-secondary)" tickMargin={6} />
                                    <YAxis stroke="var(--text-secondary)" width={60} />
                                    <Tooltip contentStyle={{ borderRadius: 8 }} />
                                    <Line type="monotone" dataKey="sales" name="Sales" stroke="var(--accent-primary)" strokeWidth={2} dot={false} />
                                    <Line type="monotone" dataKey="profit" name="Profit" stroke="var(--accent-success)" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </ChartWrapper>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h2 className="section-title">Recent Activity</h2>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {(sales || []).filter(s => !s.voided).slice(0, 5).map((s, idx) => (
                            <div key={s.id || s.receiptId || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: idx < 4 ? '1px solid var(--border-color)' : 'none' }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: 600 }}>{new Date(s.date).toLocaleString()}</span>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{s.payment_method || 'Cash'}</span>
                                </div>
                                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{money(s.total_price || 0)}</div>
                            </div>
                        ))}
                        {(sales || []).filter(s => !s.voided).length === 0 && (
                            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem' }}>No recent transactions</p>
                        )}
                    </div>
                </div>

                {/* Low Stock Widget */}
                {lowStockItems.length > 0 && (
                    <PermissionGate screen="lowStock">
                        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--accent-danger)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <AlertTriangle size={20} color="var(--accent-danger)" /> Low Stock Alerts
                                </h2>
                                <button onClick={() => onNavigate('lowStock')} style={{ background: 'var(--accent-danger)', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.4rem 0.75rem', cursor: 'pointer', fontWeight: 600 }}>
                                    View all
                                </button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {lowStockItems.slice(0, 5).map((item, idx) => {
                                    const qty = Number(item.quantity) || 0;
                                    const isOut = qty === 0;
                                    const isCritical = qty > 0 && qty <= Math.max(1, Math.floor(threshold / 2));
                                    const dotColor = isOut ? 'var(--accent-danger)' : isCritical ? 'var(--accent-warning)' : 'var(--accent-warning)';
                                    return (
                                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: idx < Math.min(5, lowStockItems.length) - 1 ? '1px solid var(--border-color)' : 'none' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <span style={{ width: 10, height: 10, borderRadius: '50%', background: dotColor, display: 'inline-block' }} />
                                                <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{item.name}</span>
                                            </div>
                                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{qty} left</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </PermissionGate>
                )}

                {/* Top Selling Items */}
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h2 className="section-title">Top Selling Items</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {topSelling.length > 0 ? (
                            topSelling.map((item, index) => (
                                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: index < topSelling.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
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
            </div>

        </PageLayout>
    );
};

export default Dashboard;
