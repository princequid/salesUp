import React, { useEffect, useMemo, useState } from 'react';
import { ThemeContext } from './themeContextImpl';

const THEME_STORAGE_KEY = 'salesUp_theme';

const resolveSystemTheme = () => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved) {
        const code = String(saved).trim().toLowerCase();
        if (code === 'light' || code === 'dark' || code === 'system') return code;
      }
    } catch {
      // ignore
    }
    return 'system';
  });

  const effectiveTheme = useMemo(() => {
    return theme === 'system' ? resolveSystemTheme() : theme;
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(effectiveTheme);
  }, [effectiveTheme]);

  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(resolveSystemTheme());
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, currentTheme: theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
