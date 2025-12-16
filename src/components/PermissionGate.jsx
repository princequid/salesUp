import React from 'react';
import { useRole } from '../logic/roleUtils';

// Gate by screen and/or action using centralized permission logic
const PermissionGate = ({ screen, action, fallback = null, children }) => {
    const { hasAccess, can } = useRole();
    const screenAllowed = screen ? hasAccess(screen) : true;
    const actionAllowed = action ? can(action) : true;
    const allowed = screenAllowed && actionAllowed;
    return allowed ? <>{children}</> : <>{fallback}</>;
};

export default PermissionGate;
