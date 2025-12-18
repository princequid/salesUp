/*
 * STABILITY LOCK: POS Cart & Transaction Logic
 * Do NOT modify:
 * - Cart data structure (cart state array)
 * - Total calculation logic (subtotal, tax, discount, total)
 * - Stock deduction logic (recordTransaction)
 * - Quantity update handlers
 */
import React, { useState, useEffect, useRef } from 'react';
import { useInventory } from '../../logic/InventoryContext';
import { calculateSaleTotals, validateSale } from '../../logic/salesLogic';
import { ArrowLeft, CheckCircle, Calculator, Package, Hash, Plus, Minus, Printer, Download, Scan, Camera } from 'lucide-react';
import { AppButton, AppCard, AppInput, AppSectionHeader, AppIconButton, BarcodeScanner } from '../../components';
import PageLayout from '../../components/PageLayout';
import PermissionGate from '../../components/PermissionGate';
import { useAuth } from '../../logic/AuthContext';
import { useMoneyFormatter } from '../../logic/currencyFormat';
import jsPDF from 'jspdf';
import { useStore } from '../../logic/storeContextImpl';

const RecordSale = ({ onNavigate }) => {
    const { products, recordTransaction, voidLastTransaction, settings } = useInventory();
    const { activeStore } = useStore();
    const money = useMoneyFormatter();
    const { requireAuth } = useAuth();

    const storeName = String(activeStore?.name || settings?.businessName || '').trim();
    const isStoreNameReady = !!storeName;

    const [selectedProductId, setSelectedProductId] = useState('');
    const [quantity, setQuantity] = useState('');
    const [cart, setCart] = useState([]);
    const [errors, setErrors] = useState({});
    const [searchQuery, setSearchQuery] = useState(''); // Product search
    const [lastReceipt, setLastReceipt] = useState(null); // Receipt data
    const [showReceipt, setShowReceipt] = useState(false); // Receipt modal visibility
    const [discountType, setDiscountType] = useState('fixed'); // 'fixed' or 'percentage'
    const [discountValue, setDiscountValue] = useState(''); // Discount amount or percentage
    const [paymentMethod, setPaymentMethod] = useState('Cash'); // Payment method
    const [barcodeInput, setBarcodeInput] = useState(''); // Barcode scanner input
    const [scanSuccess, setScanSuccess] = useState(''); // Success feedback message
    const [highlightedItemId, setHighlightedItemId] = useState(null); // Track highlighted cart item
    const [showCameraScanner, setShowCameraScanner] = useState(false); // Camera scanner visibility
    
    const barcodeInputRef = useRef(null);

    // Auto-focus barcode input on mount
    useEffect(() => {
        if (barcodeInputRef.current) {
            barcodeInputRef.current.focus();
        }
    }, []);

    // Find selected product object
    const selectedProduct = products.find(p => p.id === selectedProductId);

    // Filter products based on search query
    const filteredProducts = products.filter(p => {
        const matchesSearch = searchQuery === '' || p.name.toLowerCase().includes(searchQuery.toLowerCase());
        const hasStock = p.quantity > 0;
        return matchesSearch && hasStock;
    });

    // Calculate cart totals
    const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
    const tax = 0; // Placeholder for future tax logic

    // Calculate discount
    let discount = 0;
    if (discountValue && !isNaN(discountValue)) {
        const discountNum = parseFloat(discountValue);
        if (discountType === 'percentage') {
            discount = (subtotal * discountNum) / 100;
        } else {
            discount = discountNum;
        }
        // Ensure discount doesn't exceed subtotal
        discount = Math.min(discount, subtotal);
    }

    const total = subtotal + tax - discount;

    // Shared barcode processing logic (reused by keyboard and camera scanner)
    const processBarcodeValue = (scannedBarcode) => {
        if (!requireAuth()) return false;
        // Search for product by barcode field
        const product = products.find(p => 
            p.barcode && p.barcode === scannedBarcode
        );
        
        // Handle barcode not found
        if (!product) {
            setErrors(prev => ({ ...prev, barcode: `Product not found: ${scannedBarcode}` }));
            return false;
        }
        
        // Handle out-of-stock
        if (product.quantity <= 0) {
            setErrors(prev => ({ ...prev, barcode: `Out of stock: ${product.name}` }));
            return false;
        }
        
        // Clear any previous barcode errors
        if (errors.barcode) {
            setErrors(prev => ({ ...prev, barcode: null }));
        }
        
        // Auto-add to cart with quantity 1
        const existingItemIndex = cart.findIndex(item => item.productId === product.id);
        
        if (existingItemIndex >= 0) {
            // Update existing item
            const newCart = [...cart];
            const currentItem = newCart[existingItemIndex];
            const newQuantity = currentItem.quantity + 1;
            
            // Check if adding one more exceeds stock
            if (newQuantity > product.quantity) {
                setErrors(prev => ({ ...prev, barcode: `Only ${product.quantity} in stock for ${product.name}` }));
                return false;
            }
            
            const stats = calculateSaleTotals(product, newQuantity);
            newCart[existingItemIndex] = {
                ...currentItem,
                quantity: newQuantity,
                total: stats.total
            };
            setCart(newCart);
            
            // Highlight updated item
            setHighlightedItemId(product.id);
            setTimeout(() => setHighlightedItemId(null), 800);
        } else {
            // Add new item
            const stats = calculateSaleTotals(product, 1);
            setCart(prev => [...prev, {
                productId: product.id,
                name: product.name,
                price: product.selling_price,
                quantity: 1,
                total: stats.total
            }]);
            
            // Highlight new item
            setHighlightedItemId(product.id);
            setTimeout(() => setHighlightedItemId(null), 800);
        }
        
        // Show success feedback
        setScanSuccess(`Added: ${product.name}`);
        setTimeout(() => setScanSuccess(''), 1500);
        
        return true;
    };

    const handleBarcodeScan = (e) => {
        if (!requireAuth()) {
            e.preventDefault();
            return;
        }
        if (e.key === 'Enter' && barcodeInput.trim()) {
            e.preventDefault();
            
            const scannedBarcode = barcodeInput.trim();
            processBarcodeValue(scannedBarcode);
            
            // Clear barcode input
            setBarcodeInput('');
            
            // Refocus for next scan
            if (barcodeInputRef.current) {
                barcodeInputRef.current.focus();
            }
        }
    };

    const handleCameraScan = (barcodeValue) => {
        if (!requireAuth()) return;
        const success = processBarcodeValue(barcodeValue);
        if (success) {
            // Close camera scanner on successful scan
            setShowCameraScanner(false);
        }
    };

    const handleQuantityChange = (e) => {
        setQuantity(e.target.value);
        if (errors.quantity) setErrors(prev => ({ ...prev, quantity: null }));
    };

    const handleProductChange = (e) => {
        setSelectedProductId(e.target.value);
        if (errors.product) setErrors(prev => ({ ...prev, product: null }));
    };

    const handleAddToCart = (e) => {
        e.preventDefault();

        if (!requireAuth()) return;

        // Validate
        const validation = validateSale(selectedProduct, quantity);
        if (!validation.isValid) {
            setErrors(validation.errors);
            return;
        }

        // Check if item already in cart
        const existingItemIndex = cart.findIndex(item => item.productId === selectedProductId);

        if (existingItemIndex >= 0) {
            // Update existing item
            const newCart = [...cart];
            const currentItem = newCart[existingItemIndex];
            const newQuantity = currentItem.quantity + parseInt(quantity, 10);

            // Re-validate stock with total quantity
            if (newQuantity > selectedProduct.quantity) {
                setErrors({ quantity: `Insufficient stock for total amount (Max: ${selectedProduct.quantity})` });
                return;
            }

            const stats = calculateSaleTotals(selectedProduct, newQuantity);
            newCart[existingItemIndex] = {
                ...currentItem,
                quantity: newQuantity,
                total: stats.total
            };
            setCart(newCart);
        } else {
            // Add new item
            const stats = calculateSaleTotals(selectedProduct, quantity);
            setCart(prev => [...prev, {
                productId: selectedProductId,
                name: selectedProduct.name,
                price: selectedProduct.selling_price,
                quantity: parseInt(quantity, 10),
                total: stats.total
            }]);
        }

        // Reset inputs
        setSelectedProductId('');
        setQuantity('');
        setErrors({});
    };

    const removeFromCart = (index) => {
        if (!requireAuth()) return;
        setCart(prev => prev.filter((_, i) => i !== index));
    };

    const updateCartItemQuantity = (index, delta) => {
        if (!requireAuth()) return;
        const newCart = [...cart];
        const item = newCart[index];
        const product = products.find(p => p.id === item.productId);

        // Safety check if product doesn't exist anymore (shouldn't happen provided valid sync)
        if (!product) return;

        const newQuantity = item.quantity + delta;

        // Basic validation
        if (newQuantity < 1) return;
        if (newQuantity > product.quantity) {
            // Optional: could add a toast/error here, for now just ignore
            return;
        }

        const stats = calculateSaleTotals(product, newQuantity);
        newCart[index] = {
            ...item,
            quantity: newQuantity,
            total: stats.total
        };
        setCart(newCart);
    };

    const handleCompleteTransaction = () => {
        if (!requireAuth()) return;
        if (cart.length === 0) return;

        if (!isStoreNameReady) {
            alert('Loading business profile... Please wait and try again.');
            return;
        }

        // Prepare receipt data (read-only, doesn't modify checkout)
        const receiptData = {
            receiptId: Date.now().toString(),
            storeName,
            dateTime: new Date().toISOString(),
            paymentMethod: paymentMethod,
            items: cart.map(item => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                lineTotal: item.total
            })),
            subtotal: subtotal,
            tax: tax,
            discount: discount,
            total: total
        };

        try {
            // Pass receipt data to be stored in transaction history
            recordTransaction(cart, paymentMethod, receiptData);
            console.log('[RecordSale] Transaction completed and saved:', receiptData);

            // Store receipt for later use
            setLastReceipt(receiptData);

            // Clear cart first
            setCart([]);

            // Show receipt modal instead of alert
            setShowReceipt(true);
        } catch (err) {
            alert("⚠ Transaction Failed\n\n" + err.message);
        }
    };

    const handleCloseReceipt = () => {
        setShowReceipt(false);
        onNavigate('dashboard');
    };

    const handlePrintReceipt = () => {
        if (!requireAuth()) return;
        window.print();
    };

    const handleDownloadPDF = () => {
        if (!requireAuth()) return;
        if (!lastReceipt) return;

        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: [80, 200] // Receipt paper width (80mm) and flexible height
        });

        // Set font
        doc.setFont('courier');

        let yPos = 10;
        const pageWidth = 80;
        const margin = 5;
        const contentWidth = pageWidth - (margin * 2);

        // Header (Logo if available)
        doc.setFontSize(16);
        doc.setFont('courier', 'bold');
        if (activeStore?.logoBase64) {
            try {
                const imgType = /data:image\/(png|jpeg|jpg)/i.test(activeStore.logoBase64) ? (activeStore.logoBase64.match(/data:image\/(png|jpeg|jpg)/i)[1].toUpperCase() === 'JPG' ? 'JPEG' : activeStore.logoBase64.match(/data:image\/(png|jpeg|jpg)/i)[1].toUpperCase()) : 'PNG';
                const imgWidth = 30; const imgHeight = 12; const x = (pageWidth - imgWidth) / 2;
                doc.addImage(activeStore.logoBase64, imgType, x, yPos, imgWidth, imgHeight);
                yPos += imgHeight + 4;
            } catch { /* ignore logo render errors */ }
        }

        const pdfStoreName = String(lastReceipt.storeName || '').trim();
        if (pdfStoreName) {
            doc.setFontSize(12);
            doc.text(pdfStoreName, pageWidth / 2, yPos, { align: 'center' });
            yPos += 6;
            doc.setFontSize(16);
        }
        doc.text('RECEIPT', pageWidth / 2, yPos, { align: 'center' });
        yPos += 8;

        // Date and Receipt ID
        doc.setFontSize(9);
        doc.setFont('courier', 'normal');
        const dateStr = new Date(lastReceipt.dateTime).toLocaleString();
        doc.text(dateStr, pageWidth / 2, yPos, { align: 'center' });
        yPos += 5;
        doc.text(`Receipt #: ${lastReceipt.receiptId}`, pageWidth / 2, yPos, { align: 'center' });
        yPos += 4;
        doc.text(`Payment: ${lastReceipt.paymentMethod}`, pageWidth / 2, yPos, { align: 'center' });
        yPos += 8;

        // Line separator
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 5;

        // Items header
        doc.setFontSize(8);
        doc.setFont('courier', 'bold');
        doc.text('Item', margin, yPos);
        doc.text('Qty', pageWidth - margin - 35, yPos);
        doc.text('Price', pageWidth - margin - 20, yPos);
        doc.text('Total', pageWidth - margin, yPos, { align: 'right' });
        yPos += 4;

        // Items
        doc.setFont('courier', 'normal');
        lastReceipt.items.forEach(item => {
            // Item name (may wrap)
            const itemName = item.name.length > 20 ? item.name.substring(0, 20) : item.name;
            doc.text(itemName, margin, yPos);
            doc.text(String(item.quantity), pageWidth - margin - 35, yPos);
            doc.text(`$${item.price.toFixed(2)}`, pageWidth - margin - 20, yPos);
            doc.text(`$${item.lineTotal.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
            yPos += 5;
        });

        // Line separator
        yPos += 2;
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 5;

        // Totals
        doc.setFontSize(9);
        doc.text('Subtotal:', margin, yPos);
        doc.text(`$${lastReceipt.subtotal.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
        yPos += 5;

        doc.text('Tax:', margin, yPos);
        doc.text(`$${lastReceipt.tax.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
        yPos += 5;

        doc.text('Discount:', margin, yPos);
        doc.text(`-$${lastReceipt.discount.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
        yPos += 7;

        // Total
        doc.setFont('courier', 'bold');
        doc.setFontSize(11);
        doc.text('TOTAL:', margin, yPos);
        doc.text(`$${lastReceipt.total.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
        yPos += 8;

        // Footer
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 5;
        doc.setFontSize(8);
        doc.setFont('courier', 'normal');
        doc.text('Thank you for your business!', pageWidth / 2, yPos, { align: 'center' });

        // Save PDF
        doc.save(`receipt-${lastReceipt.receiptId}.pdf`);
    };

    return (
        <PageLayout>
            <header style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
                <AppIconButton icon={ArrowLeft} onClick={() => onNavigate('dashboard')} size={24} color="var(--text-primary)" />
                <h1 className="text-h1">Record Sale</h1>
            </header>

            {/* Barcode Scanner Input - Hidden but functional */}
            <div style={{ 
                marginBottom: 'var(--spacing-md)',
                padding: 'var(--spacing-sm)',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-sm)',
                border: '1px dashed var(--border-color)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                    <Scan size={16} color="var(--text-secondary)" />
                    <input
                        ref={barcodeInputRef}
                        type="text"
                        className="input-field"
                        value={barcodeInput}
                        onChange={(e) => {
                            setBarcodeInput(e.target.value);
                            if (errors.barcode) setErrors(prev => ({ ...prev, barcode: null }));
                        }}
                        onKeyDown={handleBarcodeScan}
                        placeholder="Scan barcode or type product name..."
                        style={{ 
                            flex: 1,
                            fontSize: '0.875rem',
                            padding: '0.5rem',
                            background: 'var(--bg-card)'
                        }}
                    />
                    <button
                        type="button"
                        onClick={() => {
                            if (!requireAuth()) return;
                            setShowCameraScanner(true);
                        }}
                        style={{
                            background: 'var(--accent-primary)',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '0.5rem 0.75rem',
                            color: '#fff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            fontSize: '0.875rem'
                        }}
                    >
                        <Camera size={16} />
                        <span>Scan</span>
                    </button>
                </div>
                {errors.barcode && (
                    <div style={{ 
                        marginTop: 'var(--spacing-xs)', 
                        fontSize: '0.75rem', 
                        color: 'var(--color-error)',
                        paddingLeft: '1.5rem'
                    }}>
                        {errors.barcode}
                    </div>
                )}
                {scanSuccess && (
                    <div style={{ 
                        marginTop: 'var(--spacing-xs)', 
                        fontSize: '0.75rem', 
                        color: 'var(--accent-success)',
                        paddingLeft: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                    }}>
                        <CheckCircle size={12} />
                        {scanSuccess}
                    </div>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)' }}>
                {/* Left Column: Add Product */}
                <AppCard style={{ padding: 'var(--spacing-lg)', height: 'fit-content' }}>
                    <form onSubmit={handleAddToCart} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                        <AppSectionHeader title="Add Item to Cart" />

                        {/* Product Search */}
                        <div style={{ marginBottom: 'var(--spacing-md)' }}>
                            <label className="text-sm" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Search Products</label>
                            <input
                                type="text"
                                className="input-field"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Type to search..."
                                style={{ width: '100%' }}
                            />
                        </div>

                        {/* Product Selection */}
                        <div style={{ marginBottom: 'var(--spacing-md)' }}>
                            <label className="text-sm" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Select Product</label>
                            <div style={{ position: 'relative' }}>
                                <Package size={18} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '1rem', color: 'var(--text-secondary)' }} />
                                <select
                                    className="input-field"
                                    value={selectedProductId}
                                    onChange={handleProductChange}
                                    style={{ cursor: 'pointer', paddingLeft: '2.5rem', width: '100%' }}
                                >
                                    <option value="">-- Choose Item --</option>
                                    {filteredProducts.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} (Stock: {p.quantity}) - ${p.selling_price}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {errors.product && <span style={{ color: 'var(--accent-danger)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{errors.product}</span>}
                        </div>

                        {/* Quantity Input */}
                        <AppInput
                            label="Quantity"
                            type="number"
                            value={quantity}
                            onChange={handleQuantityChange}
                            placeholder="0"
                            min="1"
                            error={errors.quantity}
                            icon={Hash}
                        />

                        <AppButton type="submit" icon={CheckCircle} variant="secondary" fullWidth>
                            Add to Cart
                        </AppButton>
                    </form>
                </AppCard>

                {/* Right Column: Cart Summary */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                    <AppCard style={{ padding: 'var(--spacing-lg)', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <AppSectionHeader title={`Cart (${cart.length} items)`} />

                        <div style={{ flex: 1, overflowY: 'auto', minHeight: '200px', marginBottom: 'var(--spacing-md)' }}>
                            {cart.length === 0 ? (
                                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                                    Cart is empty
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                                    {cart.map((item, index) => (
                                        <div key={index} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: 'var(--spacing-md)',
                                            background: highlightedItemId === item.productId ? 'var(--accent-success-bg)' : 'var(--bg-secondary)',
                                            borderRadius: 'var(--radius-sm)',
                                            border: highlightedItemId === item.productId ? '1px solid var(--accent-success)' : '1px solid var(--border-color)',
                                            marginBottom: 'var(--spacing-xs)',
                                            transition: 'all 0.3s ease'
                                        }}>
                                            <div>
                                                <div style={{ fontWeight: 500 }}>{item.name}</div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginTop: '4px' }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => updateCartItemQuantity(index, -1)}
                                                        disabled={item.quantity <= 1}
                                                        style={{
                                                            background: 'var(--bg-card)',
                                                            border: '1px solid var(--border-color)', // Added border
                                                            color: 'var(--text-primary)', // Ensure icon color
                                                            borderRadius: '4px',
                                                            width: '28px', // Slightly larger
                                                            height: '28px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer',
                                                            opacity: item.quantity <= 1 ? 0.5 : 1
                                                        }}
                                                    >
                                                        <span style={{ fontSize: '18px', lineHeight: 1 }}>−</span>
                                                    </button>
                                                    <span style={{ fontSize: '0.9rem', minWidth: '20px', textAlign: 'center', fontWeight: 600 }}>{item.quantity}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => updateCartItemQuantity(index, 1)}
                                                        style={{
                                                            background: 'var(--bg-card)',
                                                            border: '1px solid var(--border-color)',
                                                            color: 'var(--text-primary)',
                                                            borderRadius: '4px',
                                                            width: '28px',
                                                            height: '28px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        <span style={{ fontSize: '18px', lineHeight: 1 }}>+</span>
                                                    </button>
                                                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginLeft: '4px' }}>
                                                        x ${item.price}
                                                    </span>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                                <span style={{ fontWeight: 'bold' }}>{money(item.total)}</span>
                                                <button
                                                    onClick={() => removeFromCart(index)}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: 'var(--accent-danger)',
                                                        cursor: 'pointer',
                                                        padding: '4px'
                                                    }}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Totals */}
                        <div style={{
                            borderTop: '1px solid var(--border-color)',
                            paddingTop: 'var(--spacing-md)',
                            marginTop: 'auto'
                        }}>
                            {/* Payment Method Selection */}
                            <div style={{ marginBottom: 'var(--spacing-md)', padding: 'var(--spacing-sm)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
                                <label className="text-sm" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Payment Method</label>
                                <select
                                    className="input-field"
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    style={{ width: '100%' }}
                                >
                                    <option value="Cash">Cash</option>
                                    <option value="Card">Card</option>
                                    <option value="Transfer">Transfer</option>
                                </select>
                            </div>

                            {/* Discount Input */}
                            <PermissionGate action="pos.discount" fallback={(
                                <div style={{ marginBottom: 'var(--spacing-md)', padding: 'var(--spacing-sm)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                    Discounts are disabled for your role.
                                </div>
                            )}>
                                <div style={{ marginBottom: 'var(--spacing-md)', padding: 'var(--spacing-sm)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
                                    <label className="text-sm" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Apply Discount (Optional)</label>
                                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                        <select
                                            className="input-field"
                                            value={discountType}
                                            onChange={(e) => setDiscountType(e.target.value)}
                                            style={{ flex: '0 0 auto', width: '120px' }}
                                        >
                                            <option value="fixed">Fixed ($)</option>
                                            <option value="percentage">Percent (%)</option>
                                        </select>
                                        <input
                                            type="number"
                                            className="input-field"
                                            value={discountValue}
                                            onChange={(e) => setDiscountValue(e.target.value)}
                                            placeholder={discountType === 'percentage' ? 'Enter %' : 'Enter $'}
                                            min="0"
                                            step={discountType === 'percentage' ? '1' : '0.01'}
                                            max={discountType === 'percentage' ? '100' : undefined}
                                            style={{ flex: 1 }}
                                        />
                                    </div>
                                </div>
                            </PermissionGate>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                    <span>Subtotal:</span>
                                    <span>{money(subtotal)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                    <span>Tax:</span>
                                    <span>{money(tax)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                    <span>Discount:</span>
                                    <span>-{money(discount)}</span>
                                </div>
                            </div>

                            {/* Total Payable - Prominent */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: 'var(--spacing-md)',
                                background: 'var(--bg-tertiary)',
                                borderRadius: 'var(--radius-sm)',
                                marginBottom: 'var(--spacing-md)',
                                border: '2px solid var(--accent-primary)'
                            }}>
                                <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Total Payable:</span>
                                <span style={{ fontWeight: 'bold', fontSize: '1.5rem', color: 'var(--accent-primary)' }}>{money(total)}</span>
                            </div>

                            {/* Undo Last Transaction (Admin only) */}
                            <PermissionGate action="sales.void">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const reason = window.prompt('Enter reason for undo (required):', '');
                                        const trimmed = String(reason || '').trim();
                                        if (!trimmed) {
                                            alert('Undo reason is required.');
                                            return;
                                        }
                                        voidLastTransaction(trimmed);
                                    }}
                                    style={{
                                        marginBottom: 'var(--spacing-sm)',
                                        padding: '0.5rem 0.75rem',
                                        background: 'var(--bg-secondary)',
                                        color: 'var(--text-primary)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: 'var(--radius-sm)',
                                        cursor: 'pointer',
                                        width: '100%'
                                    }}
                                >
                                    Undo Last Transaction
                                </button>
                            </PermissionGate>

                            <AppButton
                                onClick={handleCompleteTransaction}
                                icon={Calculator}
                                fullWidth
                                disabled={cart.length === 0 || !isStoreNameReady}
                                style={{
                                    fontSize: '1.1rem',
                                    fontWeight: 700,
                                    padding: 'var(--spacing-md)',
                                    height: '56px'
                                }}
                            >
                                Complete Transaction
                            </AppButton>
                        </div>
                    </AppCard>
                </div>
            </div>

            {/* Receipt Modal */}
            {showReceipt && lastReceipt && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <AppCard
                        className="receipt-print-content"
                        style={{
                            maxWidth: '400px',
                            width: '90%',
                            maxHeight: '85vh',
                            overflowY: 'auto',
                            overflowX: 'hidden',
                            padding: 'var(--spacing-xl)',
                            paddingBottom: '100px', // Extra padding for bottom nav clearance
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                        {/* Receipt Header */}
                        <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-lg)', borderBottom: '2px solid var(--border-color)', paddingBottom: 'var(--spacing-md)' }}>
                            {!!String(lastReceipt.storeName || '').trim() && (
                                <div style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                                    {String(lastReceipt.storeName || '').trim()}
                                </div>
                            )}
                            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>RECEIPT</h2>
                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                {new Date(lastReceipt.dateTime).toLocaleString()}
                            </p>
                            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                Receipt #: {lastReceipt.receiptId}
                            </p>
                            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                Payment: {lastReceipt.paymentMethod}
                            </p>
                        </div>

                        {/* Items Table */}
                        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <th style={{ textAlign: 'left', padding: '0.5rem 0', fontWeight: 600 }}>Item</th>
                                        <th style={{ textAlign: 'center', padding: '0.5rem 0', fontWeight: 600 }}>Qty</th>
                                        <th style={{ textAlign: 'right', padding: '0.5rem 0', fontWeight: 600 }}>Price</th>
                                        <th style={{ textAlign: 'right', padding: '0.5rem 0', fontWeight: 600 }}>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lastReceipt.items.map((item, index) => (
                                        <tr key={index} style={{ borderBottom: '1px dashed var(--border-color)' }}>
                                            <td style={{ padding: '0.5rem 0' }}>{item.name}</td>
                                            <td style={{ textAlign: 'center', padding: '0.5rem 0' }}>{item.quantity}</td>
                                            <td style={{ textAlign: 'right', padding: '0.5rem 0' }}>${item.price.toFixed(2)}</td>
                                            <td style={{ textAlign: 'right', padding: '0.5rem 0' }}>${item.lineTotal.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Totals */}
                        <div style={{ borderTop: '2px solid var(--border-color)', paddingTop: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)', fontFamily: 'monospace' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                                <span>Subtotal:</span>
                                <span>${lastReceipt.subtotal.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                                <span>Tax:</span>
                                <span>${lastReceipt.tax.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                                <span>Discount:</span>
                                <span>-${lastReceipt.discount.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--spacing-md)', paddingTop: 'var(--spacing-md)', borderTop: '2px solid var(--border-color)', fontSize: '1.25rem', fontWeight: 'bold' }}>
                                <span>TOTAL:</span>
                                <span>${lastReceipt.total.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Footer */}
                        <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-md)', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            Thank you for your business!
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
                            <AppButton onClick={handleDownloadPDF} icon={Download} fullWidth className="no-print">
                                Download PDF
                            </AppButton>
                            <AppButton onClick={handlePrintReceipt} icon={Printer} fullWidth className="no-print">
                                Print Receipt
                            </AppButton>
                            <AppButton onClick={handleCloseReceipt} fullWidth className="no-print">
                                Close
                            </AppButton>
                        </div>
                    </AppCard>
                </div>
            )}

            {/* Camera Barcode Scanner */}
            {showCameraScanner && (
                <BarcodeScanner
                    onScan={handleCameraScan}
                    onClose={() => setShowCameraScanner(false)}
                />
            )}
        </PageLayout>
    );
};

export default RecordSale;

