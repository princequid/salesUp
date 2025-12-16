/* eslint react-refresh/only-export-components: off */
import React, { useState, useEffect } from 'react';
import { CurrencyContext } from './currencyContextImpl';

const CURRENCY_STORAGE_KEY = 'salesUp_currency';

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
// Re-export hook for consumers importing from this module
export { useCurrency } from './currencyContextImpl';
