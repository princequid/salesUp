import React, { useState } from 'react';
import { useInventory } from '../../logic/InventoryContext';
import { validateProduct } from '../../logic/productLogic';
import { ArrowLeft, Save, Upload, Tag, Box, DollarSign, Image as ImageIcon, Hash, FileUp, CheckCircle, XCircle } from 'lucide-react';
import { AppButton, AppCard, AppInput, AppSectionHeader, AppIconButton } from '../../components';
import PageLayout from '../../components/PageLayout';
import Papa from 'papaparse';

const AddProduct = ({ onNavigate }) => {
    const { addProduct, products } = useInventory();

    const [formData, setFormData] = useState({
        name: '',
        barcode: '',
        cost_price: '',
        selling_price: '',
        quantity: '',
        category: '',
        image: null
    });

    const [errors, setErrors] = useState({});
    const [importResults, setImportResults] = useState(null);
    const [isImporting, setIsImporting] = useState(false);

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

    const handleCSVImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsImporting(true);
        setImportResults(null);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const importStats = {
                    total: 0,
                    successful: 0,
                    failed: 0,
                    skipped: 0,
                    errors: []
                };

                results.data.forEach((row, index) => {
                    importStats.total++;
                    
                    // Map CSV fields to product schema
                    const productData = {
                        name: row.name || row.Name || '',
                        barcode: row.barcode || row.Barcode || '',
                        cost_price: row.cost_price || row['Cost Price'] || row.cost || '',
                        selling_price: row.selling_price || row['Selling Price'] || row.price || row.Price || '',
                        quantity: row.quantity || row.Quantity || row.stock || row.Stock || '',
                        category: row.category || row.Category || 'Imported',
                        image: null
                    };

                    // Check if product with same barcode already exists
                    if (productData.barcode && products.find(p => p.barcode === productData.barcode)) {
                        importStats.skipped++;
                        importStats.errors.push(`Row ${index + 2}: Product with barcode "${productData.barcode}" already exists - skipped`);
                        return;
                    }

                    // Validate product
                    const validation = validateProduct(productData);
                    if (!validation.isValid) {
                        importStats.failed++;
                        const errorMessages = Object.values(validation.errors).join(', ');
                        importStats.errors.push(`Row ${index + 2}: ${errorMessages}`);
                        return;
                    }

                    // Add product
                    try {
                        addProduct(productData);
                        importStats.successful++;
                    } catch (err) {
                        importStats.failed++;
                        importStats.errors.push(`Row ${index + 2}: ${err.message}`);
                    }
                });

                setImportResults(importStats);
                setIsImporting(false);
                
                // Clear file input
                e.target.value = '';
            },
            error: (error) => {
                setImportResults({
                    total: 0,
                    successful: 0,
                    failed: 0,
                    skipped: 0,
                    errors: [`Failed to parse CSV: ${error.message}`]
                });
                setIsImporting(false);
                e.target.value = '';
            }
        });
    };

    return (
        <PageLayout>
            <header style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
                <AppIconButton icon={ArrowLeft} onClick={() => onNavigate('dashboard')} size={24} color="var(--text-primary)" />
                <h1 className="text-h1">Add Product</h1>
            </header>

            {/* CSV Import Section */}
            <AppCard style={{ padding: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)' }}>
                <AppSectionHeader title="Bulk Import" />
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-sm)' }}>
                    Import multiple products from a CSV file. Required columns: name, price, stock, barcode
                </p>
                <a 
                    href="/product-import-template.csv" 
                    download 
                    style={{ 
                        fontSize: '0.75rem', 
                        color: 'var(--accent-primary)', 
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        marginBottom: 'var(--spacing-md)'
                    }}
                >
                    <Upload size={14} />
                    Download CSV Template
                </a>
                
                <div style={{ position: 'relative', marginBottom: importResults ? 'var(--spacing-md)' : 0 }}>
                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleCSVImport}
                        disabled={isImporting}
                        style={{ opacity: 0, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: 'pointer', zIndex: 10 }}
                    />
                    <div className="input-field" style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem', 
                        color: 'var(--text-secondary)', 
                        cursor: isImporting ? 'not-allowed' : 'pointer', 
                        background: 'var(--bg-secondary)', 
                        borderStyle: 'dashed',
                        opacity: isImporting ? 0.6 : 1
                    }}>
                        <FileUp size={18} />
                        <span>{isImporting ? 'Importing...' : 'Click to upload CSV file...'}</span>
                    </div>
                </div>

                {/* Import Results */}
                {importResults && (
                    <div style={{
                        padding: 'var(--spacing-md)',
                        background: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-color)'
                    }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: 'var(--spacing-sm)', fontWeight: 600 }}>Import Summary</h3>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
                            <div style={{ textAlign: 'center', padding: 'var(--spacing-sm)', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{importResults.total}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total</div>
                            </div>
                            <div style={{ textAlign: 'center', padding: 'var(--spacing-sm)', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-success)' }}>{importResults.successful}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Success</div>
                            </div>
                            <div style={{ textAlign: 'center', padding: 'var(--spacing-sm)', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-warning)' }}>{importResults.skipped}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Skipped</div>
                            </div>
                            <div style={{ textAlign: 'center', padding: 'var(--spacing-sm)', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-danger)' }}>{importResults.failed}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Failed</div>
                            </div>
                        </div>

                        {/* Error Details */}
                        {importResults.errors.length > 0 && (
                            <div>
                                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 'var(--spacing-xs)', color: 'var(--text-secondary)' }}>
                                    Details:
                                </h4>
                                <div style={{ maxHeight: '200px', overflowY: 'auto', fontSize: '0.75rem' }}>
                                    {importResults.errors.map((error, index) => (
                                        <div key={index} style={{ 
                                            padding: '0.25rem 0', 
                                            color: 'var(--text-secondary)',
                                            display: 'flex',
                                            gap: '0.25rem'
                                        }}>
                                            {error.includes('skipped') ? (
                                                <span style={{ color: 'var(--accent-warning)' }}>⚠</span>
                                            ) : (
                                                <span style={{ color: 'var(--accent-danger)' }}>✕</span>
                                            )}
                                            <span>{error}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => setImportResults(null)}
                            style={{
                                marginTop: 'var(--spacing-md)',
                                padding: '0.5rem 1rem',
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-sm)',
                                color: 'var(--text-primary)',
                                cursor: 'pointer',
                                fontSize: '0.875rem'
                            }}
                        >
                            Close Summary
                        </button>
                    </div>
                )}
            </AppCard>

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
                                label="Barcode"
                                name="barcode"
                                value={formData.barcode}
                                onChange={handleChange}
                                placeholder="e.g. 1234567890123"
                                error={errors.barcode}
                                icon={Hash}
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
