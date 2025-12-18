import React, { useState } from 'react';
import { useInventory } from '../../logic/InventoryContext';
import { validateProduct } from '../../logic/productLogic';
import { ArrowLeft, Save, Upload, Tag, Box, DollarSign, Image as ImageIcon, Hash, FileUp, CheckCircle, XCircle, Calendar } from 'lucide-react';
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
    const [importResults, setImportResults] = useState(null);
    const [isImporting, setIsImporting] = useState(false);
    const [formMode, setFormMode] = useState('single'); // 'single' or 'bulk'
    const [importedProducts, setImportedProducts] = useState([]);
    const [formErrors, setFormErrors] = useState({});

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

        if (!requireAuth()) return;
        
        // Handle bulk import save
        if (formMode === 'bulk') {
            if (importedProducts.length === 0) {
                alert('No products to import. Please check your CSV file.');
                return;
            }
            
            try {
                importedProducts.forEach(product => {
                    // Add product with a small delay to prevent UI freeze
                    setTimeout(() => addProduct(product), 0);
                });
                
                const successMessage = `${importedProducts.length} product${importedProducts.length !== 1 ? 's' : ''} imported successfully!`;
                alert(successMessage);
                
                // Reset form
                setImportedProducts([]);
                setFormMode('single');
                setImportResults(null);
                onNavigate('dashboard');
            } catch (err) {
                console.error('Error saving imported products:', err);
                alert('Error saving imported products: ' + (err.message || 'Unknown error occurred'));
            }
            return;
        }
        
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
            e.target.value = ''; // Reset file input
            return;
        }

        setIsImporting(true);
        setImportResults(null);

        // Show file info
        const fileInfo = `File: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
        console.log('Importing CSV:', fileInfo);

        const importStartTime = Date.now();
        let parseError = null;

        try {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                dynamicTyping: false, // Keep as strings for consistent handling
                complete: (results) => {
                const importStats = {
                    total: 0,
                    successful: 0,
                    failed: 0,
                    skipped: 0,
                    errors: [],
                    fileInfo,
                    headers: results.meta.fields || []
                };

                // Check for required columns
                const requiredFields = ['name', 'cost_price', 'selling_price', 'quantity'];
                const normalizedHeaders = (results.meta.fields || []).map(h => h.trim().toLowerCase().replace(/[\s_]/g, ''));
                const missingFields = requiredFields.filter(field => 
                    !normalizedHeaders.some(h => h.includes(field))
                );

                if (missingFields.length > 0) {
                    setImportResults({
                        ...importStats,
                        errors: [
                            'Missing required columns in CSV:',
                            ...missingFields.map(f => `- ${f}`),
                            '\nAvailable columns:',
                            ...(results.meta.fields || []).map(f => `- ${f}`)
                        ]
                    });
                    setIsImporting(false);
                    e.target.value = '';
                    return;
                }

                // Process each row
                const validProducts = [];
                const rows = Array.isArray(results.data) ? results.data : [];
                
                if (rows.length === 0) {
                    setImportResults({
                        total: 0,
                        successful: 0,
                        failed: 0,
                        skipped: 0,
                        errors: ['The CSV file is empty or contains no valid data'],
                        summary: 'Error: The CSV file is empty or contains no valid data'
                    });
                    setIsImporting(false);
                    e.target.value = '';
                    return;
                }

                rows.forEach((row, index) => {
                    importStats.total++;
                    const rowNumber = index + 2; // +2 for 1-based index and header row
                    
                    try {
                        // Normalize and validate the row
                        const productData = normalizeCSVRow(row);

                        // Check for duplicate barcode
                        if (productData.barcode && products.find(p => p.barcode === productData.barcode)) {
                            importStats.skipped++;
                            importStats.errors.push(`Row ${rowNumber}: Product with barcode "${productData.barcode}" already exists`);
                            return;
                        }

                        // Validate product
                        const validation = validateProduct(productData);
                        if (!validation.isValid) {
                            importStats.failed++;
                            const errorDetails = Object.entries(validation.errors)
                                .map(([field, error]) => `${field}: ${error}`)
                                .join('; ');
                            importStats.errors.push(`Row ${rowNumber}: ${errorDetails}`);
                            return;
                        }

                        // Add to valid products
                        validProducts.push(productData);
                        importStats.successful++;
                        
                        // Store the imported products for later saving
                        setImportedProducts(validProducts);
                        setImportMode('bulk');

                    } catch (err) {
                        importStats.failed++;
                        importStats.errors.push(`Row ${rowNumber}: ${err.message || 'Unknown error'}`);
                    }
                });

                // Store valid products for later saving
                if (validProducts.length > 0) {
                    setImportedProducts(validProducts);
                    setImportMode('bulk');
                    
                    // Show success message with stats
                    const importTime = ((Date.now() - importStartTime) / 1000).toFixed(2);
                    importStats.summary = [
                        `Successfully processed ${validProducts.length} product(s) in ${importTime}s`,
                        `File: ${file.name}`,
                        `Total rows: ${importStats.total}`,
                        `Successfully imported: ${importStats.successful}`,
                        `Skipped (duplicates): ${importStats.skipped}`,
                        `Failed: ${importStats.failed}`
                    ].join('\n');
                    
                    if (importStats.errors.length > 0) {
                        importStats.summary += '\n\nSome rows had issues. Please review the errors below.';
                    }
                }

                // Prepare summary
                const summary = [
                    `File: ${file.name}`,
                    `Total rows: ${importStats.total}`,
                    `Successfully imported: ${importStats.successful}`,
                    `Skipped (duplicates): ${importStats.skipped}`,
                    `Failed: ${importStats.failed}`
                ];

                if (importStats.errors.length > 0) {
                    summary.push('\nErrors:');
                    summary.push(...importStats.errors.slice(0, 10)); // Show first 10 errors
                    if (importStats.errors.length > 10) {
                        summary.push(`... and ${importStats.errors.length - 10} more errors`);
                    }
                }

                setImportResults({
                    ...importStats,
                    summary: summary.join('\n')
                });
                
                setIsImporting(false);
                e.target.value = '';
            },
                error: (error) => {
                    parseError = error;
                    console.error('CSV Parse Error:', error);
                }
            });
        } catch (err) {
            parseError = err;
            console.error('Error during CSV parsing:', err);
        }

        if (parseError) {
            const errorMessage = `Failed to process CSV file: ${parseError.message || 'Invalid file format'}. Please check that the file is a valid CSV and try again.`;
            setImportResults({
                total: 0,
                successful: 0,
                failed: 0,
                skipped: 0,
                errors: [errorMessage],
                summary: `Error: ${errorMessage}`
            });
            setIsImporting(false);
            e.target.value = '';
            return;
        }
    };

    const StatCard = ({ title, value, color, subtitle = '' }) => (
        <div style={{
            textAlign: 'center',
            padding: '0.75rem',
            borderRadius: '6px',
            backgroundColor: `${color}10`,
            border: `1px solid ${color}30`
        }}>
            <div style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: color,
                lineHeight: 1.2
            }}>
                {value}
            </div>
            <div style={{
                fontSize: '0.85rem',
                color: '#555',
                marginTop: '0.25rem'
            }}>
                {title}
                {subtitle && <div style={{ fontSize: '0.75rem', color: '#777' }}>{subtitle}</div>}
            </div>
        </div>
    );

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
                
                <PermissionGate action="inventory.import">
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
                </PermissionGate>

                {/* Import Results */}
                {importResults && (
                    <div style={{
                        marginTop: '1.5rem',
                        padding: '1.5rem',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        backgroundColor: '#f9f9f9',
                        maxHeight: '400px',
                        overflowY: 'auto',
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
                            onClick={() => setImportMode('single')}
                        >
                            {formMode === 'bulk' ? `Save ${importedProducts.length} Product${importedProducts.length !== 1 ? 's' : ''}` : 'Save Product'}
                        </AppButton>
                    </PermissionGate>

                </form>
            </AppCard>
        </PageLayout>
    );
};

export default AddProduct;
