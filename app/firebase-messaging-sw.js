// Firebase Cloud Messaging Service Worker for Salbeau
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCZAW--ewEn7Re30ZkP6Qh7oYbj-FBBofI",
  authDomain: "salbeauapp.firebaseapp.com",
  projectId: "salbeauapp",
  storageBucket: "salbeauapp.firebasestorage.app",
  messagingSenderId: "286964052282",
  appId: "1:286964052282:web:ae1160781f170e9c62a003"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message: ', payload);
  const notificationTitle = payload.notification?.title || payload.data?.title || 'Salbeau Order Update';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.message || 'Check your makeup order details',
    icon: '/Assets/logo.png',
    badge: '/Assets/logo.png',
    data: payload.data || {}
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const orderId = event.notification.data?.orderId;
  const targetUrl = orderId ? `/?screen=orders&orderId=${orderId}` : '/?screen=orders';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

