import React, { useState } from 'react';
import { useInventory } from '../../logic/InventoryContext';
import { validateProduct } from '../../logic/productLogic';
import { ArrowLeft, Save, Upload } from 'lucide-react';

const AddProduct = ({ onNavigate }) => {
    const { addProduct } = useInventory();

    const [formData, setFormData] = useState({
        name: '',
        cost_price: '',
        selling_price: '',
        quantity: '',
        category: '',
        image: null
    });

    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleImageChange = (e) => {
        // For now just storing file name or object URL if needed for preview
        // In a real app we'd handle file upload to storage
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({ ...prev, image: file.name }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const validation = validateProduct(formData);

        if (!validation.isValid) {
            setErrors(validation.errors);
            return;
        }

        try {
            addProduct(formData);
            alert('Product Added Successfully!');
            onNavigate('dashboard');
        } catch (err) {
            alert('Error adding product: ' + err.message);
        }
    };

    return (
        <div className="container">
            <header style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button
                    onClick={() => onNavigate('dashboard')}
                    style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Add Product</h1>
            </header>

            <div className="glass-panel" style={{ padding: '2rem' }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Basic Details Section */}
                    <div>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem', color: 'var(--text-primary)' }}>Product Details</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Product Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    className="input-field"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="e.g. Wireless Mouse"
                                />
                                {errors.name && <span style={{ color: 'var(--accent-danger)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{errors.name}</span>}
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Category</label>
                                <input
                                    type="text"
                                    name="category"
                                    className="input-field"
                                    value={formData.category}
                                    onChange={handleChange}
                                    placeholder="e.g. Electronics"
                                />
                                {errors.category && <span style={{ color: 'var(--accent-danger)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{errors.category}</span>}
                            </div>
                        </div>
                    </div>

                    {/* Inventory & Pricing */}
                    <div>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem', color: 'var(--text-primary)' }}>Inventory & Pricing</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Cost Price ($)</label>
                                <input
                                    type="number"
                                    name="cost_price"
                                    className="input-field"
                                    value={formData.cost_price}
                                    onChange={handleChange}
                                    placeholder="0.00"
                                    step="0.01"
                                />
                                {errors.cost_price && <span style={{ color: 'var(--accent-danger)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{errors.cost_price}</span>}
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Selling Price ($)</label>
                                <input
                                    type="number"
                                    name="selling_price"
                                    className="input-field"
                                    value={formData.selling_price}
                                    onChange={handleChange}
                                    placeholder="0.00"
                                    step="0.01"
                                />
                                {errors.selling_price && <span style={{ color: 'var(--accent-danger)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{errors.selling_price}</span>}
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Stock Quantity</label>
                            <input
                                type="number"
                                name="quantity"
                                className="input-field"
                                value={formData.quantity}
                                onChange={handleChange}
                                placeholder="0"
                            />
                            {errors.quantity && <span style={{ color: 'var(--accent-danger)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{errors.quantity}</span>}
                        </div>
                    </div>

                    {/* Image Section */}
                    <div>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem', color: 'var(--text-primary)' }}>Media</h3>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Product Image</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                style={{ opacity: 0, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                            />
                            <div className="input-field" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', cursor: 'pointer', background: '#F8FAFC' }}>
                                <Upload size={18} />
                                <span>{formData.image ? formData.image : "Click to upload image..."}</span>
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', width: '100%', padding: '1rem', fontSize: '1rem', borderRadius: 'var(--radius-md)' }}>
                        <Save size={20} style={{ marginRight: '0.5rem' }} />
                        Save Product
                    </button>

                </form>
            </div>
        </div>
    );
};

export default AddProduct;
