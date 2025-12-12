import React, { useState } from 'react';
import { InventoryProvider } from './logic/InventoryContext';
import Dashboard from './screens/dashboardScreen/Dashboard';
import AddProduct from './screens/addProductScreen/AddProduct';
import ProductList from './screens/productListScreen/ProductList';
import RecordSale from './screens/recordSaleScreen/RecordSale';
import Reports from './screens/reportsScreen/Reports';
import LowStock from './screens/lowStockScreen/LowStock';
import Settings from './screens/settingsScreen/Settings';
import './styles/index.css';

import BottomNav from './components/BottomNav';

function App() {
  const [currentScreen, setCurrentScreen] = useState('dashboard');

  const renderScreen = () => {
    // Wrap content with animation key to trigger re-render animation
    // Using a key makes React unmount/remount on screen change, firing the animation
    return (
      <div key={currentScreen} className="animate-fade-in">
        {(() => {
          switch (currentScreen) {
            case 'dashboard':
              return <Dashboard onNavigate={setCurrentScreen} />;
            case 'addProduct':
              return <AddProduct onNavigate={setCurrentScreen} />;
            case 'productList':
              return <ProductList onNavigate={setCurrentScreen} />;
            case 'recordSale':
              return <RecordSale onNavigate={setCurrentScreen} />;
            case 'reports':
              return <Reports onNavigate={setCurrentScreen} />;
            case 'lowStock':
              return <LowStock onNavigate={setCurrentScreen} />;
            case 'settings':
              return <Settings onNavigate={setCurrentScreen} />;
            default:
              return (
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                  <h2>{currentScreen} Screen</h2>
                  <p>Under Construction</p>
                  <button className="btn btn-primary" onClick={() => setCurrentScreen('dashboard')} style={{ marginTop: '1rem' }}>Back to Dashboard</button>
                </div>
              );
          }
        })()}
      </div>
    );
  };

  return (
    <InventoryProvider>
      {renderScreen()}
      {/* Show Bottom Nav on all screens for quick access, or conditionally if desired. 
          User requested for "quick access to core screens", implies always visible or mostly.
          Let's keep it visible everywhere for now, similar to mobile apps. 
      */}
      <BottomNav currentScreen={currentScreen} onNavigate={setCurrentScreen} />
    </InventoryProvider>
  );
}

export default App;
