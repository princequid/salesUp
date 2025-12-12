export const getLowStockItems = (products, threshold) => {
    return products.filter(item => item.quantity <= threshold);
};

export const getStatusColor = (quantity, threshold) => {
    if (quantity === 0) return 'var(--accent-danger)'; // Out of stock
    if (quantity <= threshold) return 'var(--accent-warning)'; // Low stock
    return 'var(--accent-success)'; // Good
};

// Logic: Reduce Stock
export const reduceStock = (products, productId, amount) => {
    return products.map(p => {
        if (p.id === productId) {
            return { ...p, quantity: Math.max(0, p.quantity - amount) };
        }
        return p;
    });
};

// Logic: Increase Stock
export const increaseStock = (products, productId, amount) => {
    return products.map(p => {
        if (p.id === productId) {
            return { ...p, quantity: p.quantity + amount };
        }
        return p;
    });
};
