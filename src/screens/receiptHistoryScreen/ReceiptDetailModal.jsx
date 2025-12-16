import React from 'react';
import { useCurrency } from '../../logic/CurrencyContext';
import { Printer, Download, X } from 'lucide-react';
import { AppButton, AppCard } from '../../components';
import jsPDF from 'jspdf';

const ReceiptDetailModal = ({ receipt, onClose }) => {
    const { currency } = useCurrency();
    
    const handlePrintReceipt = () => {
        window.print();
    };

    const handleDownloadPDF = () => {
        if (!receipt) return;

        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: [80, 200] // Receipt paper width (80mm) and flexible height
        });

        // Set font
        doc.setFont('courier');

        let yPos = 10;
        const pageWidth = 80;
        const margin = 5;

        // Header
        doc.setFontSize(16);
        doc.setFont('courier', 'bold');
        doc.text('RECEIPT', pageWidth / 2, yPos, { align: 'center' });
        yPos += 8;

        // Date and Receipt ID
        doc.setFontSize(9);
        doc.setFont('courier', 'normal');
        const dateStr = new Date(receipt.date).toLocaleString();
        doc.text(dateStr, pageWidth / 2, yPos, { align: 'center' });
        yPos += 5;
        doc.text(`Receipt #: ${receipt.receiptId || receipt.id}`, pageWidth / 2, yPos, { align: 'center' });
        yPos += 4;
        doc.text(`Payment: ${receipt.paymentMethod || 'Cash'}`, pageWidth / 2, yPos, { align: 'center' });
        yPos += 8;

        // Line separator
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 5;

        // Items header
        doc.setFontSize(8);
        doc.setFont('courier', 'bold');
        doc.text('Item', margin, yPos);
        doc.text('Qty', pageWidth - margin - 35, yPos);
        doc.text('Price', pageWidth - margin - 20, yPos);
        doc.text('Total', pageWidth - margin, yPos, { align: 'right' });
        yPos += 4;

        // Items
        doc.setFont('courier', 'normal');
        receipt.items.forEach(item => {
            // Item name (may wrap)
            const itemName = item.name.length > 20 ? item.name.substring(0, 20) : item.name;
            doc.text(itemName, margin, yPos);
            doc.text(String(item.quantity), pageWidth - margin - 35, yPos);
            doc.text(`${currency.symbol}${item.price.toFixed(2)}`, pageWidth - margin - 20, yPos);
            doc.text(`${currency.symbol}${item.lineTotal.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
            yPos += 5;
        });

        // Line separator
        yPos += 2;
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 5;

        // Totals
        doc.setFontSize(9);
        doc.text('Subtotal:', margin, yPos);
        doc.text(`${currency.symbol}${receipt.subtotal.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
        yPos += 5;

        doc.text('Tax:', margin, yPos);
        doc.text(`${currency.symbol}${receipt.tax.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
        yPos += 5;

        doc.text('Discount:', margin, yPos);
        doc.text(`-${currency.symbol}${receipt.discount.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
        yPos += 7;

        // Total
        doc.setFont('courier', 'bold');
        doc.setFontSize(11);
        doc.text('TOTAL:', margin, yPos);
        doc.text(`${currency.symbol}${receipt.total.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
        yPos += 8;

        // Footer
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 5;
        doc.setFontSize(8);
        doc.setFont('courier', 'normal');
        doc.text('Thank you for your business!', pageWidth / 2, yPos, { align: 'center' });

        // Save PDF
        doc.save(`receipt-${receipt.receiptId || receipt.id}.pdf`);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
        }}>
            <AppCard
                className="receipt-print-content"
                style={{
                    maxWidth: '450px',
                    width: '90%',
                    maxHeight: '85vh',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    padding: 'var(--spacing-xl)',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative'
                }}>
                
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="no-print"
                    style={{
                        position: 'absolute',
                        top: 'var(--spacing-md)',
                        right: 'var(--spacing-md)',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'var(--text-primary)',
                        transition: 'all 0.2s',
                        zIndex: 10
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--accent-danger)';
                        e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'var(--bg-secondary)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                    }}
                >
                    <X size={18} />
                </button>

                {/* Receipt Header */}
                <div style={{ 
                    textAlign: 'center', 
                    marginBottom: 'var(--spacing-lg)', 
                    borderBottom: '2px solid var(--border-color)', 
                    paddingBottom: 'var(--spacing-md)',
                    paddingTop: 'var(--spacing-md)'
                }}>
                    <h2 style={{ margin: 0, fontSize: '1.5rem' }}>RECEIPT</h2>
                    <p style={{ 
                        margin: '0.5rem 0 0 0', 
                        fontSize: '0.875rem', 
                        color: 'var(--text-secondary)' 
                    }}>
                        {formatDate(receipt.date)}
                    </p>
                    <p style={{ 
                        margin: '0.25rem 0 0 0', 
                        fontSize: '0.75rem', 
                        color: 'var(--text-secondary)' 
                    }}>
                        Receipt #: {receipt.receiptId || receipt.id}
                    </p>
                    <p style={{ 
                        margin: '0.25rem 0 0 0', 
                        fontSize: '0.75rem', 
                        color: 'var(--text-secondary)' 
                    }}>
                        Payment: {receipt.paymentMethod || 'Cash'}
                    </p>
                </div>

                {/* Items Table */}
                <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                    <table style={{ 
                        width: '100%', 
                        borderCollapse: 'collapse', 
                        fontFamily: 'monospace', 
                        fontSize: '0.875rem' 
                    }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <th style={{ 
                                    textAlign: 'left', 
                                    padding: '0.5rem 0', 
                                    fontWeight: 600 
                                }}>Item</th>
                                <th style={{ 
                                    textAlign: 'center', 
                                    padding: '0.5rem 0', 
                                    fontWeight: 600 
                                }}>Qty</th>
                                <th style={{ 
                                    textAlign: 'right', 
                                    padding: '0.5rem 0', 
                                    fontWeight: 600 
                                }}>Price</th>
                                <th style={{ 
                                    textAlign: 'right', 
                                    padding: '0.5rem 0', 
                                    fontWeight: 600 
                                }}>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {receipt.items.map((item, index) => (
                                <tr key={index} style={{ 
                                    borderBottom: '1px dashed var(--border-color)' 
                                }}>
                                    <td style={{ padding: '0.5rem 0' }}>{item.name}</td>
                                    <td style={{ 
                                        textAlign: 'center', 
                                        padding: '0.5rem 0' 
                                    }}>{item.quantity}</td>
                                    <td style={{ 
                                        textAlign: 'right', 
                                        padding: '0.5rem 0' 
                                    }}>${item.price.toFixed(2)}</td>
                                    <td style={{ 
                                        textAlign: 'right', 
                                        padding: '0.5rem 0' 
                                    }}>${item.lineTotal.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totals */}
                <div style={{ 
                    borderTop: '2px solid var(--border-color)', 
                    paddingTop: 'var(--spacing-md)', 
                    marginBottom: 'var(--spacing-lg)', 
                    fontFamily: 'monospace' 
                }}>
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        marginBottom: '0.5rem', 
                        fontSize: '0.875rem' 
                    }}>
                        <span>Subtotal:</span>
                        <span>${receipt.subtotal.toFixed(2)}</span>
                    </div>
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        marginBottom: '0.5rem', 
                        fontSize: '0.875rem' 
                    }}>
                        <span>Tax:</span>
                        <span>${receipt.tax.toFixed(2)}</span>
                    </div>
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        marginBottom: '0.5rem', 
                        fontSize: '0.875rem' 
                    }}>
                        <span>Discount:</span>
                        <span>-${receipt.discount.toFixed(2)}</span>
                    </div>
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        marginTop: 'var(--spacing-md)', 
                        paddingTop: 'var(--spacing-md)', 
                        borderTop: '2px solid var(--border-color)', 
                        fontSize: '1.25rem', 
                        fontWeight: 'bold' 
                    }}>
                        <span>TOTAL:</span>
                        <span>${receipt.total.toFixed(2)}</span>
                    </div>
                </div>

                {/* Footer */}
                <div style={{ 
                    textAlign: 'center', 
                    marginBottom: 'var(--spacing-md)', 
                    fontSize: '0.875rem', 
                    color: 'var(--text-secondary)' 
                }}>
                    Thank you for your business!
                </div>

                {/* Action Buttons */}
                <div style={{ 
                    display: 'flex', 
                    gap: 'var(--spacing-sm)', 
                    flexWrap: 'wrap' 
                }} className="no-print">
                    <AppButton 
                        onClick={handleDownloadPDF} 
                        icon={Download} 
                        fullWidth
                        variant="secondary"
                    >
                        Download PDF
                    </AppButton>
                    <AppButton 
                        onClick={handlePrintReceipt} 
                        icon={Printer} 
                        fullWidth
                    >
                        Print Receipt
                    </AppButton>
                </div>
            </AppCard>
        </div>
    );
};

export default ReceiptDetailModal;
