// Branded Notifications for SalesUP
// Use Service Worker showNotification to ensure app identity and icon are applied.

export function requestNotificationPermission() {
  if (!('Notification' in window)) return Promise.resolve('unsupported');
  if (Notification.permission === 'granted') return Promise.resolve('granted');
  if (Notification.permission === 'denied') return Promise.resolve('denied');
  return Notification.requestPermission();
}

export async function showSalesUpNotification(title, options = {}) {
  const baseOptions = {
    icon: '/icons/salesup-icon.svg',
    badge: '/icons/salesup-icon.svg',
    body: options.body || '',
    lang: 'en-US',
    data: options.data,
    tag: options.tag,
    renotify: options.renotify || false,
    requireInteraction: options.requireInteraction || false,
  };

  // Prefer SW notifications for proper app identity when installed
  if ('serviceWorker' in navigator) {
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg && reg.showNotification) {
      return reg.showNotification(title, Object.assign(baseOptions, options));
    }
    // Fallback via message to active controller
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'LOCAL_NOTIFICATION',
        payload: { title, options: Object.assign(baseOptions, options) }
      });
      return;
    }
  }

  // Final fallback to window Notification (may show under browser identity)
  if ('Notification' in window && Notification.permission === 'granted') {
    return new Notification(title, baseOptions);
  }
}
