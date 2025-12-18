/*
 * STABILITY LOCK: This file is considered stable.
 * Do NOT modify logic, charts, or layout without explicit override.
 */
import React, { useState, useMemo } from 'react';
import { useInventory } from '../../logic/InventoryContext';
import PermissionGate from '../../components/PermissionGate';
import { useMoneyFormatter } from '../../logic/currencyFormat';
import { filterSalesByDate, exportToCSV } from '../../logic/reportLogic';
import { useRole } from '../../logic/roleUtils';
import { useStore } from '../../logic/storeContextImpl';
import { ArrowLeft, Download, FileText, ShoppingCart } from 'lucide-react';
import { AppButton, AppCard, AppIconButton, AppDivider, ChartWrapper, AppEmptyState, AppModal, ReportTemplate } from '../../components';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import PageLayout from '../../components/PageLayout';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Reports = ({ onNavigate }) => {
    const { sales, products, settings } = useInventory();
    const money = useMoneyFormatter();
    const { userRole, ROLES } = useRole();
    const { activeStore } = useStore();
    const [filterType, setFilterType] = useState('daily');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    const isAdminMode = userRole === ROLES.ADMIN;

    // Derived State: Filtered Sales
    const filteredSales = useMemo(() => {
        return filterSalesByDate(sales, filterType, startDate, endDate);
    }, [sales, filterType, startDate, endDate]);

    // Derived State: Stats
    const stats = useMemo(() => {
        const totalSales = filteredSales.reduce((sum, sale) => sum + (sale.total_price || 0), 0);
        const totalProfit = isAdminMode ? filteredSales.reduce((sum, sale) => sum + (sale.profit || 0), 0) : 0;
        return {
            totalSales,
            totalProfit,
            count: filteredSales.length
        };
    }, [filteredSales, isAdminMode]);

    const reportRange = useMemo(() => {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayEnd = new Date(todayStart);
        todayEnd.setHours(23, 59, 59, 999);

        if (filterType === 'custom') {
            const start = startDate ? new Date(startDate) : todayStart;
            start.setHours(0, 0, 0, 0);
            const end = endDate ? new Date(endDate) : todayEnd;
            end.setHours(23, 59, 59, 999);
            return { start, end };
        }

        if (filterType === 'weekly') {
            const start = new Date(todayStart);
            start.setDate(start.getDate() - 7);
            return { start, end: todayEnd };
        }

        if (filterType === 'monthly') {
            const start = new Date(todayStart);
            start.setMonth(start.getMonth() - 1);
            return { start, end: todayEnd };
        }

        return { start: todayStart, end: todayEnd };
    }, [filterType, startDate, endDate]);

    const itemSummary = useMemo(() => {
        const map = new Map();

        const resolveProductName = (id) => {
            const p = (products || []).find((x) => x.id === id);
            return p?.name || 'Unknown Product';
        };

        (filteredSales || []).forEach((tx) => {
            if (tx?.items && Array.isArray(tx.items)) {
                tx.items.forEach((item) => {
                    const id = item.productId || item.product_id || item.id || '';
                    const name = item.name || resolveProductName(id);
                    const qty = Number(item.quantity) || 0;
                    const total = Number(item.total ?? item.lineTotal ?? 0) || 0;

                    const key = id || name;
                    const current = map.get(key) || { id, name, quantity: 0, total: 0 };
                    map.set(key, {
                        ...current,
                        name,
                        quantity: current.quantity + qty,
                        total: current.total + total
                    });
                });
                return;
            }

            const id = tx.productId || tx.product_id || tx.id || '';
            const name = resolveProductName(id);
            const qty = Number(tx.quantity) || 0;
            const total = Number(tx.total_price) || 0;
            const key = id || name;
            const current = map.get(key) || { id, name, quantity: 0, total: 0 };
            map.set(key, {
                ...current,
                name,
                quantity: current.quantity + qty,
                total: current.total + total
            });
        });

        return Array.from(map.values())
            .sort((a, b) => b.total - a.total)
            .map((row) => ({
                ...row,
                totalFormatted: money(row.total)
            }));
    }, [filteredSales, products, money]);

    const reportPayload = useMemo(() => {
        const storeName = activeStore?.name || settings?.businessName || 'Store';
        const reportType = filterType;
        return {
            storeName,
            reportType,
            range: reportRange,
            totalSalesFormatted: money(stats.totalSales),
            transactionCount: stats.count,
            itemSummary
        };
    }, [activeStore, settings, filterType, reportRange, stats.totalSales, stats.count, itemSummary, money]);

    const generateReportPdfBlobUrl = async () => {
        const { storeName, reportType, range, totalSalesFormatted, transactionCount, itemSummary: rows } = reportPayload;

        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        doc.setFont('helvetica', 'normal');

        const title = `${storeName} - Sales Report (${String(reportType || '').toUpperCase()})`;
        doc.setFontSize(14);
        doc.text(title, 14, 18);

        const rangeText = `Date range: ${range?.start ? new Date(range.start).toLocaleDateString() : ''} - ${range?.end ? new Date(range.end).toLocaleDateString() : ''}`;
        doc.setFontSize(10);
        doc.text(rangeText, 14, 26);
        doc.text(`Total sales: ${totalSalesFormatted}`, 14, 32);
        doc.text(`Transactions: ${transactionCount}`, 14, 38);

        autoTable(doc, {
            head: [['Product', 'Qty', 'Total']],
            body: (rows || []).map((r) => [r.name, String(r.quantity), r.totalFormatted]),
            startY: 46,
            styles: { fontSize: 9, cellPadding: 3 },
            headStyles: { fillColor: [243, 244, 246], textColor: [17, 24, 39] },
            columnStyles: {
                1: { halign: 'right' },
                2: { halign: 'right' }
            },
            margin: { left: 14, right: 14 }
        });

        const blob = doc.output('blob');
        return URL.createObjectURL(blob);
    };

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
        setIsPreviewOpen(true);
    };

    const handleExportCSV = () => {
        exportToCSV(filteredSales, filterType, { includeProfit: isAdminMode });
    };

    const handleDownloadPdf = async () => {
        if (isGenerating) return;
        setIsGenerating(true);
        try {
            const url = await generateReportPdfBlobUrl();
            const link = document.createElement('a');
            link.href = url;
            link.download = `sales-report-${String(reportPayload.reportType || 'period')}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(url), 10_000);
        } finally {
            setIsGenerating(false);
        }
    };

    const handlePrintPdf = async () => {
        if (isGenerating) return;
        setIsGenerating(true);
        try {
            const url = await generateReportPdfBlobUrl();
            const w = window.open(url, '_blank', 'noopener,noreferrer');
            if (!w) {
                alert('Popup blocked. Please allow popups to print the report.');
                return;
            }
            w.addEventListener('load', () => {
                try {
                    w.focus();
                    w.print();
                } catch {
                    // ignore
                }
            });
            setTimeout(() => URL.revokeObjectURL(url), 30_000);
        } finally {
            setIsGenerating(false);
        }
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
            <div style={{ display: 'grid', gridTemplateColumns: isAdminMode ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
                <AppCard style={{ padding: 'var(--spacing-md)', textAlign: 'center' }}>
                    <div className="text-caption" style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Total Sales</div>
                    <div className="text-h2" style={{ fontWeight: 'bold' }}>{money(stats.totalSales)}</div>
                </AppCard>
                {isAdminMode && (
                    <AppCard style={{ padding: 'var(--spacing-md)', textAlign: 'center' }}>
                        <div className="text-caption" style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Total Profit</div>
                        <div className="text-h2" style={{ fontWeight: 'bold', color: 'var(--accent-success)' }}>{money(stats.totalProfit)}</div>
                    </AppCard>
                )}
                <AppCard style={{ padding: 'var(--spacing-md)', textAlign: 'center' }}>
                    <div className="text-caption" style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Transactions</div>
                    <div className="text-h2" style={{ fontWeight: 'bold' }}>{stats.count}</div>
                </AppCard>
            </div>

            <AppCard style={{ padding: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
                    <div>
                        <h3 className="text-h3" style={{ marginBottom: '0.25rem' }}>Report / Print</h3>
                        <div className="text-caption" style={{ color: 'var(--text-secondary)' }}>
                            Date range: {reportRange.start.toLocaleDateString()} - {reportRange.end.toLocaleDateString()}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                        <PermissionGate action="reports.export">
                            <AppButton variant="secondary" icon={FileText} onClick={() => setIsPreviewOpen(true)} disabled={isGenerating}>
                                Preview
                            </AppButton>
                        </PermissionGate>
                        <PermissionGate action="reports.export">
                            <AppButton variant="outline" icon={Download} onClick={handleDownloadPdf} disabled={isGenerating}>
                                Download PDF
                            </AppButton>
                        </PermissionGate>
                    </div>
                </div>
            </AppCard>

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
                                        <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => money(val)} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'var(--bg-card)', border: 'var(--glass-border)', color: 'var(--text-primary)', borderRadius: 'var(--radius-md)' }}
                                            formatter={(value) => [money(value), 'Sales']}
                                        />
                                        <Line type="monotone" dataKey="total" stroke="var(--accent-primary)" strokeWidth={3} dot={{ fill: 'var(--accent-primary)', r: 4 }} activeDot={{ r: 6 }} />
                                    </LineChart>
                                ) : (
                                    <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 25, left: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} stroke="var(--text-secondary)" />
                                        <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                                        <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => money(val)} />
                                        <Tooltip
                                            cursor={{ fill: 'var(--bg-secondary)', opacity: 0.5 }}
                                            contentStyle={{ backgroundColor: 'var(--bg-card)', border: 'var(--glass-border)', color: 'var(--text-primary)', borderRadius: 'var(--radius-md)' }}
                                            formatter={(value) => [money(value), 'Sales']}
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

            <AppModal
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                title="Report Preview"
                maxWidth="960px"
                maxHeight="92vh"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        <PermissionGate action="reports.export">
                            <AppButton variant="secondary" onClick={handlePrintPdf} disabled={isGenerating}>
                                Print
                            </AppButton>
                        </PermissionGate>
                        <PermissionGate action="reports.export">
                            <AppButton variant="outline" onClick={handleDownloadPdf} disabled={isGenerating}>
                                Download PDF
                            </AppButton>
                        </PermissionGate>
                    </div>

                    <div style={{
                        overflowX: 'auto',
                        padding: '0.5rem',
                        background: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <ReportTemplate
                                storeName={reportPayload.storeName}
                                reportType={reportPayload.reportType}
                                range={reportPayload.range}
                                totalSales={reportPayload.totalSalesFormatted}
                                transactionCount={reportPayload.transactionCount}
                                itemSummary={reportPayload.itemSummary}
                            />
                        </div>
                    </div>
                </div>
            </AppModal>

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
                <PermissionGate action="reports.export">
                    <AppButton
                        onClick={onExportPDF}
                        variant="secondary"
                        icon={FileText}
                        size="small"
                        style={{ transform: 'none', transition: 'none' }}
                    >
                        Preview
                    </AppButton>
                </PermissionGate>
                <PermissionGate action="reports.export">
                    <AppButton
                        onClick={onExportCSV}
                        variant="outline"
                        icon={Download}
                        size="small"
                        style={{ transform: 'none', transition: 'none' }}
                    >
                        CSV
                    </AppButton>
                </PermissionGate>
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
