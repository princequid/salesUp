import React, { useState, useEffect } from 'react';
import { InventoryProvider } from './logic/InventoryContext';
import { CurrencyProvider } from './logic/CurrencyContext';
import { RoleProvider } from './logic/RoleContext';
import { ThemeProvider } from './logic/ThemeContext';
import { StoreProvider } from './logic/StoreContext';
import { AuthProvider } from './logic/AuthContext';
import { useRole } from './logic/roleUtils';
import { useStore } from './logic/storeContextImpl';
import Dashboard from './screens/dashboardScreen/Dashboard';
import AddProduct from './screens/addProductScreen/AddProduct';
import ProductList from './screens/productListScreen/ProductList';
import RecordSale from './screens/recordSaleScreen/RecordSale';
import Reports from './screens/reportsScreen/Reports';
import LowStock from './screens/lowStockScreen/LowStock';
import Settings from './screens/settingsScreen/Settings';
import ReceiptHistory from './screens/receiptHistoryScreen/ReceiptHistory';
import SyncIndicator from './components/SyncIndicator';
import Sidebar from './components/Sidebar';
import './styles/index.css';

// Simple hamburger icon
const HamburgerIcon = ({ size = 28, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 28 28"
    aria-hidden="true"
    focusable="false"
    style={{ display: 'block' }}
  >
    <rect x="4" y="6" width="20" height="3.2" rx="1.6" fill={color} />
    <rect x="4" y="12.4" width="20" height="3.2" rx="1.6" fill={color} />
    <rect x="4" y="18.8" width="20" height="3.2" rx="1.6" fill={color} />
  </svg>
);

function App() {
  return (
    <ThemeProvider>
      <StoreProvider>
        <RoleProvider>
          <CurrencyProvider>
            <InventoryProvider>
              <AuthProvider>
                <AppContent />
              </AuthProvider>
            </InventoryProvider>
          </CurrencyProvider>
        </RoleProvider>
      </StoreProvider>
    </ThemeProvider>
  );
}

function AppContent() {
  const { hasAccess, isCashier, userRole, ROLES } = useRole();
  const { activeStore } = useStore();
  const storeName = String(activeStore?.name || '').trim();
  const [currentScreen, setCurrentScreen] = useState(() =>
    isCashier() ? 'recordSale' : 'dashboard'
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!hasAccess(currentScreen)) {
      setCurrentScreen(isCashier() ? 'recordSale' : 'dashboard');
    }
  }, [currentScreen, hasAccess, isCashier]);

  useEffect(() => {
    if (userRole === ROLES.CASHIER) {
      setCurrentScreen('recordSale');
    }
    if (userRole === ROLES.ADMIN) {
      setCurrentScreen('dashboard');
    }
  }, [userRole, ROLES.CASHIER, ROLES.ADMIN]);

  const handleNavigate = (screen) => {
    if (hasAccess(screen)) {
      setCurrentScreen(screen);
      setSidebarOpen(false);
    } else {
      alert('Access denied. You do not have permission to access this screen.');
    }
  };

  const renderScreen = () => (
    <div key={currentScreen} className="animate-fade-in">
      {(() => {
        switch (currentScreen) {
          case 'dashboard':
            return <Dashboard onNavigate={handleNavigate} />;
          case 'addProduct':
            return <AddProduct onNavigate={handleNavigate} />;
          case 'productList':
            return <ProductList onNavigate={handleNavigate} />;
          case 'recordSale':
            return <RecordSale onNavigate={handleNavigate} />;
          case 'reports':
            return <Reports onNavigate={handleNavigate} />;
          case 'lowStock':
            return <LowStock onNavigate={handleNavigate} />;
          case 'settings':
            return <Settings onNavigate={handleNavigate} />;
          case 'receiptHistory':
            return <ReceiptHistory onNavigate={handleNavigate} />;
          default:
            return (
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <h2>{currentScreen} Screen</h2>
                <p>Under Construction</p>
                <button
                  className="btn btn-primary"
                  onClick={() => handleNavigate('dashboard')}
                  style={{ marginTop: '1rem' }}
                >
                  Back to Dashboard
                </button>
              </div>
            );
        }
      })()}
    </div>
  );

  return (
    <div className="app-shell">
      <header className="app-topbar">
        <button
          className="hamburger-btn"
          aria-label="Open navigation"
          onClick={() => setSidebarOpen(true)}
        >
          <HamburgerIcon size={28} />
        </button>
        <div className="topbar-brand" aria-label="SalesUP">
          <span className="brand-icon-mini" aria-hidden="true">▲</span>
          <span className="topbar-name">
            <span className="topbar-sales">Sales</span>
            <span className="topbar-up">UP</span>
          </span>
          {!!storeName && (
            <span className="topbar-store-name">{storeName}</span>
          )}
          {activeStore?.logoBase64 && (
            <img
              src={activeStore.logoBase64}
              alt={activeStore.name || 'Business logo'}
              className="topbar-business-logo-img"
            />
          )}
        </div>
        <div className="topbar-spacer" />
      </header>

      <Sidebar
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        isMobileOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="app-content">
        {renderScreen()}
        <SyncIndicator />
      </main>
    </div>
  );
}

export default App;