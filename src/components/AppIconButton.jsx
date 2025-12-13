import React from 'react';

const AppIconButton = ({ icon: Icon, onClick, color = 'var(--text-secondary)', size = 20, style = {}, className = '' }) => {
    return (
        <button
            className={`icon-btn ${className}`}
            onClick={onClick}
            style={{
                color: color,
                ...style
            }}
        >
            <Icon size={size} />
        </button>
    );
};

export default AppIconButton;
