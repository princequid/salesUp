import React, { createContext, useContext, useState, useEffect } from 'react';
import * as productLogic from './productLogic';
import * as salesLogic from './salesLogic';
import * as stockLogic from './stockLogic';

const InventoryContext = createContext();

export const useInventory = () => useContext(InventoryContext);

const LOCAL_STORAGE_KEY = 'salesUp_data_v1';

const INITIAL_STATE = {
  products: [],
  sales: [],
  settings: {
    lowStockThreshold: 5,
    currency: 'USD',
    currencySymbol: '$',
    theme: 'dark', // light or dark
    businessName: 'My Shop',
    businessLogo: null
  }
};

export const InventoryProvider = ({ children }) => {
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      return saved ? JSON.parse(saved) : INITIAL_STATE;
    } catch (e) {
      console.error("Failed to load data", e);
      return INITIAL_STATE;
    }
  });

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  // Actions
  const addProduct = (product) => {
    setData(prev => ({
      ...prev,
      products: productLogic.addProduct(prev.products, product)
    }));
  };

  const updateProduct = (id, updates) => {
    setData(prev => ({
      ...prev,
      products: productLogic.updateProduct(prev.products, id, updates)
    }));
  };

  const deleteProduct = (id) => {
    setData(prev => ({
      ...prev,
      products: productLogic.deleteProduct(prev.products, id)
    }));
  };

  const recordSale = (saleDetails) => {
    const { product_id, quantity, payment_method } = saleDetails;
    const product = data.products.find(p => p.id === product_id);

    // Validation
    if (!product) throw new Error("Product not found");
    // We already have validateSale in salesLogic, but we do a quick check here or trust the UI
    if (product.quantity < quantity) throw new Error("Insufficient stock");

    // Calculate details using logic helper
    const { total, profit } = salesLogic.calculateSaleTotals(product, quantity);

    const saleData = {
      product_id,
      quantity: parseInt(quantity, 10),
      payment_method,
      total_price: total,
      profit: profit
    };

    setData(prev => {
      // 1. Update Stock
      const updatedProducts = stockLogic.reduceStock(prev.products, product_id, parseInt(quantity, 10));
      // 2. Add Sale Record
      const updatedSales = salesLogic.recordSale(prev.sales, saleData);

      return {
        ...prev,
        products: updatedProducts,
        sales: updatedSales
      };
    });
  };

  // STABILITY LOCK: Do NOT modify this function's logic
  // Transaction structure, stock reduction, and data model are frozen
  const recordTransaction = (cartItems, payment_method = 'Cash') => {
    // cartItems: [{ productId, quantity, total, ... }]

    // 1. Validate all items first
    cartItems.forEach(item => {
      const product = data.products.find(p => p.id === item.productId);
      if (!product) throw new Error(`Product not found: ${item.name}`);
      if (product.quantity < item.quantity) throw new Error(`Insufficient stock for ${product.name}`);
    });

    setData(prev => {
      let currentProducts = [...prev.products];
      // Calculate transaction totals
      const transactionTotal = cartItems.reduce((sum, item) => sum + item.total, 0);
      let transactionProfit = 0;
      let totalQuantity = 0;

      // Prepare items with snapshot data
      const transactionItems = cartItems.map(item => {
        const product = currentProducts.find(p => p.id === item.productId);
        const qty = parseInt(item.quantity, 10);

        // Calculate profit for this item
        const { profit } = salesLogic.calculateSaleTotals(product, qty);
        transactionProfit += profit;
        totalQuantity += qty;

        // Reduce Stock immediately
        currentProducts = stockLogic.reduceStock(currentProducts, item.productId, qty);

        return {
          productId: item.productId,
          name: product.name,
          quantity: qty,
          price: product.selling_price,
          cost: product.cost_price,
          total: item.total,
          profit: profit
        };
      });

      const newTransaction = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        items: transactionItems,
        total_price: transactionTotal,
        profit: transactionProfit,
        quantity: totalQuantity, // Total items count
        payment_method
      };

      // Add to sales list (transactions list)
      const currentSales = [newTransaction, ...prev.sales];

      return {
        ...prev,
        products: currentProducts,
        sales: currentSales
      };
    });
  };

  const updateSettings = (newSettings) => {
    setData(prev => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings }
    }));
  };

  // Selectors Helpers (using stockLogic for consistent filtering)
  const lowStockItems = stockLogic.getLowStockItems(data.products, data.settings.lowStockThreshold);

  const value = {
    products: data.products,
    sales: data.sales,
    settings: data.settings,
    addProduct,
    updateProduct,
    deleteProduct,
    recordSale,
    recordTransaction,
    updateSettings,
    lowStockItems
  };

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
};
