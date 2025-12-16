import React, { useState, useEffect } from 'react';
import { StoreContext } from './storeContextImpl';

const STORES_KEY = 'salesUp_stores';
const ACTIVE_STORE_KEY = 'salesUp_active_store';

const DEFAULT_STORE = {
    id: 'store_default',
    name: 'Main Store',
    location: '',
    createdAt: new Date().toISOString(),
    logoBase64: ''
};

export const StoreProvider = ({ children }) => {
    const [stores, setStores] = useState(() => {
        try {
            const saved = localStorage.getItem(STORES_KEY);
            if (saved) {
                return JSON.parse(saved);
            }
            return [DEFAULT_STORE];
        } catch (e) {
            console.error('Failed to load stores', e);
            return [DEFAULT_STORE];
        }
    });

    const [activeStoreId, setActiveStoreId] = useState(() => {
        const saved = localStorage.getItem(ACTIVE_STORE_KEY);
        return saved || DEFAULT_STORE.id;
    });

    useEffect(() => {
        localStorage.setItem(STORES_KEY, JSON.stringify(stores));
    }, [stores]);

    useEffect(() => {
        localStorage.setItem(ACTIVE_STORE_KEY, activeStoreId);
    }, [activeStoreId]);

    const activeStore = stores.find(s => s.id === activeStoreId) || stores[0];

    const addStore = (storeData) => {
        const newStore = {
            id: `store_${Date.now()}`,
            name: storeData.name || 'New Store',
            location: storeData.location || '',
            createdAt: new Date().toISOString(),
            logoBase64: ''
        };
        setStores(prev => [...prev, newStore]);
        return newStore;
    };

    const updateStore = (storeId, updates) => {
        setStores(prev => prev.map(store => 
            store.id === storeId ? { ...store, ...updates } : store
        ));
    };

    const deleteStore = (storeId) => {
        // Prevent deleting the last store
        if (stores.length <= 1) {
            throw new Error('Cannot delete the last store');
        }

        setStores(prev => prev.filter(s => s.id !== storeId));
        
        // If deleting active store, switch to first available
        if (activeStoreId === storeId) {
            const remainingStores = stores.filter(s => s.id !== storeId);
            setActiveStoreId(remainingStores[0].id);
        }

        // Delete store data from localStorage
        const storeDataKey = `salesUp_data_v1_${storeId}`;
        localStorage.removeItem(storeDataKey);
    };

    const switchStore = (storeId) => {
        const store = stores.find(s => s.id === storeId);
        if (store) {
            setActiveStoreId(storeId);
            console.log('[StoreContext] Switched to store:', store.name);
            // Trigger page reload to reinitialize InventoryContext with new store data
            window.location.reload();
        }
    };

    const setLogoForActiveStore = (base64) => {
        if (!activeStore) return;
        updateStore(activeStore.id, { logoBase64: base64 || '' });
    };

    const clearLogoForActiveStore = () => {
        if (!activeStore) return;
        updateStore(activeStore.id, { logoBase64: '' });
    };

    const value = {
        stores,
        activeStore,
        activeStoreId,
        addStore,
        updateStore,
        deleteStore,
        switchStore,
        setLogoForActiveStore,
        clearLogoForActiveStore
    };

    return (
        <StoreContext.Provider value={value}>
            {children}
        </StoreContext.Provider>
    );
};
