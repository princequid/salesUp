import React from 'react';

const AppIconButton = ({ icon: Icon, onClick, color = 'var(--text-secondary)', size = 20, style = {}, className = '', type = 'button', ...rest }) => {
    return (
        <button
            type={type}
            className={`icon-btn ${className}`}
            onClick={onClick}
            style={{
                color: color,
                ...style
            }}
            {...rest}
        >
            <Icon size={size} />
        </button>
    );
};

export default AppIconButton;
