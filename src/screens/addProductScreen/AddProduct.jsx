import React, { useState } from 'react';
import { useInventory } from '../../logic/InventoryContext';
import { validateProduct } from '../../logic/productLogic';
import { ArrowLeft, Save, Upload, Tag, Box, DollarSign, Image as ImageIcon, Hash, FileUp, CheckCircle, XCircle, Calendar, AlertCircle, X } from 'lucide-react';
import { AppButton, AppCard, AppInput, AppSectionHeader, AppIconButton } from '../../components';
import PageLayout from '../../components/PageLayout';
import Papa from 'papaparse';
import PermissionGate from '../../components/PermissionGate';
import { useAuth } from '../../logic/AuthContext';

const AddProduct = ({ onNavigate }) => {
    const { addProduct, products } = useInventory();
    const { requireAuth } = useAuth();

    const [formData, setFormData] = useState({
        name: '',
        barcode: '',
        cost_price: '',
        selling_price: '',
        quantity: '',
        category: '',
        image: null,
        expirationDate: ''
    });

    const [errors, setErrors] = useState({});
    const [formMode, setFormMode] = useState('single'); // 'single' or 'bulk'

    // Bulk import states
    const [previewData, setPreviewData] = useState(null); // { valid: [], invalid: [], duplicates: [] }
    const [showPreview, setShowPreview] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });

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
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({ ...prev, image: file.name }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!requireAuth()) return;

        // Handle single product add
        const validation = validateProduct(formData);
        if (!validation.isValid) {
            setErrors(validation.errors);
            return;
        }

        try {
            addProduct(formData);
            alert('Product Added Successfully!');
            // Reset form
            setFormData({
                name: '',
                barcode: '',
                cost_price: '',
                selling_price: '',
                quantity: '',
                category: '',
                image: null,
                expirationDate: ''
            });
            setErrors({});
            onNavigate('dashboard');
        } catch (err) {
            console.error('Error adding product:', err);
            alert('Error adding product: ' + (err.message || 'Unknown error occurred'));
        }
    };

    // Helper function to normalize field names and values
    const normalizeCSVRow = (row) => {
        // Create a case-insensitive mapping of possible field names
        const fieldMap = {};
        Object.entries(row).forEach(([key, value]) => {
            const normalizedKey = key.trim().toLowerCase().replace(/[\s_]/g, '');
            fieldMap[normalizedKey] = value;
        });

        // Map to expected fields with fallbacks
        const productData = {
            name: (fieldMap['name'] || '').toString().trim(),
            barcode: (fieldMap['barcode'] || '').toString().trim(),
            cost_price: fieldMap['costprice'] || fieldMap['cost'] || fieldMap['cost_price'] || '',
            selling_price: fieldMap['sellingprice'] || fieldMap['price'] || fieldMap['selling_price'] || '',
            quantity: fieldMap['quantity'] || fieldMap['stock'] || '',
            category: (fieldMap['category'] || 'Imported').toString().trim(),
            image: null,
            expirationDate: (fieldMap['expirationdate'] || fieldMap['expirydate'] || fieldMap['expdate'] || '').toString().trim()
        };

        // Convert numeric fields
        if (productData.cost_price) {
            productData.cost_price = productData.cost_price.toString().replace(/[^0-9.]/g, '');
        }
        if (productData.selling_price) {
            productData.selling_price = productData.selling_price.toString().replace(/[^0-9.]/g, '');
        }
        if (productData.quantity) {
            productData.quantity = productData.quantity.toString().replace(/[^0-9]/g, '');
        }

        return productData;
    };

    const handleCSVImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Check file type
        if (!file.name.endsWith('.csv')) {
            alert('Please upload a valid CSV file');
            e.target.value = '';
            return;
        }

        setIsImporting(true);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: false,
            complete: (results) => {
                const validProducts = [];
                const invalidProducts = [];
                const duplicateProducts = [];

                // Check for required columns
                const requiredFields = ['name', 'cost_price', 'selling_price', 'quantity'];
                const normalizedHeaders = (results.meta.fields || []).map(h => h.trim().toLowerCase().replace(/[\s_]/g, ''));
                const missingFields = requiredFields.filter(field =>
                    !normalizedHeaders.some(h => h.includes(field.replace('_', '')))
                );

                if (missingFields.length > 0) {
                    alert(`Missing required columns: ${missingFields.join(', ')}\n\nAvailable columns: ${results.meta.fields.join(', ')}`);
                    setIsImporting(false);
                    e.target.value = '';
                    return;
                }

                const rows = Array.isArray(results.data) ? results.data : [];

                if (rows.length === 0) {
                    alert('The CSV file is empty or contains no valid data');
                    setIsImporting(false);
                    e.target.value = '';
                    return;
                }

                // Process each row
                rows.forEach((row, index) => {
                    const rowNumber = index + 2; // +2 for 1-based index and header row

                    try {
                        const productData = normalizeCSVRow(row);

                        // Check for duplicate barcode
                        if (productData.barcode && products.find(p => p.barcode === productData.barcode)) {
                            duplicateProducts.push({
                                rowNumber,
                                data: productData,
                                error: `Product with barcode "${productData.barcode}" already exists`
                            });
                            return;
                        }

                        // Validate product
                        const validation = validateProduct(productData);
                        if (!validation.isValid) {
                            const errorDetails = Object.entries(validation.errors)
                                .map(([field, error]) => `${field}: ${error}`)
                                .join('; ');
                            invalidProducts.push({
                                rowNumber,
                                data: productData,
                                error: errorDetails
                            });
                            return;
                        }

                        // Valid product
                        validProducts.push({
                            rowNumber,
                            data: productData
                        });

                    } catch (err) {
                        invalidProducts.push({
                            rowNumber,
                            data: row,
                            error: err.message || 'Unknown error'
                        });
                    }
                });

                // Store preview data
                setPreviewData({
                    valid: validProducts,
                    invalid: invalidProducts,
                    duplicates: duplicateProducts,
                    fileName: file.name
                });
                setShowPreview(true);
                setFormMode('bulk');
                setIsImporting(false);
                e.target.value = '';
            },
            error: (error) => {
                console.error('CSV Parse Error:', error);
                alert(`Failed to process CSV file: ${error.message || 'Invalid file format'}`);
                setIsImporting(false);
                e.target.value = '';
            }
        });
    };

    const handleConfirmImport = () => {
        if (!previewData || previewData.valid.length === 0) {
            alert('No valid products to import');
            return;
        }

        if (!requireAuth()) return;

        setIsImporting(true);
        setImportProgress({ current: 0, total: previewData.valid.length });

        try {
            // Batch import all valid products
            previewData.valid.forEach((item, index) => {
                addProduct(item.data);
                setImportProgress({ current: index + 1, total: previewData.valid.length });
            });

            const successMessage = `Successfully imported ${previewData.valid.length} product${previewData.valid.length !== 1 ? 's' : ''}!`;
            alert(successMessage);

            // Reset state
            setPreviewData(null);
            setShowPreview(false);
            setFormMode('single');
            setIsImporting(false);
            setImportProgress({ current: 0, total: 0 });

            onNavigate('dashboard');
        } catch (err) {
            console.error('Error importing products:', err);
            alert('Error importing products: ' + (err.message || 'Unknown error occurred'));
            setIsImporting(false);
        }
    };

    const handleCancelImport = () => {
        setPreviewData(null);
        setShowPreview(false);
        setFormMode('single');
        setImportProgress({ current: 0, total: 0 });
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
                    Import multiple products from a CSV file. Required columns: name, selling_price, cost_price, quantity
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

                <PermissionGate action="inventory.import">
                    <div style={{ position: 'relative', marginBottom: 0 }}>
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
                            <span>{isImporting ? 'Processing...' : 'Click to upload CSV file...'}</span>
                        </div>
                    </div>
                </PermissionGate>
            </AppCard>

            {/* Preview Modal */}
            {showPreview && previewData && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: 'var(--spacing-md)'
                }}>
                    <div style={{
                        backgroundColor: 'var(--bg-card)',
                        borderRadius: 'var(--radius-md)',
                        maxWidth: '900px',
                        width: '100%',
                        maxHeight: '90vh',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                    }}>
                        {/* Header */}
                        <div style={{
                            padding: 'var(--spacing-lg)',
                            borderBottom: '1px solid var(--border-color)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.25rem' }}>Import Preview</h2>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{previewData.fileName}</p>
                            </div>
                            <AppIconButton icon={X} onClick={handleCancelImport} size={20} />
                        </div>

                        {/* Stats */}
                        <div style={{
                            padding: 'var(--spacing-lg)',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                            gap: 'var(--spacing-md)',
                            borderBottom: '1px solid var(--border-color)'
                        }}>
                            <div style={{ textAlign: 'center', padding: 'var(--spacing-sm)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-success)' }}>{previewData.valid.length}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Valid</div>
                            </div>
                            <div style={{ textAlign: 'center', padding: 'var(--spacing-sm)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-danger)' }}>{previewData.invalid.length}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Invalid</div>
                            </div>
                            <div style={{ textAlign: 'center', padding: 'var(--spacing-sm)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-warning)' }}>{previewData.duplicates.length}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Duplicates</div>
                            </div>
                            <div style={{ textAlign: 'center', padding: 'var(--spacing-sm)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                    {previewData.valid.length + previewData.invalid.length + previewData.duplicates.length}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total</div>
                            </div>
                        </div>

                        {/* Table */}
                        <div style={{ flex: 1, overflow: 'auto', padding: 'var(--spacing-lg)' }}>
                            <table style={{ width: '100%', fontSize: '0.875rem', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                                        <th style={{ padding: '0.5rem', textAlign: 'left', fontWeight: 600 }}>Row</th>
                                        <th style={{ padding: '0.5rem', textAlign: 'left', fontWeight: 600 }}>Status</th>
                                        <th style={{ padding: '0.5rem', textAlign: 'left', fontWeight: 600 }}>Name</th>
                                        <th style={{ padding: '0.5rem', textAlign: 'left', fontWeight: 600 }}>Price</th>
                                        <th style={{ padding: '0.5rem', textAlign: 'left', fontWeight: 600 }}>Qty</th>
                                        <th style={{ padding: '0.5rem', textAlign: 'left', fontWeight: 600 }}>Category</th>
                                        <th style={{ padding: '0.5rem', textAlign: 'left', fontWeight: 600 }}>Error</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* Valid Products */}
                                    {previewData.valid.map((item, idx) => (
                                        <tr key={`valid-${idx}`} style={{
                                            borderBottom: '1px solid var(--border-color)',
                                            backgroundColor: 'rgba(34, 197, 94, 0.1)'
                                        }}>
                                            <td style={{ padding: '0.5rem' }}>{item.rowNumber}</td>
                                            <td style={{ padding: '0.5rem' }}>
                                                <CheckCircle size={16} color="var(--accent-success)" />
                                            </td>
                                            <td style={{ padding: '0.5rem' }}>{item.data.name}</td>
                                            <td style={{ padding: '0.5rem' }}>${item.data.selling_price}</td>
                                            <td style={{ padding: '0.5rem' }}>{item.data.quantity}</td>
                                            <td style={{ padding: '0.5rem' }}>{item.data.category}</td>
                                            <td style={{ padding: '0.5rem', color: 'var(--accent-success)' }}>—</td>
                                        </tr>
                                    ))}

                                    {/* Duplicate Products */}
                                    {previewData.duplicates.map((item, idx) => (
                                        <tr key={`dup-${idx}`} style={{
                                            borderBottom: '1px solid var(--border-color)',
                                            backgroundColor: 'rgba(251, 191, 36, 0.1)'
                                        }}>
                                            <td style={{ padding: '0.5rem' }}>{item.rowNumber}</td>
                                            <td style={{ padding: '0.5rem' }}>
                                                <AlertCircle size={16} color="var(--accent-warning)" />
                                            </td>
                                            <td style={{ padding: '0.5rem' }}>{item.data.name}</td>
                                            <td style={{ padding: '0.5rem' }}>${item.data.selling_price}</td>
                                            <td style={{ padding: '0.5rem' }}>{item.data.quantity}</td>
                                            <td style={{ padding: '0.5rem' }}>{item.data.category}</td>
                                            <td style={{ padding: '0.5rem', color: 'var(--accent-warning)', fontSize: '0.75rem' }}>
                                                {item.error}
                                            </td>
                                        </tr>
                                    ))}

                                    {/* Invalid Products */}
                                    {previewData.invalid.map((item, idx) => (
                                        <tr key={`invalid-${idx}`} style={{
                                            borderBottom: '1px solid var(--border-color)',
                                            backgroundColor: 'rgba(239, 68, 68, 0.1)'
                                        }}>
                                            <td style={{ padding: '0.5rem' }}>{item.rowNumber}</td>
                                            <td style={{ padding: '0.5rem' }}>
                                                <XCircle size={16} color="var(--accent-danger)" />
                                            </td>
                                            <td style={{ padding: '0.5rem' }}>{item.data.name || '—'}</td>
                                            <td style={{ padding: '0.5rem' }}>{item.data.selling_price ? `$${item.data.selling_price}` : '—'}</td>
                                            <td style={{ padding: '0.5rem' }}>{item.data.quantity || '—'}</td>
                                            <td style={{ padding: '0.5rem' }}>{item.data.category || '—'}</td>
                                            <td style={{ padding: '0.5rem', color: 'var(--accent-danger)', fontSize: '0.75rem' }}>
                                                {item.error}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer Actions */}
                        <div style={{
                            padding: 'var(--spacing-lg)',
                            borderTop: '1px solid var(--border-color)',
                            display: 'flex',
                            gap: 'var(--spacing-md)',
                            justifyContent: 'flex-end'
                        }}>
                            <button
                                onClick={handleCancelImport}
                                disabled={isImporting}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: 'var(--radius-sm)',
                                    color: 'var(--text-primary)',
                                    cursor: isImporting ? 'not-allowed' : 'pointer',
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    opacity: isImporting ? 0.5 : 1
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmImport}
                                disabled={isImporting || previewData.valid.length === 0}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    background: previewData.valid.length === 0 ? 'var(--bg-secondary)' : 'var(--accent-primary)',
                                    border: 'none',
                                    borderRadius: 'var(--radius-sm)',
                                    color: previewData.valid.length === 0 ? 'var(--text-secondary)' : '#fff',
                                    cursor: (isImporting || previewData.valid.length === 0) ? 'not-allowed' : 'pointer',
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                {isImporting ? (
                                    <>Importing {importProgress.current}/{importProgress.total}...</>
                                ) : (
                                    <>
                                        <CheckCircle size={16} />
                                        Import {previewData.valid.length} Valid Product{previewData.valid.length !== 1 ? 's' : ''}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Single Product Form */}
            <AppCard style={{ padding: 'var(--spacing-lg)' }}>
                <form onSubmit={handleSubmit} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--spacing-lg)',
                    opacity: formMode === 'bulk' ? 0.6 : 1,
                    pointerEvents: formMode === 'bulk' ? 'none' : 'auto'
                }}>

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

                        <AppInput
                            label="Expiration Date (Optional)"
                            name="expirationDate"
                            type="date"
                            value={formData.expirationDate}
                            onChange={handleChange}
                            error={errors.expirationDate}
                            icon={Calendar}
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

                    <PermissionGate action="inventory.create">
                        <AppButton
                            type="submit"
                            icon={Save}
                            fullWidth
                        >
                            Save Product
                        </AppButton>
                    </PermissionGate>

                </form>
            </AppCard>
        </PageLayout>
    );
};

export default AddProduct;
