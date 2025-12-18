import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import * as productLogic from './productLogic';
import * as salesLogic from './salesLogic';
import * as stockLogic from './stockLogic';
import cloudSyncService from './cloudSyncService';
import { useStore } from './storeContextImpl';
import { useRole } from './roleUtils';

const InventoryContext = createContext();

export const useInventory = () => useContext(InventoryContext);

const INITIAL_STATE = {
  products: [],
  sales: [],
  transactions: [], // Receipt history with full details
  settings: {
    lowStockThreshold: 5,
    currency: 'USD',
    currencySymbol: '$',
    theme: 'dark', // light or dark
    businessName: 'My Shop',
    businessLogo: null,
    adminSwitchPasswordHash: ''
  }
};

export const InventoryProvider = ({ children }) => {
  const { activeStoreId } = useStore();
  const { userRole, ROLES } = useRole();
  const isCashierMode = userRole === ROLES.CASHIER;
  const isGuestMode = userRole === ROLES.GUEST;
  const LOCAL_STORAGE_KEY = `salesUp_data_v1_${activeStoreId}`;

  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsedData = JSON.parse(saved);

        // Ensure settings exist and include all defaults for forward/backward compatibility
        parsedData.settings = { ...INITIAL_STATE.settings, ...(parsedData.settings || {}) };

        // Ensure transactions array exists for backward compatibility
        if (!parsedData.transactions) {
          console.log('[ReceiptHistory] Initializing transactions array from legacy data');
          parsedData.transactions = [];
        }
        console.log('[ReceiptHistory] Loaded data:', {
          productsCount: parsedData.products?.length || 0,
          salesCount: parsedData.sales?.length || 0,
          transactionsCount: parsedData.transactions?.length || 0
        });
        return parsedData;
      }
      console.log('[ReceiptHistory] No saved data, using INITIAL_STATE');
      return INITIAL_STATE;
    } catch (e) {
      console.error("Failed to load data", e);
      return INITIAL_STATE;
    }
  });

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    console.log('[ReceiptHistory] Data saved to localStorage:', {
      transactionsCount: data.transactions?.length || 0
    });

    // Auto-sync to cloud after local save (debounced)
    const syncTimeout = setTimeout(() => {
      cloudSyncService.syncToCloud(data);
    }, 2000); // Wait 2 seconds after last change

    return () => clearTimeout(syncTimeout);
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
  const recordTransaction = (cartItems, payment_method = 'Cash', receiptData = null) => {
    // cartItems: [{ productId, quantity, total, ... }]
    // receiptData: { receiptId, items, subtotal, tax, discount, total, dateTime }

    // 1. Validate all items first
    cartItems.forEach(item => {
      const product = data.products.find(p => p.id === item.productId);
      if (!product) throw new Error(`Product not found: ${item.name}`);
      if (product.quantity < item.quantity) throw new Error(`Insufficient stock for ${product.name}`);
    });

    setData(prev => {
      let currentProducts = [...prev.products];
      // Ensure transactions array exists
      const prevTransactions = prev.transactions || [];
      
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

      const transactionId = Date.now().toString();
      const transactionDate = new Date().toISOString();

      const newTransaction = {
        id: transactionId,
        date: transactionDate,
        items: transactionItems,
        total_price: transactionTotal,
        profit: transactionProfit,
        quantity: totalQuantity, // Total items count
        payment_method
      };

      // Add to sales list (transactions list)
      const currentSales = [newTransaction, ...prev.sales];

      // Store full receipt data if provided
      let currentTransactions = [...prevTransactions];
      if (receiptData) {
        const fullReceipt = {
          id: transactionId,
          date: transactionDate,
          storeName: receiptData.storeName,
          receiptId: receiptData.receiptId || transactionId,
          paymentMethod: payment_method,
          items: receiptData.items || transactionItems.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            lineTotal: item.total
          })),
          subtotal: receiptData.subtotal || transactionTotal,
          tax: receiptData.tax || 0,
          discount: receiptData.discount || 0,
          total: receiptData.total || transactionTotal
        };
        currentTransactions = [fullReceipt, ...currentTransactions];
        console.log('[InventoryContext] Receipt stored in transactions:', fullReceipt);
        console.log('[InventoryContext] Total transactions now:', currentTransactions.length);
      } else {
        console.warn('[InventoryContext] No receiptData provided, receipt not stored in history');
      }

      return {
        ...prev,
        products: currentProducts,
        sales: currentSales,
        transactions: currentTransactions
      };
    });
  };

  const updateSettings = (newSettings) => {
    setData(prev => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings }
    }));
  };

  const assertNotGuest = (message = 'You must register your business or log in to continue.') => {
    if (isGuestMode) {
      throw new Error(message);
    }
  };

  const guardedAddProduct = (product) => {
    assertNotGuest();
    addProduct(product);
  };

  const guardedUpdateProduct = (id, updates) => {
    assertNotGuest();
    updateProduct(id, updates);
  };

  const guardedDeleteProduct = (id) => {
    assertNotGuest();
    deleteProduct(id);
  };

  const guardedRecordSale = (saleDetails) => {
    assertNotGuest();
    recordSale(saleDetails);
  };

  const guardedRecordTransaction = (cartItems, payment_method = 'Cash', receiptData = null) => {
    assertNotGuest();
    recordTransaction(cartItems, payment_method, receiptData);
  };

  const guardedUpdateSettings = (newSettings) => {
    assertNotGuest();
    updateSettings(newSettings);
  };

  const guardedVoidTransaction = (transactionId, reason = '') => {
    assertNotGuest();
    voidTransaction(transactionId, reason);
  };

  const guardedVoidLastTransaction = (reason = '') => {
    assertNotGuest();
    voidLastTransaction(reason);
  };

  // Selectors Helpers (using stockLogic for consistent filtering)
  const lowStockItems = stockLogic.getLowStockItems(data.products, data.settings.lowStockThreshold);

  // Void a specific transaction by id (audit-safe: marks as voided, restores stock)
  const voidTransaction = (transactionId, reason = '') => {
    const trimmedReason = String(reason || '').trim();
    if (!trimmedReason) return;
    setData(prev => {
      const salesIndex = prev.sales.findIndex(s => s.id === transactionId);
      if (salesIndex === -1) return prev;

      const sale = prev.sales[salesIndex];
      if (sale.voided || sale.isVoided) return prev; // already voided

      const voidedAt = new Date().toISOString();

      let updatedProducts = [...prev.products];
      // Restore stock for each item in the transaction
      (sale.items || []).forEach(item => {
        const productId = item.productId || item.product_id;
        const qty = parseInt(item.quantity, 10) || 0;
        updatedProducts = stockLogic.increaseStock(updatedProducts, productId, qty);
      });

      const updatedSales = [...prev.sales];
      updatedSales[salesIndex] = {
        ...sale,
        voided: true,
        isVoided: true,
        voidReason: trimmedReason,
        voidedAt,
        voidDate: voidedAt
      };

      // Mark matching receipt voided (keep record)
      let updatedTransactions = prev.transactions || [];
      const txIndex = updatedTransactions.findIndex(r => r.id === transactionId || r.receiptId === transactionId);
      if (txIndex !== -1) {
        const r = updatedTransactions[txIndex];
        if (!(r.voided || r.isVoided)) {
          updatedTransactions = [...updatedTransactions];
          updatedTransactions[txIndex] = {
            ...r,
            voided: true,
            isVoided: true,
            voidReason: trimmedReason,
            voidedAt,
            voidDate: voidedAt
          };
        }
      }

      return {
        ...prev,
        products: updatedProducts,
        sales: updatedSales,
        transactions: updatedTransactions
      };
    });
  };

  // Undo the most recent non-voided transaction
  const voidLastTransaction = (reason = '') => {
    const trimmedReason = String(reason || '').trim();
    if (!trimmedReason) return;
    setData(prev => {
      const latest = prev.sales.find(s => !s.voided);
      if (!latest) return prev;

      if (latest.voided || latest.isVoided) return prev;

      const voidedAt = new Date().toISOString();

      let updatedProducts = [...prev.products];
      (latest.items || []).forEach(item => {
        const productId = item.productId || item.product_id;
        const qty = parseInt(item.quantity, 10) || 0;
        updatedProducts = stockLogic.increaseStock(updatedProducts, productId, qty);
      });

      const updatedSales = prev.sales.map(s => s.id === latest.id ? ({
        ...s,
        voided: true,
        isVoided: true,
        voidReason: trimmedReason,
        voidedAt,
        voidDate: voidedAt
      }) : s);

      let updatedTransactions = prev.transactions || [];
      const txIndex = updatedTransactions.findIndex(r => r.id === latest.id || r.receiptId === latest.id);
      if (txIndex !== -1) {
        const r = updatedTransactions[txIndex];
        if (!(r.voided || r.isVoided)) {
          updatedTransactions = [...updatedTransactions];
          updatedTransactions[txIndex] = {
            ...r,
            voided: true,
            isVoided: true,
            voidReason: trimmedReason,
            voidedAt,
            voidDate: voidedAt
          };
        }
      }

      return {
        ...prev,
        products: updatedProducts,
        sales: updatedSales,
        transactions: updatedTransactions
      };
    });
  };

  // Cloud sync functions
  const syncToCloud = async () => {
    return await cloudSyncService.syncToCloud(data);
  };

  const syncFromCloud = async () => {
    const result = await cloudSyncService.syncFromCloud();
    if (result.success && result.data) {
      setData(result.data);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(result.data));
    }
    return result;
  };

  const getLastSyncTime = () => {
    return cloudSyncService.getLastSyncTime();
  };

  const getConnectionStatus = () => {
    return cloudSyncService.getConnectionStatus();
  };

  const exposedProducts = useMemo(() => {
    if (!isCashierMode) return data.products;
    return (data.products || []).map(({ cost_price, ...rest }) => rest);
  }, [data.products, isCashierMode]);

  const exposedSales = useMemo(() => {
    if (!isCashierMode) return data.sales;
    return (data.sales || []).map((s) => {
      const { profit, ...saleRest } = s || {};
      if (!saleRest.items) return saleRest;
      return {
        ...saleRest,
        items: (saleRest.items || []).map((item) => {
          const { profit: itemProfit, cost, ...itemRest } = item || {};
          return itemRest;
        })
      };
    });
  }, [data.sales, isCashierMode]);

  const exposedTransactions = useMemo(() => {
    if (!isCashierMode) return data.transactions;
    return (data.transactions || []).map((t) => {
      const { profit, ...txRest } = t || {};
      if (!txRest.items) return txRest;
      return {
        ...txRest,
        items: (txRest.items || []).map((item) => {
          const { profit: itemProfit, cost, ...itemRest } = item || {};
          return itemRest;
        })
      };
    });
  }, [data.transactions, isCashierMode]);

  const value = {
    products: exposedProducts,
    sales: exposedSales,
    transactions: exposedTransactions,
    settings: data.settings,
    addProduct: guardedAddProduct,
    updateProduct: guardedUpdateProduct,
    deleteProduct: guardedDeleteProduct,
    recordSale: guardedRecordSale,
    recordTransaction: guardedRecordTransaction,
    updateSettings: guardedUpdateSettings,
    lowStockItems,
    voidTransaction: guardedVoidTransaction,
    voidLastTransaction: guardedVoidLastTransaction,
    syncToCloud,
    syncFromCloud,
    getLastSyncTime,
    getConnectionStatus
  };

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
};
