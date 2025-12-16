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
