// Validation helper (existing)
export const validateProduct = (product) => {
    const errors = {};

    if (!product.name || product.name.trim() === '') {
        errors.name = "Product name is required";
    }

    if (!product.cost_price || isNaN(parseFloat(product.cost_price)) || parseFloat(product.cost_price) < 0) {
        errors.cost_price = "Valid cost price is required";
    }

    if (!product.selling_price || isNaN(parseFloat(product.selling_price)) || parseFloat(product.selling_price) < 0) {
        errors.selling_price = "Valid selling price is required";
    }

    if (!product.quantity || isNaN(parseInt(product.quantity)) || parseInt(product.quantity) < 0) {
        errors.quantity = "Valid quantity is required";
    }

    if (!product.category || product.category.trim() === '') {
        errors.category = "Category is required";
    }

    if (product.expirationDate != null && String(product.expirationDate).trim() !== '') {
        const raw = String(product.expirationDate).trim();
        const parts = raw.split('-');
        if (parts.length !== 3) {
            errors.expirationDate = 'Invalid expiration date';
        } else {
            const y = Number(parts[0]);
            const m = Number(parts[1]);
            const d = Number(parts[2]);
            const dt = new Date(y, (m || 0) - 1, d);
            const isValid = Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(d)
                && dt.getFullYear() === y
                && dt.getMonth() === (m - 1)
                && dt.getDate() === d;
            if (!isValid) {
                errors.expirationDate = 'Invalid expiration date';
            }
        }
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

// Search helper (existing renamed/aliased to match requirement)
export const searchProducts = (products, query) => {
    if (!query) return products;
    const lowerQuery = query.toLowerCase();
    return products.filter(p =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.category.toLowerCase().includes(lowerQuery)
    );
};

export const searchProduct = searchProducts; // Alias for requirement

// Logic: Add Product (returns new list)
export const addProduct = (currentList, productData) => {
    const newProduct = {
        ...productData,
        id: Date.now().toString(),
        barcode: productData.barcode || '',
        quantity: parseInt(productData.quantity, 10) || 0,
        cost_price: parseFloat(productData.cost_price) || 0,
        selling_price: parseFloat(productData.selling_price) || 0,
        expirationDate: productData.expirationDate && String(productData.expirationDate).trim() !== '' ? String(productData.expirationDate).trim() : null,
    };
    return [...currentList, newProduct];
};

// Logic: Update Product (returns new list)
export const updateProduct = (currentList, id, updates) => {
    return currentList.map(p => p.id === id ? { ...p, ...updates } : p);
};

// Logic: Delete Product (returns new list)
export const deleteProduct = (currentList, id) => {
    return currentList.filter(p => p.id !== id);
};
