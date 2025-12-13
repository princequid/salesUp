import React, { useState } from 'react';
import { useInventory } from '../../logic/InventoryContext';
import { validateProduct } from '../../logic/productLogic';
import { ArrowLeft, Save, Upload, Tag, Box, DollarSign, Image as ImageIcon } from 'lucide-react';
import { AppButton, AppCard, AppInput, AppSectionHeader, AppIconButton } from '../../components';
import PageLayout from '../../components/PageLayout';

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
        <PageLayout>
            <header style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
                <AppIconButton icon={ArrowLeft} onClick={() => onNavigate('dashboard')} size={24} color="var(--text-primary)" />
                <h1 className="text-h1">Add Product</h1>
            </header>

            <AppCard style={{ padding: 'var(--spacing-lg)' }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>

                    {/* Basic Details Section */}
                    <div>
                        <AppSectionHeader title="Product Details" />
                        <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
                            <AppInput
                                label="Product Name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g. Wireless Mouse"
                                error={errors.name}
                                icon={Tag}
                            />
                            <AppInput
                                label="Category"
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                placeholder="e.g. Electronics"
                                error={errors.category}
                                icon={Box}
                            />
                        </div>
                    </div>

                    {/* Inventory & Pricing */}
                    <div>
                        <AppSectionHeader title="Inventory & Pricing" />
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-md)' }}>
                            <AppInput
                                label="Cost Price ($)"
                                name="cost_price"
                                type="number"
                                value={formData.cost_price}
                                onChange={handleChange}
                                placeholder="0.00"
                                step="0.01"
                                error={errors.cost_price}
                                icon={DollarSign}
                            />
                            <AppInput
                                label="Selling Price ($)"
                                name="selling_price"
                                type="number"
                                value={formData.selling_price}
                                onChange={handleChange}
                                placeholder="0.00"
                                step="0.01"
                                error={errors.selling_price}
                                icon={DollarSign}
                            />
                        </div>
                        <AppInput
                            label="Stock Quantity"
                            name="quantity"
                            type="number"
                            value={formData.quantity}
                            onChange={handleChange}
                            placeholder="0"
                            error={errors.quantity}
                            icon={Box}
                        />
                    </div>

                    {/* Image Section */}
                    <div>
                        <AppSectionHeader title="Media" />
                        <label className="text-sm" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Product Image</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                style={{ opacity: 0, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: 'pointer', zIndex: 10 }}
                            />
                            <div className="input-field" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', cursor: 'pointer', background: 'var(--bg-secondary)', borderStyle: 'dashed' }}>
                                <Upload size={18} />
                                <span>{formData.image ? formData.image : "Click to upload image..."}</span>
                            </div>
                        </div>
                    </div>

                    <AppButton type="submit" icon={Save} fullWidth>
                        Save Product
                    </AppButton>

                </form>
            </AppCard>
        </PageLayout>
    );
};

export default AddProduct;
