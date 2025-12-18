import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthContext } from './authContextImpl';
import { useRole } from './roleUtils';
import { useStore } from './storeContextImpl';
import { useInventory } from './InventoryContext';
import AuthPromptModal from '../components/AuthPromptModal';

const SESSION_STORAGE_KEY = 'salesUp_session_v1';
const CASHIERS_STORAGE_PREFIX = 'salesUp_cashiers_v1_';

const hashPassword = async (password) => {
  if (!window.crypto?.subtle) {
    throw new Error('Password verification is not supported in this browser.');
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(String(password));
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

export const AuthProvider = ({ children }) => {
  const { userRole, changeRole, ROLES } = useRole();
  const { stores, activeStore, activeStoreId, switchStore, updateStore } = useStore();
  const { settings, updateSettings } = useInventory();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionCashierId, setSessionCashierId] = useState('');
  const [authPrompt, setAuthPrompt] = useState({ isOpen: false, reason: '' });
  const [pendingPostRegisterLogin, setPendingPostRegisterLogin] = useState(false);

  const hasBusinessRegistered = useMemo(() => {
    if (!activeStore) return false;
    if (typeof activeStore.isRegistered === 'boolean') return activeStore.isRegistered;
    const n = String(activeStore.name || '').trim();
    return !!n && n !== 'My Shop';
  }, [activeStore]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const role = parsed?.role;
      const ok = parsed?.isAuthenticated === true && (role === ROLES.ADMIN || role === ROLES.CASHIER);
      if (!ok) return;

      const parsedCashierId = String(parsed?.cashierId || '').trim();
      setSessionCashierId(role === ROLES.CASHIER ? parsedCashierId : '');

      const sessionBusinessId = String(parsed?.businessId || '').trim();
      if (sessionBusinessId && sessionBusinessId !== activeStoreId) {
        const exists = (stores || []).some((s) => s?.id === sessionBusinessId);
        if (exists) {
          switchStore(sessionBusinessId);
          return;
        }
        localStorage.removeItem(SESSION_STORAGE_KEY);
        return;
      }

      setIsAuthenticated(true);
      changeRole(role);
    } catch {
      // ignore
    }
  }, [changeRole, ROLES.ADMIN, ROLES.CASHIER, activeStoreId, stores, switchStore]);

  useEffect(() => {
    if (userRole === ROLES.GUEST) {
      setIsAuthenticated(false);
      try {
        localStorage.removeItem(SESSION_STORAGE_KEY);
      } catch {
        // ignore
      }
    }
  }, [userRole, ROLES.GUEST]);

  const openAuthPrompt = useCallback((reason = '') => {
    setAuthPrompt({ isOpen: true, reason: String(reason || '') });
  }, []);

  const closeAuthPrompt = useCallback(() => {
    setAuthPrompt({ isOpen: false, reason: '' });
  }, []);

  const requireAuth = useCallback((reason = '') => {
    if (isAuthenticated && userRole !== ROLES.GUEST) return true;
    openAuthPrompt(reason);
    return false;
  }, [isAuthenticated, userRole, ROLES.GUEST, openAuthPrompt]);

  const registerBusiness = useCallback(async ({ businessName, adminPassword, adminPasswordConfirm }) => {
    const name = String(businessName || '').trim();
    const p1 = String(adminPassword || '');
    const p2 = String(adminPasswordConfirm || '');

    if (!name) throw new Error('Business name is required');
    if (!activeStore?.id) throw new Error('No active store found');
    if (!p1 || p1.length < 4) throw new Error('Admin password must be at least 4 characters');
    if (p1 !== p2) throw new Error('Passwords do not match');

    const hash = await hashPassword(p1);

    updateStore(activeStore.id, { name, isRegistered: true });
    updateSettings({ adminSwitchPasswordHash: hash, businessName: name });

    setPendingPostRegisterLogin(true);
    changeRole(ROLES.GUEST);
    setIsAuthenticated(false);
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // ignore
    }

    openAuthPrompt('Business registered. Please log in to continue.');
  }, [activeStore, updateStore, updateSettings, changeRole, ROLES.GUEST, openAuthPrompt]);

  const isStoreRegistered = useCallback((store) => {
    if (!store) return false;
    if (typeof store.isRegistered === 'boolean') return store.isRegistered;
    const n = String(store.name || '').trim();
    return !!n && n !== 'My Shop';
  }, []);

  const getCashiersKey = useCallback((storeId) => {
    return `${CASHIERS_STORAGE_PREFIX}${storeId}`;
  }, []);

  const readCashiers = useCallback((storeId) => {
    try {
      const raw = localStorage.getItem(getCashiersKey(storeId));
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [getCashiersKey]);

  const writeCashiers = useCallback((storeId, cashiers) => {
    localStorage.setItem(getCashiersKey(storeId), JSON.stringify(cashiers || []));
  }, [getCashiersKey]);

  const listCashiers = useCallback(() => {
    if (!activeStore?.id) return [];
    return readCashiers(activeStore.id);
  }, [activeStore, readCashiers]);

  const createCashier = useCallback(async ({ username, password, passwordConfirm }) => {
    if (userRole !== ROLES.ADMIN || !isAuthenticated) {
      throw new Error('Only Admins can manage cashier accounts.');
    }
    if (!activeStore?.id) throw new Error('No active business found.');

    const uRaw = String(username || '').trim();
    const u = uRaw.toLowerCase();
    const p1 = String(password || '');
    const p2 = String(passwordConfirm || '');

    if (!uRaw) throw new Error('Cashier username is required');
    if (!p1 || p1.length < 4) throw new Error('Password must be at least 4 characters');
    if (p1 !== p2) throw new Error('Passwords do not match');

    const existing = readCashiers(activeStore.id);
    const taken = existing.some((c) => String(c?.username || '').toLowerCase() === u);
    if (taken) throw new Error('A cashier with this username already exists');

    const passwordHash = await hashPassword(p1);
    const now = new Date().toISOString();
    const cashier = {
      id: `cashier_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      username: uRaw,
      usernameNormalized: u,
      passwordHash,
      isActive: true,
      createdAt: now,
      updatedAt: now
    };

    writeCashiers(activeStore.id, [...existing, cashier]);
    return cashier;
  }, [activeStore, isAuthenticated, readCashiers, userRole, writeCashiers, ROLES.ADMIN]);

  const setCashierActive = useCallback(async ({ cashierId, isActive }) => {
    if (userRole !== ROLES.ADMIN || !isAuthenticated) {
      throw new Error('Only Admins can manage cashier accounts.');
    }
    if (!activeStore?.id) throw new Error('No active business found.');

    const existing = readCashiers(activeStore.id);
    const next = existing.map((c) => {
      if (c?.id !== cashierId) return c;
      return {
        ...c,
        isActive: !!isActive,
        updatedAt: new Date().toISOString()
      };
    });
    writeCashiers(activeStore.id, next);
  }, [activeStore, isAuthenticated, readCashiers, userRole, writeCashiers, ROLES.ADMIN]);

  const resetCashierPassword = useCallback(async ({ cashierId, newPassword, newPasswordConfirm }) => {
    if (userRole !== ROLES.ADMIN || !isAuthenticated) {
      throw new Error('Only Admins can manage cashier accounts.');
    }
    if (!activeStore?.id) throw new Error('No active business found.');

    const p1 = String(newPassword || '');
    const p2 = String(newPasswordConfirm || '');
    if (!p1 || p1.length < 4) throw new Error('Password must be at least 4 characters');
    if (p1 !== p2) throw new Error('Passwords do not match');

    const passwordHash = await hashPassword(p1);
    const existing = readCashiers(activeStore.id);
    const next = existing.map((c) => {
      if (c?.id !== cashierId) return c;
      return {
        ...c,
        passwordHash,
        updatedAt: new Date().toISOString()
      };
    });
    writeCashiers(activeStore.id, next);
  }, [activeStore, isAuthenticated, readCashiers, userRole, writeCashiers, ROLES.ADMIN]);

  const loginCashier = useCallback(async ({ username, password }) => {
    const u = String(username || '').trim().toLowerCase();
    const p = String(password || '');
    if (!u) throw new Error('Username is required');
    if (!p) throw new Error('Password is required');

    const enteredHash = await hashPassword(p);

    const candidates = (stores || []).map((store) => {
      const storeId = String(store?.id || '').trim();
      if (!storeId) return null;
      const cashiers = readCashiers(storeId);
      const cashier = cashiers.find((c) => String(c?.usernameNormalized || '').toLowerCase() === u);
      if (!cashier) return null;
      if (cashier?.isActive === false) return null;
      if (String(cashier?.passwordHash || '').trim() !== enteredHash) return null;
      if (!isStoreRegistered(store)) return null;
      return { storeId, cashier };
    }).filter(Boolean);

    if (candidates.length === 0) throw new Error('Invalid cashier credentials');
    if (candidates.length > 1) {
      throw new Error('This cashier username exists in multiple businesses. Please use a unique cashier username.');
    }

    const { storeId, cashier } = candidates[0];

    setSessionCashierId(String(cashier?.id || '').trim());
    changeRole(ROLES.CASHIER);
    setIsAuthenticated(true);
    setPendingPostRegisterLogin(false);
    try {
      localStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({
          isAuthenticated: true,
          role: ROLES.CASHIER,
          businessId: storeId,
          cashierId: cashier.id
        })
      );
    } catch {
      // ignore
    }

    if (storeId && storeId !== activeStoreId) {
      switchStore(storeId);
      return;
    }

    closeAuthPrompt();
  }, [stores, readCashiers, isStoreRegistered, changeRole, ROLES.CASHIER, closeAuthPrompt, activeStoreId, switchStore]);

  const loginAdmin = useCallback(async ({ password }) => {
    const adminHash = String(settings?.adminSwitchPasswordHash || '').trim();
    if (!adminHash) {
      throw new Error('Admin login is not set up yet. Register your business first.');
    }

    const p = String(password || '');
    if (!p) throw new Error('Password is required');

    const enteredHash = await hashPassword(p);
    if (enteredHash !== adminHash) throw new Error('Incorrect password');

    changeRole(ROLES.ADMIN);
    setIsAuthenticated(true);
    setSessionCashierId('');
    setPendingPostRegisterLogin(false);
    try {
      localStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({
          isAuthenticated: true,
          role: ROLES.ADMIN,
          businessId: activeStore?.id || ''
        })
      );
    } catch {
      // ignore
    }
    closeAuthPrompt();
  }, [settings, changeRole, ROLES.ADMIN, closeAuthPrompt, activeStore]);

  const logout = useCallback(() => {
    changeRole(ROLES.GUEST);
    setIsAuthenticated(false);
    setSessionCashierId('');
    setPendingPostRegisterLogin(false);
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // ignore
    }
  }, [changeRole, ROLES.GUEST]);

  const value = useMemo(() => {
    return {
      hasBusinessRegistered,
      isAuthenticated,
      role: userRole,
      businessId: isAuthenticated && userRole !== ROLES.GUEST ? activeStoreId : '',
      cashierId: isAuthenticated && userRole === ROLES.CASHIER ? sessionCashierId : '',
      openAuthPrompt,
      closeAuthPrompt,
      requireAuth,
      registerBusiness,
      listCashiers,
      createCashier,
      setCashierActive,
      resetCashierPassword,
      loginCashier,
      loginAdmin,
      logout,
      pendingPostRegisterLogin
    };
  }, [
    hasBusinessRegistered,
    isAuthenticated,
    userRole,
    activeStoreId,
    sessionCashierId,
    openAuthPrompt,
    closeAuthPrompt,
    requireAuth,
    registerBusiness,
    listCashiers,
    createCashier,
    setCashierActive,
    resetCashierPassword,
    loginCashier,
    loginAdmin,
    logout,
    pendingPostRegisterLogin
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
      <AuthPromptModal
        isOpen={authPrompt.isOpen}
        reason={authPrompt.reason}
        onClose={closeAuthPrompt}
        hasBusinessRegistered={hasBusinessRegistered}
        pendingPostRegisterLogin={pendingPostRegisterLogin}
        onRegister={registerBusiness}
        onLoginCashier={loginCashier}
        onLoginAdmin={loginAdmin}
      />
    </AuthContext.Provider>
  );
};

export { useAuth } from './authContextImpl';
