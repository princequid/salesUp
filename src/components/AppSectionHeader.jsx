import React from 'react';

const AppSectionHeader = ({ title, style = {} }) => {
    return (
        <h3 style={{
            fontSize: '1.1rem',
            marginBottom: '1rem',
            borderBottom: '1px solid #E2E8F0',
            paddingBottom: '0.5rem',
            color: 'var(--text-primary)',
            ...style
        }}>
            {title}
        </h3>
    );
};

export default AppSectionHeader;
