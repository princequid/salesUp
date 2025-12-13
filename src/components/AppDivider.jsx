import React from 'react';

const AppDivider = ({ style = {} }) => {
    return (
        <hr style={{
            border: 'none',
            borderTop: '1px solid #E2E8F0',
            width: '100%',
            opacity: 0.6,
            ...style
        }} />
    );
};

export default AppDivider;
