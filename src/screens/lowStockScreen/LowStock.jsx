import React from 'react';
import { useInventory } from '../../logic/InventoryContext';
import { getLowStockItems } from '../../logic/stockLogic';
import { ArrowLeft, RefreshCw, AlertTriangle } from 'lucide-react';

const LowStock = ({ onNavigate }) => {
    const { products, settings, updateProduct } = useInventory();

    // Use logic helper
    const lowStockItems = getLowStockItems(products, settings.lowStockThreshold);

    const handleRestock = (product) => {
        const amountStr = window.prompt(`Enter amount to add to ${product.name}:`);
        if (amountStr) {
            const amount = parseInt(amountStr, 10);
            if (!isNaN(amount) && amount > 0) {
                updateProduct(product.id, { quantity: product.quantity + amount });
            } else {
                alert("Invalid quantity logged.");
            }
        }
    };

    return (
        <div style={{ padding: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
            <header style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button
                    onClick={() => onNavigate('dashboard')}
                    style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}
                >
                    <ArrowLeft size={24} />
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertTriangle size={24} color="var(--accent-warning)" />
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Low Stock Alerts</h1>
                </div>
            </header>

            <div className="glass-panel" style={{ overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: 'var(--bg-secondary)' }}>
                            <th style={{ textAlign: 'left', padding: '1rem' }}>Product</th>
                            <th style={{ textAlign: 'center', padding: '1rem' }}>Current Stock</th>
                            <th style={{ textAlign: 'center', padding: '1rem' }}>Satus</th>
                            <th style={{ textAlign: 'right', padding: '1rem' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {lowStockItems.length > 0 ? (
                            lowStockItems.map(item => (
                                <tr key={item.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                                    <td style={{ padding: '1rem', fontWeight: '500' }}>{item.name}</td>
                                    <td style={{ textAlign: 'center', padding: '1rem', fontWeight: 'bold', fontSize: '1.1rem' }}>
                                        {item.quantity}
                                    </td>
                                    <td style={{ textAlign: 'center', padding: '1rem' }}>
                                        <span style={{
                                            background: '#FEE2E2',
                                            color: 'var(--accent-danger)',
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '1rem',
                                            fontSize: '0.75rem',
                                            fontWeight: '600'
                                        }}>
                                            LOW
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right', padding: '1rem' }}>
                                        <button
                                            className="btn btn-primary"
                                            style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem' }}
                                            onClick={() => handleRestock(item)}
                                        >
                                            <RefreshCw size={14} style={{ marginRight: '0.25rem' }} /> Restock
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                                    <div style={{ marginBottom: '1rem' }}>All stocked up!</div>
                                    <div style={{ fontSize: '0.875rem' }}>No items below limit ({settings.lowStockThreshold})</div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LowStock;
