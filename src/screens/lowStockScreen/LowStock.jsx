import React from 'react';
import { useInventory } from '../../logic/InventoryContext';
import { getLowStockItems } from '../../logic/stockLogic';
import { ArrowLeft, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { AppButton, AppBadge, AppEmptyState, AppIconButton, AppCard } from '../../components';
import PageLayout from '../../components/PageLayout';

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
        <PageLayout style={{ paddingBottom: 'var(--spacing-xl)' }}>
            <header style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
                <AppIconButton icon={ArrowLeft} onClick={() => onNavigate('dashboard')} size={24} color="var(--text-primary)" />
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                    <AlertTriangle size={24} color="var(--accent-warning)" />
                    <h1 className="text-h1">Low Stock Alerts</h1>
                </div>
            </header>

            {lowStockItems.length > 0 ? (
                <div className="glass-panel" style={{ overflow: 'hidden', padding: 0 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'var(--bg-secondary)' }}>
                                <th className="text-sm" style={{ textAlign: 'left', padding: 'var(--spacing-md)', color: 'var(--text-secondary)' }}>Product</th>
                                <th className="text-sm" style={{ textAlign: 'center', padding: 'var(--spacing-md)', color: 'var(--text-secondary)' }}>Current Stock</th>
                                <th className="text-sm" style={{ textAlign: 'center', padding: 'var(--spacing-md)', color: 'var(--text-secondary)' }}>Status</th>
                                <th className="text-sm" style={{ textAlign: 'right', padding: 'var(--spacing-md)', color: 'var(--text-secondary)' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lowStockItems.map((item, index) => (
                                <tr key={item.id} style={{ borderBottom: index < lowStockItems.length - 1 ? '1px solid #E2E8F0' : 'none' }}>
                                    <td style={{ padding: 'var(--spacing-md)', fontWeight: 500 }}>{item.name}</td>
                                    <td style={{ textAlign: 'center', padding: 'var(--spacing-md)', fontWeight: 'bold', fontSize: '1.1rem' }}>
                                        {item.quantity}
                                    </td>
                                    <td style={{ textAlign: 'center', padding: 'var(--spacing-md)' }}>
                                        <AppBadge variant="danger">LOW</AppBadge>
                                    </td>
                                    <td style={{ textAlign: 'right', padding: 'var(--spacing-md)' }}>
                                        <AppButton
                                            size="small"
                                            icon={RefreshCw}
                                            onClick={() => handleRestock(item)}
                                        >
                                            Restock
                                        </AppButton>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <AppEmptyState
                    title="All Stocked Up!"
                    message={`Great job! No items are below your alert threshold of ${settings.lowStockThreshold}.`}
                    icon={CheckCircle}
                />
            )}
        </PageLayout>
    );
};

export default LowStock;
