import React, { useState } from 'react';
import { useInventory } from '../../logic/InventoryContext';
import { searchProducts } from '../../logic/productLogic';
import { ArrowLeft, Search, Trash2, Edit2, Plus, Package, Calendar } from 'lucide-react';
import { AppButton, AppCard, AppInput, AppBadge, AppEmptyState, AppIconButton, AppModal } from '../../components';
import PermissionGate from '../../components/PermissionGate';
import PageLayout from '../../components/PageLayout';

const ProductList = ({ onNavigate }) => {
    const { products, deleteProduct, updateProduct, settings } = useInventory();
    const [searchQuery, setSearchQuery] = useState('');
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editingExpirationDate, setEditingExpirationDate] = useState('');

    const filteredProducts = searchProducts(products, searchQuery);

    const handleDelete = (id) => {
        if (window.confirm("Are you sure you want to delete this product?")) {
            deleteProduct(id);
        }
    };

    const handleEdit = (id) => {
        const p = products.find((x) => x.id === id);
        setEditingId(id);
        setEditingExpirationDate(p?.expirationDate || '');
        setIsEditOpen(true);
    };

    return (
        <PageLayout>
            <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-lg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                    <AppIconButton icon={ArrowLeft} onClick={() => onNavigate('dashboard')} size={24} color="var(--text-primary)" />
                    <h1 className="text-h1">Inventory</h1>
                </div>
                <PermissionGate action="inventory.create">
                    <AppButton onClick={() => onNavigate('addProduct')} icon={Plus}>
                        Add
                    </AppButton>
                </PermissionGate>
            </header>

            {/* Search Bar */}
            <AppCard style={{ padding: 'var(--spacing-sm) var(--spacing-md)', display: 'flex', alignItems: 'center' }}>
                <AppInput
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    icon={Search}
                    style={{ marginBottom: 0, width: '100%' }}
                />
            </AppCard>

            {/* Product List */}
            {filteredProducts.length > 0 ? (
                <div className="glass-panel" style={{ overflow: 'hidden', padding: 0 }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
                            <thead>
                                <tr style={{ background: 'var(--bg-secondary)' }}>
                                    <th className="text-sm" style={{ textAlign: 'left', padding: 'var(--spacing-md)', color: 'var(--text-secondary)' }}>Name</th>
                                    <th className="text-sm" style={{ textAlign: 'right', padding: 'var(--spacing-md)', color: 'var(--text-secondary)' }}>Price</th>
                                    <th className="text-sm" style={{ textAlign: 'center', padding: 'var(--spacing-md)', color: 'var(--text-secondary)' }}>Stock</th>
                                    <th className="text-sm" style={{ textAlign: 'right', padding: 'var(--spacing-md)', color: 'var(--text-secondary)' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProducts.map((product, index) => {
                                    const threshold = Number(settings.lowStockThreshold) || 5;
                                    const qty = Number(product.quantity) || 0;
                                    const isLowStock = qty <= threshold;
                                    const isOut = qty === 0;
                                    const isCritical = qty > 0 && qty <= Math.max(1, Math.floor(threshold / 2));
                                    const rowBorderColor = isOut
                                        ? 'var(--accent-danger)'
                                        : isCritical
                                            ? 'var(--accent-warning)'
                                            : isLowStock
                                                ? 'var(--accent-warning)'
                                                : 'transparent';
                                    return (
                                        <tr key={product.id} style={{ borderBottom: index < filteredProducts.length - 1 ? '1px solid var(--border-color)' : 'none', borderLeft: `4px solid ${rowBorderColor}` }}>
                                            <td style={{ padding: 'var(--spacing-md)' }}>
                                                <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{product.name}</div>
                                                <div className="text-caption" style={{ color: 'var(--text-secondary)' }}>{product.category}</div>
                                            </td>
                                            <td style={{ textAlign: 'right', padding: 'var(--spacing-md)', fontWeight: 600 }}>
                                                ${product.selling_price.toFixed(2)}
                                            </td>
                                            <td style={{ textAlign: 'center', padding: 'var(--spacing-md)' }}>
                                                {isOut ? (
                                                    <AppBadge variant="danger">{qty}</AppBadge>
                                                ) : isCritical ? (
                                                    <AppBadge variant="warning">{qty}</AppBadge>
                                                ) : isLowStock ? (
                                                    <AppBadge variant="warning">{qty}</AppBadge>
                                                ) : (
                                                    <AppBadge variant="success">{qty}</AppBadge>
                                                )}
                                            </td>
                                            <td style={{ textAlign: 'right', padding: 'var(--spacing-md)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-sm)' }}>
                                                    <PermissionGate action="inventory.update">
                                                        <AppIconButton icon={Edit2} onClick={() => handleEdit(product.id)} size={18} />
                                                    </PermissionGate>
                                                    <PermissionGate action="inventory.delete">
                                                        <AppIconButton icon={Trash2} onClick={() => handleDelete(product.id)} color="var(--accent-danger)" size={18} />
                                                    </PermissionGate>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <AppEmptyState
                    title={searchQuery ? "No matches found" : "No products yet"}
                    message={searchQuery ? `We couldn't find any products matching "${searchQuery}"` : "Get started by adding your first product to inventory."}
                    icon={Package}
                    action={!searchQuery && (
                        <PermissionGate action="inventory.create">
                            <AppButton onClick={() => onNavigate('addProduct')} icon={Plus}>
                                Add Product
                            </AppButton>
                        </PermissionGate>
                    )}
                />
            )}

            <AppModal
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                title="Edit Expiration Date"
                maxWidth="560px"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        {products.find((p) => p.id === editingId)?.name || ''}
                    </div>

                    <AppInput
                        label="Expiration Date (Optional)"
                        name="expirationDate"
                        type="date"
                        value={editingExpirationDate}
                        onChange={(e) => setEditingExpirationDate(e.target.value)}
                        icon={Calendar}
                    />

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-sm)' }}>
                        <AppButton
                            variant="ghost"
                            onClick={() => {
                                setEditingExpirationDate('');
                            }}
                        >
                            Clear
                        </AppButton>
                        <PermissionGate action="inventory.update">
                            <AppButton
                                variant="primary"
                                onClick={() => {
                                    if (!editingId) return;
                                    updateProduct(editingId, {
                                        expirationDate: editingExpirationDate && String(editingExpirationDate).trim() !== '' ? String(editingExpirationDate).trim() : null
                                    });
                                    setIsEditOpen(false);
                                }}
                            >
                                Save
                            </AppButton>
                        </PermissionGate>
                    </div>
                </div>
            </AppModal>
        </PageLayout>
    );
};

export default ProductList;
