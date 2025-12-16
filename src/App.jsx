import React, { useState, useEffect } from 'react';
import { InventoryProvider } from './logic/InventoryContext';
import { CurrencyProvider } from './logic/CurrencyContext';
import { RoleProvider, useRole } from './logic/RoleContext';
import { ThemeProvider } from './logic/ThemeContext';
import { StoreProvider } from './logic/StoreContext';
import Dashboard from './screens/dashboardScreen/Dashboard';
import AddProduct from './screens/addProductScreen/AddProduct';
import ProductList from './screens/productListScreen/ProductList';
import RecordSale from './screens/recordSaleScreen/RecordSale';
import Reports from './screens/reportsScreen/Reports';
import LowStock from './screens/lowStockScreen/LowStock';
import Settings from './screens/settingsScreen/Settings';
import ReceiptHistory from './screens/receiptHistoryScreen/ReceiptHistory';
import SyncIndicator from './components/SyncIndicator';
import './styles/index.css';

import BottomNav from './components/BottomNav';

function App() {
  return (
    <ThemeProvider>
      <StoreProvider>
        <RoleProvider>
          <CurrencyProvider>
            <InventoryProvider>
              <AppContent />
            </InventoryProvider>
          </CurrencyProvider>
        </RoleProvider>
      </StoreProvider>
    </ThemeProvider>
  );
}

function AppContent() {
  const { hasAccess, isCashier } = useRole();
  const [currentScreen, setCurrentScreen] = useState(() => {
    // Cashiers start at POS, Admins at dashboard
    return isCashier() ? 'recordSale' : 'dashboard';
  });

  // Redirect if user tries to access unauthorized screen
  useEffect(() => {
    if (!hasAccess(currentScreen)) {
      setCurrentScreen(isCashier() ? 'recordSale' : 'dashboard');
    }
  }, [currentScreen, hasAccess, isCashier]);

  const handleNavigate = (screen) => {
    // Check access before navigation
    if (hasAccess(screen)) {
      setCurrentScreen(screen);
    } else {
      alert('Access denied. You do not have permission to access this screen.');
    }
  };

  const renderScreen = () => {
    // Wrap content with animation key to trigger re-render animation
    // Using a key makes React unmount/remount on screen change, firing the animation
    return (
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
                  <button className="btn btn-primary" onClick={() => handleNavigate('dashboard')} style={{ marginTop: '1rem' }}>Back to Dashboard</button>
                </div>
              );
          }
        })()}
      </div>
    );
  };

  return (
    <>
      {renderScreen()}
      {/* Show Bottom Nav on all screens for quick access, or conditionally if desired. 
          User requested for "quick access to core screens", implies always visible or mostly.
          Let's keep it visible everywhere for now, similar to mobile apps. 
      */}
      <BottomNav currentScreen={currentScreen} onNavigate={handleNavigate} />
      <SyncIndicator />
    </>
  );
}

export default App;
