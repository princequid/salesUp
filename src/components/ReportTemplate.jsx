import React from 'react';

const formatDate = (d) => {
    try {
        return new Date(d).toLocaleDateString();
    } catch {
        return String(d || '');
    }
};

const ReportTemplate = ({
    storeName,
    reportType,
    range,
    totalSales,
    transactionCount,
    itemSummary
}) => {
    return (
        <div style={{
            background: '#fff',
            color: '#111',
            width: '210mm',
            minHeight: '297mm',
            padding: '18mm 16mm',
            boxSizing: 'border-box',
            fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
            lineHeight: 1.35
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12mm', marginBottom: '10mm' }}>
                <div>
                    <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>{storeName || 'Store'}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                        Sales Report ({String(reportType || '').toUpperCase()})
                    </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: 11, color: '#333' }}>
                    <div style={{ fontWeight: 600 }}>Date range</div>
                    <div>
                        {range?.start ? formatDate(range.start) : ''}
                        {' '}–{' '}
                        {range?.end ? formatDate(range.end) : ''}
                    </div>
                    <div style={{ marginTop: 6 }}>
                        Generated: {new Date().toLocaleString()}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8mm', marginBottom: '10mm' }}>
                <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: '6mm' }}>
                    <div style={{ fontSize: 11, color: '#555', marginBottom: 4 }}>Total sales</div>
                    <div style={{ fontSize: 20, fontWeight: 800 }}>{totalSales}</div>
                </div>
                <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: '6mm' }}>
                    <div style={{ fontSize: 11, color: '#555', marginBottom: 4 }}>Number of transactions</div>
                    <div style={{ fontSize: 20, fontWeight: 800 }}>{transactionCount}</div>
                </div>
            </div>

            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }}>Itemized sales summary</div>
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                    <thead>
                        <tr style={{ background: '#f3f4f6' }}>
                            <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid #e5e7eb' }}>Product</th>
                            <th style={{ textAlign: 'right', padding: '10px 12px', borderBottom: '1px solid #e5e7eb', width: '18%' }}>Qty</th>
                            <th style={{ textAlign: 'right', padding: '10px 12px', borderBottom: '1px solid #e5e7eb', width: '22%' }}>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(itemSummary || []).map((row, idx) => (
                            <tr key={row.id || row.name || idx}>
                                <td style={{ padding: '9px 12px', borderBottom: '1px solid #f1f5f9' }}>{row.name}</td>
                                <td style={{ padding: '9px 12px', borderBottom: '1px solid #f1f5f9', textAlign: 'right' }}>{row.quantity}</td>
                                <td style={{ padding: '9px 12px', borderBottom: '1px solid #f1f5f9', textAlign: 'right' }}>{row.totalFormatted}</td>
                            </tr>
                        ))}
                        {(!itemSummary || itemSummary.length === 0) && (
                            <tr>
                                <td colSpan={3} style={{ padding: '16px 12px', textAlign: 'center', color: '#6b7280' }}>
                                    No sales for this period.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ReportTemplate;
