import React from 'react';
import { useRole } from '../logic/roleUtils';
import { useAuth } from '../logic/AuthContext';

const ActionGuard = ({ action, reason = '', fallback = null, children }) => {
  const { userRole, can, ROLES } = useRole();
  const { requireAuth } = useAuth();

  if (!action) return <>{children}</>;

  const allowed = can(action);
  if (allowed) return <>{children}</>;

  if (userRole !== ROLES.GUEST) return <>{fallback}</>;

  if (!React.isValidElement(children)) return <>{fallback}</>;

  const child = React.Children.only(children);
  const childProps = child.props || {};

  const intercept = (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    requireAuth(reason || 'You must register your business or log in to continue.');
  };

  const mergedStyle = {
    ...(childProps.style || {}),
    opacity: 0.6,
    cursor: 'not-allowed'
  };

  const patchedProps = {
    ...childProps,
    disabled: false,
    readOnly: true,
    onClick: undefined,
    onClickCapture: intercept,
    onMouseDownCapture: intercept,
    onChange: undefined,
    onChangeCapture: intercept,
    onSubmit: undefined,
    onSubmitCapture: intercept,
    onKeyDown: undefined,
    onKeyDownCapture: intercept,
    style: mergedStyle,
    title: childProps.title || 'Register your business or log in to continue',
    'aria-disabled': true
  };

  if (String(childProps.type || '').toLowerCase() === 'submit') {
    patchedProps.type = 'button';
  }

  if (child.type === React.Fragment) {
    return (
      <span {...patchedProps}>
        {childProps.children}
      </span>
    );
  }

  return React.cloneElement(child, patchedProps);
};

export default ActionGuard;
