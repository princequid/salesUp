import React from 'react';

const AppButton = ({ children, variant = 'primary', onClick, className = '', fullWidth = false, style = {}, type = 'button', disabled = false, icon: Icon }) => {

    // Map variant to CSS class
    const variantClass = `btn-${variant}`;

    // Construct final class string
    const finalClassName = `btn ${variantClass} ${className}`;

    // Merge styles, handling fullWidth dynamically if prefer not to use specific class
    const combinedStyle = {
        width: fullWidth ? '100%' : 'auto',
        ...style
    };

    return (
        <button
            type={type}
            className={finalClassName}
            style={combinedStyle}
            onClick={onClick}
            disabled={disabled}
        >
            {Icon && <Icon size={18} style={{ marginRight: children ? '0.5rem' : 0 }} />}
            {children}
        </button>
    );
};

export default AppButton;
