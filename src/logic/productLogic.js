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
        quantity: parseInt(productData.quantity, 10) || 0,
        cost_price: parseFloat(productData.cost_price) || 0,
        selling_price: parseFloat(productData.selling_price) || 0,
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
