// Web Service Worker for Firebase Cloud Messaging (FCM)
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker
// Since the SW has no direct access to JSON config unless we bundle/inject, we hardcode the key fields safely
firebase.initializeApp({
  apiKey: "AIzaSyAp5t_wIdKTPgodGtEBbDq-iOohOeA7iB8",
  projectId: "hallowed-entry-txhgq",
  messagingSenderId: "993844315110",
  appId: "1:993844315110:web:04bff1885e07f36a7f0c27"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || 'Upcoming Task Deadline!';
  const notificationOptions = {
    body: payload.notification?.body || 'A task on your schedule is approaching its deadline soon.',
    icon: '/assets/logo.png', // Fallback icon path
    badge: '/assets/logo.png',
    tag: payload.data?.taskId || 'task-alert',
    data: {
      taskId: payload.data?.taskId,
      clickUrl: '/'
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // Focus or open application window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
