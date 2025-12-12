import React, { useState, useEffect } from 'react';
import { useInventory } from '../../logic/InventoryContext';
import { calculateSaleTotals, validateSale } from '../../logic/salesLogic';
import { ArrowLeft, CheckCircle, Calculator } from 'lucide-react';

const RecordSale = ({ onNavigate }) => {
    const { products, recordSale } = useInventory();

    const [selectedProductId, setSelectedProductId] = useState('');
    const [quantity, setQuantity] = useState('');
    const [calculations, setCalculations] = useState({ total: 0, profit: 0 });
    const [errors, setErrors] = useState({});

    // Find selected product object
    const selectedProduct = products.find(p => p.id === selectedProductId);

    // Update calculations when product or quantity changes
    useEffect(() => {
        const stats = calculateSaleTotals(selectedProduct, quantity);
        setCalculations(stats);
    }, [selectedProduct, quantity]);

    const handleQuantityChange = (e) => {
        setQuantity(e.target.value);
        if (errors.quantity) setErrors(prev => ({ ...prev, quantity: null }));
    };

    const handleProductChange = (e) => {
        setSelectedProductId(e.target.value);
        if (errors.product) setErrors(prev => ({ ...prev, product: null }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const validation = validateSale(selectedProduct, quantity);
        if (!validation.isValid) {
            setErrors(validation.errors);
            return;
        }

        try {
            recordSale({
                product_id: selectedProductId,
                quantity: quantity,
                payment_method: 'Cash' // Default for now
            });
            alert(`Sale Recorded! Total: $${calculations.total.toFixed(2)}`);
            onNavigate('dashboard');
        } catch (err) {
            alert("Error recording sale: " + err.message);
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
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Record Sale</h1>
            </header>

            <div className="glass-panel" style={{ padding: '2rem' }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Transaction Details */}
                    <div>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem', color: 'var(--text-primary)' }}>Transaction Details</h3>

                        {/* Product Selection */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Select Product</label>
                            <select
                                className="input-field"
                                value={selectedProductId}
                                onChange={handleProductChange}
                                style={{ cursor: 'pointer' }}
                            >
                                <option value="">-- Choose Item --</option>
                                {products.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.name} (Stock: {p.quantity}) - ${p.selling_price}
                                    </option>
                                ))}
                            </select>
                            {errors.product && <span style={{ color: 'var(--accent-danger)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{errors.product}</span>}
                        </div>

                        {/* Quantity Input */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Quantity to Sell</label>
                            <input
                                type="number"
                                className="input-field"
                                value={quantity}
                                onChange={handleQuantityChange}
                                placeholder="0"
                                min="1"
                            />
                            {errors.quantity && <span style={{ color: 'var(--accent-danger)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{errors.quantity}</span>}
                        </div>
                    </div>

                    {/* Summary */}
                    <div>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem', color: 'var(--text-primary)' }}>Summary</h3>

                        {/* Calculations Display */}
                        <div style={{
                            background: 'var(--bg-secondary)',
                            padding: '1.25rem',
                            borderRadius: 'var(--radius-md)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.75rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Total Price:</span>
                                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>${calculations.total.toFixed(2)}</span>
                            </div>
                            <hr style={{ border: 'none', borderTop: '1px solid rgba(0,0,0,0.05)' }} />
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Est. Profit:</span>
                                <span style={{ color: 'var(--accent-success)', fontWeight: 600 }}>${calculations.profit.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem', width: '100%', padding: '1rem', fontSize: '1rem', borderRadius: 'var(--radius-md)' }}>
                        <CheckCircle size={20} style={{ marginRight: '0.5rem' }} />
                        Confirm Sale
                    </button>

                </form>
            </div>
        </div>
    );
};

export default RecordSale;
