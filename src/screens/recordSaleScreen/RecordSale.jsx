import React, { useState, useEffect } from 'react';
import { useInventory } from '../../logic/InventoryContext';
import { calculateSaleTotals, validateSale } from '../../logic/salesLogic';
import { ArrowLeft, CheckCircle, Calculator, Package, Hash } from 'lucide-react';
import { AppButton, AppCard, AppInput, AppSectionHeader, AppIconButton } from '../../components';
import PageLayout from '../../components/PageLayout';

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
        <PageLayout>
            <header style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
                <AppIconButton icon={ArrowLeft} onClick={() => onNavigate('dashboard')} size={24} color="var(--text-primary)" />
                <h1 className="text-h1">Record Sale</h1>
            </header>

            <AppCard style={{ padding: 'var(--spacing-lg)' }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>

                    {/* Transaction Details */}
                    <div>
                        <AppSectionHeader title="Transaction Details" />

                        {/* Product Selection */}
                        <div style={{ marginBottom: 'var(--spacing-md)' }}>
                            <label className="text-sm" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Select Product</label>
                            <div style={{ position: 'relative' }}>
                                <Package size={18} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '1rem', color: 'var(--text-secondary)' }} />
                                <select
                                    className="input-field"
                                    value={selectedProductId}
                                    onChange={handleProductChange}
                                    style={{ cursor: 'pointer', paddingLeft: '2.5rem' }}
                                >
                                    <option value="">-- Choose Item --</option>
                                    {products.map(p => (
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
                            label="Quantity to Sell"
                            type="number"
                            value={quantity}
                            onChange={handleQuantityChange}
                            placeholder="0"
                            min="1"
                            error={errors.quantity}
                            icon={Hash}
                        />
                    </div>

                    {/* Summary */}
                    <div>
                        <AppSectionHeader title="Summary" />

                        {/* Calculations Display */}
                        <div style={{
                            background: 'var(--bg-secondary)',
                            padding: 'var(--spacing-md)',
                            borderRadius: 'var(--radius-md)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 'var(--spacing-sm)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Total Price:</span>
                                <span className="text-h2" style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>${calculations.total.toFixed(2)}</span>
                            </div>
                            <hr style={{ border: 'none', borderTop: '1px solid rgba(0,0,0,0.05)' }} />
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Est. Profit:</span>
                                <span style={{ color: 'var(--accent-success)', fontWeight: 600 }}>${calculations.profit.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <AppButton type="submit" icon={CheckCircle} fullWidth>
                        Confirm Sale
                    </AppButton>

                </form>
            </AppCard>
        </PageLayout>
    );
};

export default RecordSale;
