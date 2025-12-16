import { createContext, useContext } from 'react';

export const RoleContext = createContext();

export const useRole = () => {
    const context = useContext(RoleContext);
    if (!context) {
        throw new Error('useRole must be used within a RoleProvider');
    }
    return context;
};

export const ROLE_STORAGE_KEY = 'salesUp_user_role';

export const ROLES = {
    ADMIN: 'admin',
    CASHIER: 'cashier'
};

export const SCREEN_PERMISSIONS = {
    dashboard: [ROLES.ADMIN, ROLES.CASHIER],
    recordSale: [ROLES.ADMIN, ROLES.CASHIER],
    receiptHistory: [ROLES.ADMIN, ROLES.CASHIER],
    productList: [ROLES.ADMIN],
    addProduct: [ROLES.ADMIN],
    lowStock: [ROLES.ADMIN],
    reports: [ROLES.ADMIN],
    settings: [ROLES.ADMIN]
};

// Centralized action-level permissions
// Do not change role definitions; map actions to roles here
export const ACTION_PERMISSIONS = {
    // POS actions
    'pos.checkout': [ROLES.ADMIN, ROLES.CASHIER],
    'pos.discount': [ROLES.ADMIN],
    'pos.scan': [ROLES.ADMIN, ROLES.CASHIER],
    'sales.void': [ROLES.ADMIN],

    // Inventory CRUD
    'inventory.create': [ROLES.ADMIN],
    'inventory.import': [ROLES.ADMIN],
    'inventory.update': [ROLES.ADMIN],
    'inventory.delete': [ROLES.ADMIN],

    // Reports
    'reports.export': [ROLES.ADMIN],

    // Settings
    'settings.save': [ROLES.ADMIN],
    'settings.updateCurrency': [ROLES.ADMIN],

    // Stores & Users
    'stores.manage': [ROLES.ADMIN],
    'users.manage': [ROLES.ADMIN]
};
