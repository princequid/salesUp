import React from 'react';

const ChartWrapper = ({ children, className = '', style = {} }) => {
    return (
        <div
            className={`chart-wrapper ${className}`}
            style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                pointerEvents: 'auto',
                overflow: 'visible',
                // Explicitly disable transforms and animations to prevent layout shifts
                transform: 'none',
                transition: 'none',
                animation: 'none',
                ...style
            }}
        >
            {children}
        </div>
    );
};

export default ChartWrapper;
