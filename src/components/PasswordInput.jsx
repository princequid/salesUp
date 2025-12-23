import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const PasswordInput = ({
    label,
    name,
    value,
    onChange,
    placeholder,
    error,
    style = {},
    disabled = false,
    readOnly = false,
    title = '',
    required = false,
    ...rest
}) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputRef = React.useRef(null);

    const togglePasswordVisibility = (e) => {
        e.preventDefault(); // Prevent button from taking focus away from the input
        setShowPassword(prev => !prev);
        // Maintain focus on input after toggle
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    return (
        <div style={{ marginBottom: '1rem', ...style }}>
            {label && (
                <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: 'var(--text-secondary)'
                }}>
                    {label}
                </label>
            )}
            <div style={{ position: 'relative' }}>
                <input
                    ref={inputRef}
                    type={showPassword ? 'text' : 'password'}
                    name={name}
                    className="input-field"
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    readOnly={readOnly}
                    title={title}
                    required={required}
                    {...rest}
                    style={{
                        paddingRight: '2.5rem',
                        width: '100%'
                    }}
                />
                <button
                    type="button"
                    onMouseDown={togglePasswordVisibility} // Use onMouseDown to prevent blur
                    disabled={disabled || readOnly}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        cursor: disabled || readOnly ? 'not-allowed' : 'pointer',
                        padding: '0.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-secondary)',
                        opacity: disabled || readOnly ? 0.5 : 1,
                        transition: 'color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                        if (!disabled && !readOnly) {
                            e.currentTarget.style.color = 'var(--text-primary)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--text-secondary)';
                    }}
                >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            </div>
            {error && (
                <span style={{
                    color: 'var(--accent-danger)',
                    fontSize: '0.75rem',
                    marginTop: '0.25rem',
                    display: 'block'
                }}>
                    {error}
                </span>
            )}
        </div>
    );
};

export default PasswordInput;
