/* SalesUP Service Worker */
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Support local notifications via postMessage or registration.showNotification from page
self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data && data.type === 'LOCAL_NOTIFICATION') {
    const { title, options } = data.payload || {};
    if (title) {
      event.waitUntil(self.registration.showNotification(title, options || {}));
    }
  }
});

// Optional: handle push events if integrated later
self.addEventListener('push', (event) => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch { /* ignore parse errors */ }
  const title = payload.title || 'SalesUP';
  const options = Object.assign({
    icon: '/icons/salesup-icon.svg',
    badge: '/icons/salesup-icon.svg',
    body: payload.body || '',
    tag: payload.tag || undefined,
    data: payload.data || undefined,
    lang: 'en-US'
  }, payload.options || {});
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('/');
    })
  );
});
