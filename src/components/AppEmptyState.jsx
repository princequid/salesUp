import React from 'react';
import { PackageOpen } from 'lucide-react';
import { ANIMATIONS } from '../styles/animations';

const AppEmptyState = ({
    title = "No items found",
    message = "There's nothing here yet.",
    action,
    icon: Icon = PackageOpen
}) => {
    return (
        <div
            className={`glass-panel ${ANIMATIONS.fadeIn}`}
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 'var(--spacing-xxl)',
                textAlign: 'center',
                minHeight: '300px', // Ensure it takes up space nicely
                color: 'var(--text-secondary)'
            }}
        >
            <div style={{
                background: 'var(--bg-secondary)',
                padding: '1.5rem',
                borderRadius: '50%',
                marginBottom: 'var(--spacing-lg)',
                color: 'var(--accent-primary)'
            }}>
                <Icon size={48} strokeWidth={1.5} />
            </div>

            <h3 style={{
                fontSize: 'var(--font-h3)',
                color: 'var(--text-primary)',
                marginBottom: 'var(--spacing-sm)'
            }}>
                {title}
            </h3>

            <p style={{
                fontSize: 'var(--font-body)',
                maxWidth: '300px',
                marginBottom: action ? 'var(--spacing-lg)' : 0
            }}>
                {message}
            </p>

            {action && (
                <div className={ANIMATIONS.cardPop}>
                    {action}
                </div>
            )}
        </div>
    );
};

export default AppEmptyState;
