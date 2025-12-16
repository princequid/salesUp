import React, { useState } from 'react';
// currency hook removed; formatting handled by useMoneyFormatter
import { useInventory } from '../../logic/InventoryContext';
import { ArrowLeft, Receipt, Calendar, DollarSign, CreditCard, Search, FileText, TrendingUp } from 'lucide-react';
import { AppButton, AppCard, AppSectionHeader, AppIconButton, AppEmptyState } from '../../components';
import PermissionGate from '../../components/PermissionGate';
import PageLayout from '../../components/PageLayout';
import { useMoneyFormatter, parseAmountSafe } from '../../logic/currencyFormat';
import ReceiptDetailModal from './ReceiptDetailModal';

const ReceiptHistory = ({ onNavigate }) => {
    const { transactions, voidTransaction } = useInventory();
    const money = useMoneyFormatter();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedReceipt, setSelectedReceipt] = useState(null);
    const [showReceiptModal, setShowReceiptModal] = useState(false);

    // Debug logging
    console.log('[ReceiptHistory] Component rendered');
    console.log('[ReceiptHistory] Transactions:', transactions);
    console.log('[ReceiptHistory] Transactions count:', transactions?.length || 0);

    // Safety check: ensure transactions is an array
    const safeTransactions = Array.isArray(transactions) ? transactions : [];

    // Filter transactions based on search
    const filteredTransactions = safeTransactions.filter(transaction => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        const receiptId = transaction.receiptId || transaction.id;
        const dateStr = new Date(transaction.date).toLocaleDateString();
        const paymentMethod = transaction.paymentMethod || 'Unknown';
        
        return (
            receiptId.toLowerCase().includes(query) ||
            dateStr.includes(query) ||
            paymentMethod.toLowerCase().includes(query) ||
            transaction.items.some(item => item.name.toLowerCase().includes(query))
        );
    });

    console.log('[ReceiptHistory] Filtered transactions count:', filteredTransactions.length);

    const handleOpenReceipt = (receipt) => {
        setSelectedReceipt(receipt);
        setShowReceiptModal(true);
    };

    const handleCloseModal = () => {
        setShowReceiptModal(false);
        setSelectedReceipt(null);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getPaymentIcon = (method) => {
        switch(method?.toLowerCase()) {
            case 'card':
                return <CreditCard size={16} />;
            case 'cash':
                return <DollarSign size={16} />;
            case 'transfer':
                return <TrendingUp size={16} />;
            default:
                return <DollarSign size={16} />;
        }
    };

    return (
        <PageLayout>
            <header style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 'var(--spacing-md)', 
                marginBottom: 'var(--spacing-lg)' 
            }}>
                <AppIconButton 
                    icon={ArrowLeft} 
                    onClick={() => onNavigate('dashboard')} 
                    size={24} 
                    color="var(--text-primary)" 
                />
                <div style={{ flex: 1 }}>
                    <h1 className="text-h1">Receipt History</h1>
                    <p style={{ 
                        color: 'var(--text-secondary)', 
                        fontSize: '0.875rem', 
                        marginTop: '0.25rem' 
                    }}>
                        {safeTransactions.length} total receipt{safeTransactions.length !== 1 ? 's' : ''}
                    </p>
                </div>
            </header>

            {/* Search Bar */}
            <AppCard style={{ 
                padding: 'var(--spacing-md)', 
                marginBottom: 'var(--spacing-lg)' 
            }}>
                <div style={{ position: 'relative' }}>
                    <Search 
                        size={18} 
                        style={{ 
                            position: 'absolute', 
                            left: '1rem', 
                            top: '50%', 
                            transform: 'translateY(-50%)', 
                            color: 'var(--text-secondary)' 
                        }} 
                    />
                    <input
                        type="text"
                        className="input-field"
                        placeholder="Search by receipt ID, date, payment method, or item..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ 
                            width: '100%', 
                            paddingLeft: '2.5rem' 
                        }}
                    />
                </div>
            </AppCard>

            {/* Receipt List */}
            {filteredTransactions.length === 0 ? (
                <AppEmptyState
                    icon={Receipt}
                    title={searchQuery ? "No receipts found" : "No receipts yet"}
                    message={searchQuery ? "Try a different search term" : "Completed transactions will appear here"}
                    action={
                        !searchQuery && (
                            <AppButton onClick={() => onNavigate('recordSale')}>
                                Record First Sale
                            </AppButton>
                        )
                    }
                />
            ) : (
                <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 'var(--spacing-md)',
                    paddingBottom: '100px' // Extra space for bottom nav
                }}>
                    {filteredTransactions.map((transaction) => {
                        const receiptId = transaction.receiptId || transaction.id;
                        const itemCount = transaction.items.reduce((sum, item) => sum + item.quantity, 0);
                        const isVoided = !!transaction.voided;
                        
                        return (
                            <AppCard 
                                key={transaction.id}
                                style={{ 
                                    padding: 'var(--spacing-lg)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    border: isVoided ? '1px solid var(--accent-danger)' : '1px solid var(--border-color)',
                                    opacity: isVoided ? 0.75 : 1
                                }}
                                onClick={() => handleOpenReceipt(transaction)}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--accent-primary)';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = 'var(--shadow-hover)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--border-color)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'var(--glass-shadow)';
                                }}
                            >
                                <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                    gap: 'var(--spacing-md)'
                                }}>
                                    {/* Left Section */}
                                    <div style={{ flex: 1 }}>
                                        <div style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: 'var(--spacing-sm)',
                                            marginBottom: 'var(--spacing-xs)'
                                        }}>
                                            <Receipt size={20} color="var(--accent-primary)" />
                                            <span style={{ 
                                                fontWeight: 600,
                                                fontSize: '1rem',
                                                color: 'var(--text-primary)'
                                            }}>
                                                #{receiptId.slice(-8)}
                                            </span>
                                            {isVoided && (
                                                <span style={{
                                                    marginLeft: '0.5rem',
                                                    fontSize: '0.7rem',
                                                    background: 'var(--accent-danger)',
                                                    color: '#fff',
                                                    padding: '0.1rem 0.4rem',
                                                    borderRadius: '4px',
                                                    fontWeight: 700
                                                }}>VOIDED</span>
                                            )}
                                        </div>
                                        
                                        <div style={{ 
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '0.25rem',
                                            marginTop: 'var(--spacing-sm)'
                                        }}>
                                            <div style={{ 
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                color: 'var(--text-secondary)',
                                                fontSize: '0.875rem'
                                            }}>
                                                <Calendar size={14} />
                                                <span>{formatDate(transaction.date)}</span>
                                            </div>
                                            
                                            <div style={{ 
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                color: 'var(--text-secondary)',
                                                fontSize: '0.875rem'
                                            }}>
                                                {getPaymentIcon(transaction.paymentMethod)}
                                                <span>{transaction.paymentMethod || 'Cash'}</span>
                                            </div>

                                            <div style={{ 
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                color: 'var(--text-secondary)',
                                                fontSize: '0.875rem'
                                            }}>
                                                <FileText size={14} />
                                                <span>{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Section - Total */}
                                    <div style={{ 
                                        textAlign: 'right',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'flex-end'
                                    }}>
                                        <span style={{ 
                                            fontSize: '1.5rem',
                                            fontWeight: 'bold',
                                            color: isVoided ? 'var(--text-secondary)' : 'var(--accent-primary)'
                                        }}>
                                            {money(parseAmountSafe(transaction.total))}
                                        </span>
                                        {transaction.discount > 0 && (
                                            <span style={{ 
                                                fontSize: '0.75rem',
                                                color: isVoided ? 'var(--text-secondary)' : 'var(--accent-success)',
                                                marginTop: '0.25rem'
                                            }}>
                                                Saved {money(parseAmountSafe(transaction.discount))}
                                            </span>
                                        )}
                                        <PermissionGate action="sales.void">
                                            {!isVoided && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const reason = window.prompt('Reason for void (optional):', '');
                                                        voidTransaction(transaction.id, reason || '');
                                                    }}
                                                    style={{
                                                        marginTop: '0.5rem',
                                                        background: 'transparent',
                                                        color: 'var(--accent-danger)',
                                                        border: '1px solid var(--accent-danger)',
                                                        borderRadius: '6px',
                                                        padding: '0.25rem 0.5rem',
                                                        fontSize: '0.75rem',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Void
                                                </button>
                                            )}
                                        </PermissionGate>
                                    </div>
                                </div>

                                {/* Items Preview */}
                                <div style={{ 
                                    marginTop: 'var(--spacing-md)',
                                    paddingTop: 'var(--spacing-md)',
                                    borderTop: '1px dashed var(--border-color)'
                                }}>
                                    <div style={{ 
                                        fontSize: '0.8rem',
                                        color: 'var(--text-secondary)',
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: '0.5rem'
                                    }}>
                                        {transaction.items.slice(0, 3).map((item, idx) => (
                                            <span key={idx}>
                                                {item.name} x{item.quantity}
                                                {idx < Math.min(transaction.items.length - 1, 2) && ','}
                                            </span>
                                        ))}
                                        {transaction.items.length > 3 && (
                                            <span style={{ fontWeight: 600 }}>
                                                +{transaction.items.length - 3} more
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </AppCard>
                        );
                    })}
                </div>
            )}

            {/* Receipt Detail Modal */}
            {showReceiptModal && selectedReceipt && (
                <ReceiptDetailModal
                    receipt={selectedReceipt}
                    onClose={handleCloseModal}
                />
            )}
        </PageLayout>
    );
};

export default ReceiptHistory;
