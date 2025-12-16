import { createContext, useContext } from 'react';

export const CurrencyContext = createContext();

export const useCurrency = () => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within a CurrencyProvider');
  return ctx;
};
