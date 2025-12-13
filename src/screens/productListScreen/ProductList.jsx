import React, { useState } from 'react';
import { useInventory } from '../../logic/InventoryContext';
import { searchProducts } from '../../logic/productLogic';
import { ArrowLeft, Search, Trash2, Edit2, Plus, Package } from 'lucide-react';
import { AppButton, AppCard, AppInput, AppBadge, AppEmptyState, AppIconButton } from '../../components';
import PageLayout from '../../components/PageLayout';

const ProductList = ({ onNavigate }) => {
    const { products, deleteProduct, settings } = useInventory();
    const [searchQuery, setSearchQuery] = useState('');

    const filteredProducts = searchProducts(products, searchQuery);

    const handleDelete = (id) => {
        if (window.confirm("Are you sure you want to delete this product?")) {
            deleteProduct(id);
        }
    };

    const handleEdit = (id) => {
        alert("Edit feature coming in next update!");
    };

    return (
        <PageLayout>
            <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-lg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                    <AppIconButton icon={ArrowLeft} onClick={() => onNavigate('dashboard')} size={24} color="var(--text-primary)" />
                    <h1 className="text-h1">Inventory</h1>
                </div>
                <AppButton onClick={() => onNavigate('addProduct')} icon={Plus}>
                    Add
                </AppButton>
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
                                    const isLowStock = product.quantity <= settings.lowStockThreshold;
                                    return (
                                        <tr key={product.id} style={{ borderBottom: index < filteredProducts.length - 1 ? '1px solid #E2E8F0' : 'none' }}>
                                            <td style={{ padding: 'var(--spacing-md)' }}>
                                                <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{product.name}</div>
                                                <div className="text-caption" style={{ color: 'var(--text-secondary)' }}>{product.category}</div>
                                            </td>
                                            <td style={{ textAlign: 'right', padding: 'var(--spacing-md)', fontWeight: 600 }}>
                                                ${product.selling_price.toFixed(2)}
                                            </td>
                                            <td style={{ textAlign: 'center', padding: 'var(--spacing-md)' }}>
                                                <AppBadge variant={isLowStock ? 'danger' : 'success'}>
                                                    {product.quantity}
                                                </AppBadge>
                                            </td>
                                            <td style={{ textAlign: 'right', padding: 'var(--spacing-md)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-sm)' }}>
                                                    <AppIconButton icon={Edit2} onClick={() => handleEdit(product.id)} size={18} />
                                                    <AppIconButton icon={Trash2} onClick={() => handleDelete(product.id)} color="var(--accent-danger)" size={18} />
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
                        <AppButton onClick={() => onNavigate('addProduct')} icon={Plus}>
                            Add Product
                        </AppButton>
                    )}
                />
            )}
        </PageLayout>
    );
};

export default ProductList;
