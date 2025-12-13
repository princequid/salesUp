import React from 'react';

const PageLayout = ({ children, className = '', style = {} }) => {
    return (
        <div
            className={`page-layout ${className}`}
            style={{
                maxWidth: '1100px',
                width: '100%',
                margin: '0 auto',
                padding: 'var(--spacing-md)',
                paddingBottom: '6rem', // Ensure space for bottom nav
                boxSizing: 'border-box',
                ...style
            }}
        >
            {children}
        </div>
    );
};

export default PageLayout;
