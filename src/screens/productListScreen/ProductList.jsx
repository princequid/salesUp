import React, { useState } from 'react';
import { useInventory } from '../../logic/InventoryContext';
import { searchProducts } from '../../logic/productLogic';
import { ArrowLeft, Search, Trash2, Edit2, Plus } from 'lucide-react';

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
        // Future: Navigate to edit screen with ID
        // onNavigate('editProduct', id); 
        alert("Edit feature coming in next update!");
    };

    return (
        <div style={{ padding: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
            <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        onClick={() => onNavigate('dashboard')}
                        style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Inventory</h1>
                </div>
                <button className="btn btn-primary" onClick={() => onNavigate('addProduct')}>
                    <Plus size={18} style={{ marginRight: '0.5rem' }} /> Add
                </button>
            </header>

            {/* Search Bar */}
            <div className="glass-panel" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <Search size={20} color="var(--text-secondary)" />
                <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', width: '100%', outline: 'none', fontSize: '1rem' }}
                />
            </div>

            {/* Product List */}
            <div className="glass-panel" style={{ overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'var(--bg-secondary)' }}>
                                <th style={{ textAlign: 'left', padding: '1rem' }}>Name</th>
                                <th style={{ textAlign: 'right', padding: '1rem' }}>Price</th>
                                <th style={{ textAlign: 'center', padding: '1rem' }}>Stock</th>
                                <th style={{ textAlign: 'right', padding: '1rem' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.length > 0 ? (
                                filteredProducts.map(product => {
                                    const isLowStock = product.quantity <= settings.lowStockThreshold;
                                    return (
                                        <tr key={product.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ fontWeight: '500' }}>{product.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{product.category}</div>
                                            </td>
                                            <td style={{ textAlign: 'right', padding: '1rem' }}>
                                                ${product.selling_price.toFixed(2)}
                                            </td>
                                            <td style={{ textAlign: 'center', padding: '1rem' }}>
                                                <span style={{
                                                    padding: '0.25rem 0.5rem',
                                                    borderRadius: '4px',
                                                    background: isLowStock ? '#FEE2E2' : '#D1FAE5',
                                                    color: isLowStock ? 'var(--accent-danger)' : 'var(--accent-success)',
                                                    fontSize: '0.875rem',
                                                    fontWeight: '500'
                                                }}>
                                                    {product.quantity}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'right', padding: '1rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                    <button
                                                        onClick={() => handleEdit(product.id)}
                                                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem' }}
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(product.id)}
                                                        style={{ background: 'none', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer', padding: '0.25rem' }}
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                                        No products found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ProductList;
