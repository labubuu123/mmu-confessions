import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

self.skipWaiting();
clientsClaim();

self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  
  const options = {
    body: data.body || 'You have a new update on MMU Confessions',
    icon: '/icon-192x192.png',
    badge: '/favicon.svg',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/' },
    tag: data.tag || 'general-update',
    renotify: true
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'MMU Confessions', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data.url;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      const client = windowClients.find(c => c.visibilityState === 'visible') || windowClients[0];
      
      if (client && 'focus' in client) {
        client.navigate(urlToOpen);
        return client.focus();
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});