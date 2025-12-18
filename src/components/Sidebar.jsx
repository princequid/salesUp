import React from 'react';
import { useRole } from '../logic/roleUtils';
import { useInventory } from '../logic/InventoryContext';
import { useStore } from '../logic/storeContextImpl';
import { useAuth } from '../logic/AuthContext';
import {
  LayoutDashboard,
  ShoppingCart,
  BarChart3,
  ReceiptText,
  Package,
  PlusSquare,
  AlertTriangle,
  Settings as SettingsIcon,
  TrendingUp,
  LogIn,
  LogOut,
} from 'lucide-react';

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', desc: 'Overview & performance', Icon: LayoutDashboard },
  { key: 'recordSale', label: 'POS', desc: 'Sell products', Icon: ShoppingCart },
  { key: 'reports', label: 'Reports', desc: 'Sales analytics', Icon: BarChart3 },
  { key: 'receiptHistory', label: 'Receipts', desc: 'Transaction history', Icon: ReceiptText },
  { key: 'productList', label: 'Products', desc: 'Manage inventory', Icon: Package },
  { key: 'addProduct', label: 'Add Product', desc: 'Create new items', Icon: PlusSquare },
  { key: 'lowStock', label: 'Low Stock', desc: 'Items running out', Icon: AlertTriangle },
  { key: 'settings', label: 'Settings', desc: 'App preferences', Icon: SettingsIcon },
];

const Sidebar = ({ currentScreen, onNavigate, isMobileOpen, onClose }) => {
  const { hasAccess, userRole, changeRole, ROLES } = useRole();
  const { settings } = useInventory();
  const { activeStore } = useStore();
  const { openAuthPrompt, logout, isAuthenticated } = useAuth();

  const items = NAV_ITEMS.filter((item) => hasAccess(item.key));

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

  const storeName = String(activeStore?.name || '').trim();

  const handleSwitchToAdmin = async () => {
    const adminHash = (settings && settings.adminSwitchPasswordHash) ? settings.adminSwitchPasswordHash : '';
    if (!adminHash) {
      alert('Admin mode is locked. Ask an Admin to set a password in Settings > Admin Access.');
      return;
    }

    const password = window.prompt('Enter Admin password');
    if (password == null) return;

    try {
      const enteredHash = await hashPassword(password);
      if (enteredHash !== adminHash) {
        alert('Incorrect password.');
        return;
      }

      changeRole(ROLES.ADMIN);
      try {
        localStorage.setItem('salesUp_session_v1', JSON.stringify({ isAuthenticated: true, role: ROLES.ADMIN, businessId: activeStore?.id || '', cashierId: '' }));
      } catch {
        // ignore
      }
      onNavigate('dashboard');
      if (isMobileOpen) onClose();
    } catch (err) {
      alert(err?.message || 'Failed to verify password.');
    }
  };

  return (
    <>
      {/* Overlay for mobile drawer */}
      <div
        className="sidebar-overlay"
        style={{ display: isMobileOpen ? 'block' : 'none' }}
        onClick={onClose}
        aria-hidden={!isMobileOpen}
      />

      <nav className={`app-sidebar ${isMobileOpen ? 'open' : ''}`} aria-label="Primary Navigation">
        <div className="sidebar-header">
          <div className="brand" aria-label="SalesUP">
            <span className="brand-icon" aria-hidden="true"><TrendingUp size={18} strokeWidth={2.25} /></span>
            <span className="brand-name">
              <span className="brand-sales">Sales</span>
              <span className="brand-up">UP</span>
            </span>
            {activeStore?.logoBase64 && (
              <img
                src={activeStore.logoBase64}
                alt={activeStore.name || 'Business logo'}
                className="brand-business-logo-img"
              />
            )}
          </div>
          {!!storeName && (
            <div className="sidebar-store-name">{storeName}</div>
          )}
        </div>
        <div className="sidebar-list" role="list">
          {items.map((item) => {
            const isActive = currentScreen === item.key;
            const Icon = item.Icon;
            return (
              <button
                key={item.key}
                role="listitem"
                className={`sidebar-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  onNavigate(item.key);
                  if (isMobileOpen) onClose();
                }}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="sidebar-icon" aria-hidden="true">
                  <Icon size={18} strokeWidth={2} />
                </span>
                <span className="sidebar-text">
                  <span className="sidebar-title">{item.label}</span>
                  <span className="sidebar-desc">{item.desc}</span>
                </span>
              </button>
            );
          })}

          {userRole === ROLES.CASHIER && (
            <button
              role="listitem"
              className="sidebar-item"
              onClick={handleSwitchToAdmin}
            >
              <span className="sidebar-icon" aria-hidden="true">
                <LayoutDashboard size={18} strokeWidth={2} />
              </span>
              <span className="sidebar-text">
                <span className="sidebar-title">Admin Mode</span>
                <span className="sidebar-desc">Switch to admin features</span>
              </span>
            </button>
          )}

          <div style={{ marginTop: 'auto' }} />

          <div style={{ paddingTop: 'var(--spacing-sm)', borderTop: '1px solid var(--border-color)' }}>
            {userRole === ROLES.GUEST || !isAuthenticated ? (
              <button
                role="listitem"
                className="sidebar-item"
                onClick={() => {
                  openAuthPrompt('You must register your business or log in to continue.');
                  if (isMobileOpen) onClose();
                }}
              >
                <span className="sidebar-icon" aria-hidden="true">
                  <LogIn size={18} strokeWidth={2} />
                </span>
                <span className="sidebar-text">
                  <span className="sidebar-title">Register / Login</span>
                  <span className="sidebar-desc">Unlock actions</span>
                </span>
              </button>
            ) : (
              <button
                role="listitem"
                className="sidebar-item"
                onClick={() => {
                  logout();
                  onNavigate('dashboard');
                  if (isMobileOpen) onClose();
                }}
              >
                <span className="sidebar-icon" aria-hidden="true">
                  <LogOut size={18} strokeWidth={2} />
                </span>
                <span className="sidebar-text">
                  <span className="sidebar-title">Logout</span>
                  <span className="sidebar-desc">Return to view-only mode</span>
                </span>
              </button>
            )}
          </div>
        </div>
      </nav>
    </>
  );
};

export default Sidebar;
