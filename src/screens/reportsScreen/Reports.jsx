/*
 * STABILITY LOCK: This file is considered stable.
 * Do NOT modify logic, charts, or layout without explicit override.
 */
import React, { useState, useMemo } from 'react';
import { useInventory } from '../../logic/InventoryContext';
import { filterSalesByDate, exportToPDF, exportToCSV } from '../../logic/reportLogic';
import { ArrowLeft, Download, FileText, ShoppingCart } from 'lucide-react';
import { AppButton, AppCard, AppIconButton, AppDivider, ChartWrapper, AppEmptyState } from '../../components';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import PageLayout from '../../components/PageLayout';

const Reports = ({ onNavigate }) => {
    const { sales } = useInventory();
    const [filterType, setFilterType] = useState('daily');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    // Derived State: Filtered Sales
    const filteredSales = useMemo(() => {
        return filterSalesByDate(sales, filterType, startDate, endDate);
    }, [sales, filterType, startDate, endDate]);

    // Derived State: Stats
    const stats = useMemo(() => {
        // Simple manual calculation or import calculateTotals if available.
        // Using manual here to avoid import errors if calculateTotals isn't imported yet, 
        // but wait, I can modify imports too. Let's use robust manual calc to be safe and fast.
        const totalSales = filteredSales.reduce((sum, sale) => sum + (sale.total_price || 0), 0);
        const totalProfit = filteredSales.reduce((sum, sale) => sum + (sale.profit || 0), 0);
        return {
            totalSales,
            totalProfit,
            count: filteredSales.length
        };
    }, [filteredSales]);

    // Derived State: Chart Data
    const chartData = useMemo(() => {
        const dataMap = {};

        filteredSales.forEach(sale => {
            const date = new Date(sale.date);
            let key = '';

            if (filterType === 'daily') {
                // Hour 0-23
                const hour = date.getHours();
                key = `${hour}:00`;
            } else if (filterType === 'weekly') {
                // Day Name
                const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                key = days[date.getDay()];
            } else {
                // Date string for monthly/custom
                key = date.toLocaleDateString();
            }

            if (!dataMap[key]) {
                dataMap[key] = { name: key, total: 0 };
            }
            dataMap[key].total += (sale.total_price || 0);
        });

        return Object.values(dataMap);
    }, [filteredSales, filterType]);

    const isChartReady = chartData.length > 0;

    const handleFilterChange = (type) => setFilterType(type);

    const handleExportPDF = () => {
        exportToPDF(stats, filteredSales, filterType);
    };

    const handleExportCSV = () => {
        exportToCSV(filteredSales, filterType);
    };

    const getChartTitle = () => {
        switch (filterType) {
            case 'daily': return "Today's Hourly Sales";
            case 'weekly': return "Weekly Sales Trend";
            case 'monthly': return "Monthly Peformance";
            case 'custom': return "Custom Period Analysis";
            default: return "Sales Overview";
        }
    };

    return (
        <PageLayout>
            {/* Structured Header with Filter */}
            <ReportHeader
                onNavigate={onNavigate}
                filterType={filterType}
                setFilterType={handleFilterChange}
                startDate={startDate}
                setStartDate={setStartDate}
                endDate={endDate}
                setEndDate={setEndDate}
                onExportPDF={handleExportPDF}
                onExportCSV={handleExportCSV}
            />
            {/* ... rest of JSX ... */}

            {/* Summary Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
                <AppCard style={{ padding: 'var(--spacing-md)', textAlign: 'center' }}>
                    <div className="text-caption" style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Total Sales</div>
                    <div className="text-h2" style={{ fontWeight: 'bold' }}>${stats.totalSales.toFixed(2)}</div>
                </AppCard>
                <AppCard style={{ padding: 'var(--spacing-md)', textAlign: 'center' }}>
                    <div className="text-caption" style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Total Profit</div>
                    <div className="text-h2" style={{ fontWeight: 'bold', color: 'var(--accent-success)' }}>${stats.totalProfit.toFixed(2)}</div>
                </AppCard>
                <AppCard style={{ padding: 'var(--spacing-md)', textAlign: 'center' }}>
                    <div className="text-caption" style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Transactions</div>
                    <div className="text-h2" style={{ fontWeight: 'bold' }}>{stats.count}</div>
                </AppCard>
            </div>

            {/* Chart */}
            <AppCard style={{
                padding: 'var(--spacing-lg)',
                marginBottom: 'var(--spacing-lg)',
                height: '400px',
                display: 'flex',
                flexDirection: 'column',
                /* Fix: Ensure stability by disabling transforms/animations on the chart card */
                transform: 'none',
                transition: 'none',
                animation: 'none'
            }}>
                <h3 className="text-h3" style={{ marginBottom: 'var(--spacing-md)' }}>{getChartTitle()}</h3>
                {filteredSales.length > 0 ? (
                    <ChartWrapper style={{ flex: 1, minHeight: '280px' }}>
                        {isChartReady && (
                            <ResponsiveContainer width="100%" height="100%">
                                {filterType === 'monthly' || filterType === 'weekly' || filterType === 'custom' ? (
                                    <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 25, left: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} stroke="var(--text-secondary)" />
                                        <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                                        <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'var(--bg-card)', border: 'var(--glass-border)', color: 'var(--text-primary)', borderRadius: 'var(--radius-md)' }}
                                            formatter={(value) => [`$${value.toFixed(2)}`, 'Sales']}
                                        />
                                        <Line type="monotone" dataKey="total" stroke="var(--accent-primary)" strokeWidth={3} dot={{ fill: 'var(--accent-primary)', r: 4 }} activeDot={{ r: 6 }} />
                                    </LineChart>
                                ) : (
                                    <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 25, left: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} stroke="var(--text-secondary)" />
                                        <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                                        <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                                        <Tooltip
                                            cursor={{ fill: 'var(--bg-secondary)', opacity: 0.5 }}
                                            contentStyle={{ backgroundColor: 'var(--bg-card)', border: 'var(--glass-border)', color: 'var(--text-primary)', borderRadius: 'var(--radius-md)' }}
                                            formatter={(value) => [`$${value.toFixed(2)}`, 'Sales']}
                                        />
                                        <Bar dataKey="total" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} barSize={40} />
                                    </BarChart>
                                )}
                            </ResponsiveContainer>
                        )}
                    </ChartWrapper>
                ) : (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <AppEmptyState
                            title="No sales data available"
                            message="Record your first sale to see reports for this period."
                            icon={ShoppingCart}
                            action={
                                <AppButton variant="primary" onClick={() => onNavigate('dashboard')}>
                                    Record Sale
                                </AppButton>
                            }
                        />
                    </div>
                )}
            </AppCard>

            {/* Export Actions */}

        </PageLayout>
    );
};

const ReportHeader = ({ onNavigate, filterType, setFilterType, startDate, setStartDate, endDate, setEndDate, onExportPDF, onExportCSV }) => (
    <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-lg)',
        marginBottom: 'var(--spacing-lg)',
        // Critical: Stability locks
        transform: 'none',
        transition: 'none',
        animation: 'none',
        position: 'relative',
        zIndex: 10
    }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                <AppIconButton icon={ArrowLeft} onClick={() => onNavigate('dashboard')} size={24} color="var(--text-primary)" />
                <h1 className="text-h1">Reports</h1>
            </div>

            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                <AppButton
                    onClick={onExportPDF}
                    variant="secondary"
                    icon={FileText}
                    size="small"
                    style={{ transform: 'none', transition: 'none' }}
                >
                    PDF
                </AppButton>
                <AppButton
                    onClick={onExportCSV}
                    variant="outline"
                    icon={Download}
                    size="small"
                    style={{ transform: 'none', transition: 'none' }}
                >
                    CSV
                </AppButton>
            </div>
        </div>

        {/* Filter Toggle */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            <AppCard style={{
                padding: '0.5rem',
                display: 'inline-flex',
                gap: '0.5rem',
                borderRadius: 'var(--radius-md)',
                background: 'transparent',
                border: 'none',
                boxShadow: 'none',
                pointerEvents: 'auto'
            }}>
                {['daily', 'weekly', 'monthly', 'custom'].map(f => (
                    <AppButton
                        key={f}
                        onClick={() => setFilterType(f)}
                        variant={filterType === f ? 'primary' : 'ghost'}
                        size="small"
                        style={{
                            textTransform: 'capitalize',
                            fontWeight: filterType === f ? 600 : 500,
                            borderRadius: 'var(--radius-md)',
                            transform: 'none',
                            transition: 'none',
                            opacity: filterType === f ? 1 : 0.7
                        }}
                    >
                        {f}
                    </AppButton>
                ))}
            </AppCard>

            {/* Custom Date Range Inputs */}
            {filterType === 'custom' && (
                <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center', paddingLeft: '0.5rem' }}>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        style={{
                            padding: '0.5rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-card)',
                            color: 'var(--text-primary)',
                            fontFamily: 'inherit',
                            outline: 'none'
                        }}
                    />
                    <span style={{ color: 'var(--text-secondary)' }}>to</span>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        style={{
                            padding: '0.5rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-card)',
                            color: 'var(--text-primary)',
                            fontFamily: 'inherit',
                            outline: 'none'
                        }}
                    />
                </div>
            )}
        </div>
    </div>
);

export default Reports;
