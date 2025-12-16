import React, { createContext, useContext, useState, useEffect } from 'react';

const CURRENCY_STORAGE_KEY = 'salesUp_currency';

export const CurrencyContext = createContext();

export const useCurrency = () => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within a CurrencyProvider');
  return ctx;
};

const DEFAULT_CURRENCY = {
  code: 'USD',
  symbol: '$'
};

const SYMBOLS = {
  USD: '$',
  GHS: '₵',
  EUR: '€',
  GBP: '£',
  NGN: '₦',
  JPY: '¥',
  INR: '₹'
};

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState(() => {
    try {
      const saved = localStorage.getItem(CURRENCY_STORAGE_KEY);
      if (saved) {
        const code = saved.trim().toUpperCase();
        return { code, symbol: SYMBOLS[code] || DEFAULT_CURRENCY.symbol };
      }
    } catch (e) {
      console.warn('Currency load failed', e);
    }
    return DEFAULT_CURRENCY;
  });

  useEffect(() => {
    localStorage.setItem(CURRENCY_STORAGE_KEY, currency.code);
  }, [currency]);

  const changeCurrency = (code) => {
    const normalized = String(code || '').trim().toUpperCase();
    const symbol = SYMBOLS[normalized] || DEFAULT_CURRENCY.symbol;
    setCurrency({ code: normalized, symbol });
  };

  return (
    <CurrencyContext.Provider value={{ currency, changeCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
};
