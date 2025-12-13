import React from 'react';

const AppInput = ({ label, name, type = 'text', value, onChange, placeholder, error, min, step, icon: Icon, style = {} }) => {
    return (
        <div style={{ marginBottom: '1rem', ...style }}>
            {label && (
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                    {label}
                </label>
            )}
            <div style={{ position: 'relative' }}>
                {Icon && (
                    <Icon
                        size={18}
                        style={{
                            position: 'absolute',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            left: '1rem',
                            color: 'var(--text-secondary)'
                        }}
                    />
                )}
                <input
                    type={type}
                    name={name}
                    className="input-field"
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    min={min}
                    step={step}
                    style={{
                        paddingLeft: Icon ? '2.5rem' : '1rem',
                        width: '100%'
                    }}
                />
            </div>
            {error && (
                <span style={{ color: 'var(--accent-danger)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                    {error}
                </span>
            )}
        </div>
    );
};

export default AppInput;
