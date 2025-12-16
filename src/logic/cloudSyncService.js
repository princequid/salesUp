// Cloud Sync Service using localStorage as fallback for demo
// In production, this would connect to a real backend API (Firebase, Supabase, etc.)

const CLOUD_STORAGE_KEY = 'salesUp_cloud_backup';
const SYNC_STATUS_KEY = 'salesUp_sync_status';
const LAST_SYNC_KEY = 'salesUp_last_sync';

export const SYNC_STATUS = {
    IDLE: 'idle',
    SYNCING: 'syncing',
    SUCCESS: 'success',
    ERROR: 'error',
    OFFLINE: 'offline'
};

class CloudSyncService {
    constructor() {
        this.syncCallbacks = [];
        this.isOnline = navigator.onLine;
        this.setupConnectionListener();
    }

    setupConnectionListener() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            console.log('[CloudSync] Connection restored');
            this.notifyCallbacks({ status: SYNC_STATUS.IDLE });
            // Auto-sync when connection is restored
            this.autoSync();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.log('[CloudSync] Connection lost');
            this.notifyCallbacks({ status: SYNC_STATUS.OFFLINE });
        });
    }

    subscribe(callback) {
        this.syncCallbacks.push(callback);
        return () => {
            this.syncCallbacks = this.syncCallbacks.filter(cb => cb !== callback);
        };
    }

    notifyCallbacks(update) {
        this.syncCallbacks.forEach(callback => callback(update));
    }

    async syncToCloud(data) {
        if (!this.isOnline) {
            console.log('[CloudSync] Offline - sync deferred');
            return { success: false, status: SYNC_STATUS.OFFLINE };
        }

        this.notifyCallbacks({ status: SYNC_STATUS.SYNCING });

        try {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            // In production, replace this with actual API call:
            // const response = await fetch('YOUR_API_ENDPOINT/sync', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(data)
            // });

            // For demo, store in localStorage with different key
            const cloudData = {
                data,
                timestamp: new Date().toISOString(),
                version: '1.0'
            };

            localStorage.setItem(CLOUD_STORAGE_KEY, JSON.stringify(cloudData));
            localStorage.setItem(LAST_SYNC_KEY, cloudData.timestamp);

            console.log('[CloudSync] Data synced to cloud:', {
                productsCount: data.products?.length || 0,
                salesCount: data.sales?.length || 0,
                transactionsCount: data.transactions?.length || 0,
                timestamp: cloudData.timestamp
            });

            this.notifyCallbacks({ 
                status: SYNC_STATUS.SUCCESS,
                lastSync: cloudData.timestamp
            });

            return { success: true, status: SYNC_STATUS.SUCCESS };
        } catch (error) {
            console.error('[CloudSync] Sync failed:', error);
            this.notifyCallbacks({ status: SYNC_STATUS.ERROR, error: error.message });
            return { success: false, status: SYNC_STATUS.ERROR, error };
        }
    }

    async syncFromCloud() {
        if (!this.isOnline) {
            console.log('[CloudSync] Offline - cannot fetch from cloud');
            return { success: false, status: SYNC_STATUS.OFFLINE };
        }

        try {
            // In production, replace with actual API call:
            // const response = await fetch('YOUR_API_ENDPOINT/data');
            // const cloudData = await response.json();

            const cloudBackup = localStorage.getItem(CLOUD_STORAGE_KEY);
            if (!cloudBackup) {
                console.log('[CloudSync] No cloud backup found');
                return { success: false, data: null };
            }

            const cloudData = JSON.parse(cloudBackup);
            console.log('[CloudSync] Data fetched from cloud:', {
                timestamp: cloudData.timestamp
            });

            return { success: true, data: cloudData.data, timestamp: cloudData.timestamp };
        } catch (error) {
            console.error('[CloudSync] Fetch failed:', error);
            return { success: false, error };
        }
    }

    getLastSyncTime() {
        const lastSync = localStorage.getItem(LAST_SYNC_KEY);
        return lastSync || null;
    }

    async autoSync() {
        // This is called when connection is restored
        // In a real app, you'd compare local and cloud versions
        console.log('[CloudSync] Auto-sync triggered');
    }

    getConnectionStatus() {
        return this.isOnline ? 'online' : 'offline';
    }

    async forceSync(data) {
        console.log('[CloudSync] Force sync initiated');
        return await this.syncToCloud(data);
    }
}

// Singleton instance
const cloudSyncService = new CloudSyncService();

export default cloudSyncService;
