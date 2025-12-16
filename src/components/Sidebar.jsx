import React from 'react';
import { useRole } from '../logic/roleUtils';
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
  const { hasAccess } = useRole();

  const items = NAV_ITEMS.filter((item) => hasAccess(item.key));

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
          </div>
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
        </div>
      </nav>
    </>
  );
};

export default Sidebar;
