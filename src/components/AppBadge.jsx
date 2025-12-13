import React from 'react';

const AppBadge = ({ children, variant = 'primary', style = {} }) => {

    const variants = {
        primary: {
            backgroundColor: '#DBEAFE', // Blue 100
            color: 'var(--accent-primary)'
        },
        success: {
            backgroundColor: '#D1FAE5', // Emerald 100
            color: 'var(--accent-success)'
        },
        warning: {
            backgroundColor: '#FEF3C7', // Amber 100
            color: 'var(--accent-warning)'
        },
        danger: {
            backgroundColor: '#FEE2E2', // Red 100
            color: 'var(--accent-danger)'
        },
        neutral: {
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-secondary)'
        }
    };

    const variantStyle = variants[variant] || variants.neutral;

    return (
        <span style={{
            padding: '0.25rem 0.5rem',
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
            ...variantStyle,
            ...style
        }}>
            {children}
        </span>
    );
};

export default AppBadge;
