import React from 'react';

const AppListItem = ({ title, subtitle, rightContent, icon: Icon, onClick, style = {} }) => {
    return (
        <div
            onClick={onClick}
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem 0',
                borderBottom: '1px solid #E2E8F0',
                cursor: onClick ? 'pointer' : 'default',
                ...style
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {Icon && (
                    <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'var(--bg-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-secondary)'
                    }}>
                        <Icon size={16} />
                    </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{title}</span>
                    {subtitle && <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{subtitle}</span>}
                </div>
            </div>

            {rightContent && (
                <div style={{ textAlign: 'right' }}>
                    {rightContent}
                </div>
            )}
        </div>
    );
};

export default AppListItem;
