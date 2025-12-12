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
    updateSettings,
    lowStockItems
  };

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
};
