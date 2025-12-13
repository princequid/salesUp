import React from 'react';
import { X } from 'lucide-react';
import AppIconButton from './AppIconButton';
import AppCard from './AppCard';

const AppModal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '1rem'
        }}>
            <div
                className="animate-slide-up"
                style={{
                    width: '100%',
                    maxWidth: '500px',
                    maxHeight: '90vh',
                    overflowY: 'auto'
                }}
            >
                <AppCard style={{ margin: 0, position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{title}</h3>
                        <AppIconButton icon={X} onClick={onClose} />
                    </div>
                    {children}
                </AppCard>
            </div>
        </div>
    );
};

export default AppModal;
