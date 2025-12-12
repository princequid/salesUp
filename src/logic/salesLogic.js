export const calculateTotalPrice = (quantity, sellingPrice) => {
    return quantity * sellingPrice;
};

export const calculateProfit = (quantity, sellingPrice, costPrice) => {
    return quantity * (sellingPrice - costPrice);
};

export const calculateSaleTotals = (product, quantity) => {
    if (!product || !quantity || quantity <= 0) {
        return { total: 0, profit: 0 };
    }

    const qty = parseInt(quantity, 10);
    const total = calculateTotalPrice(qty, product.selling_price);
    const profit = calculateProfit(qty, product.selling_price, product.cost_price);

    return { total, profit };
};

export const validateSale = (product, quantity) => {
    const errors = {};

    if (!product) {
        errors.product = "Please select a product";
    }

    if (!quantity || quantity <= 0) {
        errors.quantity = "Please enter a valid quantity";
    } else if (product && quantity > product.quantity) {
        errors.quantity = `Insufficient stock (Available: ${product.quantity})`;
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

// Logic: Record Sale (returns new sales list wrapper or sale object)
export const recordSale = (currentSales, saleData) => {
    // saleData: { product_id, quantity, total_price, profit, payment_method }
    const newSale = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        ...saleData
    };
    return [newSale, ...currentSales];
};
