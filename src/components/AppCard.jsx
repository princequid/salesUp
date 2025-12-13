import React from 'react';
import { ANIMATIONS } from '../styles/animations';

const AppCard = ({ children, className = '', style = {}, title, action }) => {
    return (
        <div
            className={`glass-panel ${ANIMATIONS.cardPop} ${className}`}
            style={{
                padding: '1.5rem',
                marginBottom: '1rem',
                backgroundColor: 'var(--bg-card)',
                border: 'var(--glass-border)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--glass-shadow)',
                ...style
            }}
        >
            {(title || action) && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    {title && <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', margin: 0 }}>{title}</h3>}
                    {action}
                </div>
            )}
            {children}
        </div>
    );
};

export default AppCard;
