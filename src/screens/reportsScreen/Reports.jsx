import React, { useState, useMemo } from 'react';
import { useInventory } from '../../logic/InventoryContext';
import { filterSalesByDate, exportToPDF, exportToCSV } from '../../logic/reportLogic';
import { ArrowLeft, Download, FileText } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const Reports = ({ onNavigate }) => {
    const { sales, products } = useInventory();
    const [filterType, setFilterType] = useState('daily'); // daily, weekly, monthly

    // Filter data
    const filteredSales = useMemo(() =>
        filterSalesByDate(sales, filterType),
        [sales, filterType]
    );

    // Calculate aggregated stats
    const stats = useMemo(() => {
        const totalSales = filteredSales.reduce((sum, s) => sum + s.total_price, 0);
        const totalProfit = filteredSales.reduce((sum, s) => sum + s.profit, 0);
        return { totalSales, totalProfit, count: filteredSales.length };
    }, [filteredSales]);

    // Prepare chart data based on filter type
    const chartData = useMemo(() => {
        if (filterType === 'daily') {
            // Daily: Sales by Product
            const dataMap = {};
            filteredSales.forEach(sale => {
                const product = products.find(p => p.id === sale.product_id);
                const name = product ? product.name : 'Unknown';
                dataMap[name] = (dataMap[name] || 0) + sale.total_price;
            });
            return Object.entries(dataMap).map(([name, total]) => ({ name, total }));
        }

        if (filterType === 'weekly') {
            // Weekly: Sales by Day (Last 7 Days logic usually, but let's aggregate by Day Name)
            // Better approach: Create past 7 days buckets to ensure empty days show up
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            // Initialize map with 0 for observed days if we want, or just accumulate existing
            // Simple accumulation:
            const dataMap = {};

            // To sort correctly, maybe better to use date sorting, but for simplicity let's just group by keys
            // If we want a true timeline, we should sort by date. 
            // Let's create an array of specific dates for the sales present, sorted.
            const salesByDate = {};

            filteredSales.forEach(sale => {
                const d = new Date(sale.date);
                const dayName = days[d.getDay()];
                // We might collide if data spans > 1 week, but "weekly" filter is last 7 days usually.
                // Let's use Date String to be safe and sort
                const dateKey = d.toLocaleDateString('en-US', { weekday: 'short' });
                // Actually if we want specific order we need the time.
                // Let's just use MM/DD
                const label = `${d.getMonth() + 1}/${d.getDate()}`;

                salesByDate[label] = (salesByDate[label] || 0) + sale.total_price;
            });

            // Sort by date key is tricky if string. 
            // Let's just map the filtered Sales, sort them by date, then aggregate.
            // Easier: 
            // 1. Sort filteredSales by date
            const sortedSales = [...filteredSales].sort((a, b) => new Date(a.date) - new Date(b.date));

            // 2. Aggregate
            const agg = {};
            sortedSales.forEach(s => {
                const d = new Date(s.date);
                const label = filterType === 'weekly'
                    ? d.toLocaleDateString('en-US', { weekday: 'short' }) // Mon, Tue
                    : `${d.getMonth() + 1}/${d.getDate()}`; // 12/25

                agg[label] = (agg[label] || 0) + s.total_price;
            });

            return Object.entries(agg).map(([name, total]) => ({ name, total }));
        }

        if (filterType === 'monthly') {
            // Monthly: trend by date using MM/DD
            const sortedSales = [...filteredSales].sort((a, b) => new Date(a.date) - new Date(b.date));
            const agg = {};
            sortedSales.forEach(s => {
                const d = new Date(s.date);
                const label = `${d.getMonth() + 1}/${d.getDate()}`;
                agg[label] = (agg[label] || 0) + s.total_price;
            });
            return Object.entries(agg).map(([name, total]) => ({ name, total }));
        }

        return [];
    }, [filteredSales, products, filterType]);

    const handleExportPDF = () => exportToPDF(stats, filteredSales, filterType);
    const handleExportCSV = () => exportToCSV(filteredSales, filterType);

    // Chart Title Helper
    const getChartTitle = () => {
        if (filterType === 'daily') return "Sales by Product";
        if (filterType === 'weekly') return "Weekly Sales Trend";
        if (filterType === 'monthly') return "Monthly Sales Trend";
    };

    return (
        <div className="container" style={{ paddingBottom: '2rem' }}>
            <header style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button
                    onClick={() => onNavigate('dashboard')}
                    style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Reports</h1>
            </header>

            {/* Filter Toggle */}
            <div className="glass-panel" style={{ padding: '0.5rem', display: 'inline-flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {['daily', 'weekly', 'monthly'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilterType(f)}
                        style={{
                            padding: '0.5rem 1rem',
                            border: 'none',
                            background: filterType === f ? 'var(--accent-primary)' : 'transparent',
                            color: filterType === f ? '#fff' : 'var(--text-secondary)',
                            fontWeight: filterType === f ? 600 : 400,
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer',
                            textTransform: 'capitalize',
                            transition: 'all 0.2s'
                        }}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Summary Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                <div className="glass-panel" style={{ padding: '1rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Total Sales</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>${stats.totalSales.toFixed(2)}</div>
                </div>
                <div className="glass-panel" style={{ padding: '1rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Total Profit</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--accent-success)' }}>${stats.totalProfit.toFixed(2)}</div>
                </div>
                <div className="glass-panel" style={{ padding: '1rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Transactions</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{stats.count}</div>
                </div>
            </div>

            {/* Chart */}
            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', height: '350px' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>{getChartTitle()}</h3>
                <ResponsiveContainer width="100%" height="100%">
                    {filterType === 'monthly' ? (
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
                            <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                            <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'var(--bg-card)', border: 'var(--glass-border)', color: 'var(--text-primary)', borderRadius: 'var(--radius-md)' }}
                                formatter={(value) => [`$${value.toFixed(2)}`, 'Sales']}
                            />
                            <Line type="monotone" dataKey="total" stroke="var(--accent-primary)" strokeWidth={3} dot={{ fill: 'var(--accent-primary)', r: 4 }} activeDot={{ r: 6 }} />
                        </LineChart>
                    ) : (
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
                            <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                            <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{ backgroundColor: 'var(--bg-card)', border: 'var(--glass-border)', color: 'var(--text-primary)', borderRadius: 'var(--radius-md)' }}
                                formatter={(value) => [`$${value.toFixed(2)}`, 'Sales']}
                            />
                            <Bar dataKey="total" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} barSize={filterType === 'daily' ? 40 : 20} />
                        </BarChart>
                    )}
                </ResponsiveContainer>
            </div>

            {/* Export Actions */}
            <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={handleExportPDF} className="btn" style={{ background: 'var(--bg-secondary)', border: 'var(--glass-border)', color: 'var(--text-primary)', flex: 1, justifyContent: 'center' }}>
                    <FileText size={18} style={{ marginRight: '0.5rem' }} /> Export PDF
                </button>
                <button onClick={handleExportCSV} className="btn" style={{ background: 'var(--bg-secondary)', border: 'var(--glass-border)', color: 'var(--text-primary)', flex: 1, justifyContent: 'center' }}>
                    <Download size={18} style={{ marginRight: '0.5rem' }} /> Export CSV
                </button>
            </div>
        </div>
    );
};

export default Reports;
