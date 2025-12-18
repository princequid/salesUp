import React from 'react';
import { useRole } from '../logic/roleUtils';
import ActionGuard from './ActionGuard';

// Gate by screen and/or action using centralized permission logic
const PermissionGate = ({ screen, action, fallback = null, children }) => {
    const { hasAccess, can, userRole, ROLES } = useRole();
    const screenAllowed = screen ? hasAccess(screen) : true;
    const actionAllowed = action ? can(action) : true;
    const allowed = screenAllowed && actionAllowed;

    if (allowed) return <>{children}</>;

    if (action && userRole === ROLES.GUEST) {
        return (
            <ActionGuard action={action}>
                {children}
            </ActionGuard>
        );
    }

    return <>{fallback}</>;
};

export default PermissionGate;
