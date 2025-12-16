import React, { useState, useEffect } from 'react';
import cloudSyncService, { SYNC_STATUS } from '../logic/cloudSyncService';
import { Cloud, CloudOff, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

const SyncIndicator = () => {
    const [syncStatus, setSyncStatus] = useState(SYNC_STATUS.IDLE);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const unsubscribe = cloudSyncService.subscribe((update) => {
            if (update.status) {
                setSyncStatus(update.status);
                
                // Show indicator when syncing, hide after success/error
                if (update.status === SYNC_STATUS.SYNCING) {
                    setIsVisible(true);
                } else if (update.status === SYNC_STATUS.SUCCESS) {
                    setIsVisible(true);
                    setTimeout(() => setIsVisible(false), 2000);
                } else if (update.status === SYNC_STATUS.ERROR) {
                    setIsVisible(true);
                    setTimeout(() => setIsVisible(false), 3000);
                }
            }
        });

        return () => unsubscribe();
    }, []);

    if (!isVisible) return null;

    const getStatusConfig = () => {
        switch (syncStatus) {
            case SYNC_STATUS.SYNCING:
                return {
                    icon: RefreshCw,
                    color: 'var(--accent-primary)',
                    bg: 'rgba(37, 99, 235, 0.1)',
                    text: 'Syncing...',
                    spin: true
                };
            case SYNC_STATUS.SUCCESS:
                return {
                    icon: CheckCircle,
                    color: 'var(--accent-success)',
                    bg: 'rgba(16, 185, 129, 0.1)',
                    text: 'Synced',
                    spin: false
                };
            case SYNC_STATUS.ERROR:
                return {
                    icon: AlertCircle,
                    color: 'var(--accent-danger)',
                    bg: 'rgba(239, 68, 68, 0.1)',
                    text: 'Sync failed',
                    spin: false
                };
            case SYNC_STATUS.OFFLINE:
                return {
                    icon: CloudOff,
                    color: 'var(--text-secondary)',
                    bg: 'rgba(100, 116, 139, 0.1)',
                    text: 'Offline',
                    spin: false
                };
            default:
                return null;
        }
    };

    const config = getStatusConfig();
    if (!config) return null;

    const Icon = config.icon;

    return (
        <div style={{
            position: 'fixed',
            top: '1rem',
            right: '1rem',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 0.75rem',
            background: config.bg,
            backdropFilter: 'blur(8px)',
            border: `1px solid ${config.color}`,
            borderRadius: 'var(--radius-sm)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            fontSize: '0.75rem',
            fontWeight: 500,
            color: config.color,
            animation: 'slideInRight 0.3s ease-out'
        }}>
            <Icon size={14} className={config.spin ? 'spin' : ''} />
            <span>{config.text}</span>
        </div>
    );
};

export default SyncIndicator;
