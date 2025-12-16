import { useMemo } from 'react';
import { useCurrency } from './CurrencyContext';

export const parseAmountSafe = (value) => {
  const n = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
};

export const formatMoneyWithCode = (value, code, locale = 'en-US') => {
  try {
    const n = parseAmountSafe(value);
    return new Intl.NumberFormat(locale, { style: 'currency', currency: code }).format(n);
  } catch {
    const n = parseAmountSafe(value);
    return n.toFixed(2);
  }
};

export const useMoneyFormatter = (locale = 'en-US') => {
  const { currency } = useCurrency();
  const formatter = useMemo(() => {
    try {
      return new Intl.NumberFormat(locale, { style: 'currency', currency: currency.code });
    } catch {
      return new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
  }, [currency.code, locale]);

  return (value) => {
    const n = parseAmountSafe(value);
    return formatter.format(n);
  };
};
