import React, { useState, useEffect } from 'react';
import { RoleContext, useRole, ROLE_STORAGE_KEY, ROLES, SCREEN_PERMISSIONS } from './roleUtils';

export { useRole };

export const RoleProvider = ({ children }) => {
    const [userRole, setUserRole] = useState(() => {
        const saved = localStorage.getItem(ROLE_STORAGE_KEY);
        return saved || ROLES.ADMIN; // Default to admin for first time users
    });

    useEffect(() => {
        localStorage.setItem(ROLE_STORAGE_KEY, userRole);
    }, [userRole]);

    const changeRole = (newRole) => {
        if (Object.values(ROLES).includes(newRole)) {
            setUserRole(newRole);
        }
    };

    const hasAccess = (screen) => {
        const allowedRoles = SCREEN_PERMISSIONS[screen] || [];
        return allowedRoles.includes(userRole);
    };

    const isAdmin = () => userRole === ROLES.ADMIN;
    const isCashier = () => userRole === ROLES.CASHIER;

    return (
        <RoleContext.Provider value={{ 
            userRole, 
            changeRole, 
            hasAccess, 
            isAdmin, 
            isCashier,
            ROLES 
        }}>
            {children}
        </RoleContext.Provider>
    );
};
