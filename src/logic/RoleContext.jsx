import React, { useState, useEffect } from 'react';
import { RoleContext, ROLE_STORAGE_KEY, ROLES, SCREEN_PERMISSIONS, ACTION_PERMISSIONS } from './roleUtils';

export const RoleProvider = ({ children }) => {
    const [userRole, setUserRole] = useState(() => {
        try {
            const sessionRaw = localStorage.getItem('salesUp_session_v1');
            if (sessionRaw) {
                const session = JSON.parse(sessionRaw);
                const role = session?.role;
                const ok = session?.isAuthenticated === true && (role === ROLES.ADMIN || role === ROLES.CASHIER);
                if (ok) return role;
            }
        } catch {
            // ignore
        }

        return ROLES.GUEST;
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

    const can = (action) => {
        const allowedRoles = ACTION_PERMISSIONS[action] || [];
        return allowedRoles.includes(userRole);
    };

    const isAdmin = () => userRole === ROLES.ADMIN;
    const isCashier = () => userRole === ROLES.CASHIER;

    return (
        <RoleContext.Provider value={{ 
            userRole, 
            changeRole, 
            hasAccess,
            can,
            isAdmin, 
            isCashier,
            ROLES 
        }}>
            {children}
        </RoleContext.Provider>
    );
};
