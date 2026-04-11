const CACHE_NAME = 'tourist-safety-v1';
const urlsToCache = [
  '/',
  '/dashboard',
  '/id',
  '/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// Push notification handler
self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }

  const data = event.data.json();
  const options = {
    body: data.body || 'New notification from Tourist Safety App',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
      url: data.url || '/dashboard'
    },
    actions: [
      {
        action: 'explore',
        title: 'View Details',
        icon: '/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/xmark.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(
      data.title || 'Tourist Safety Alert',
      options
    )
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received.');

  event.notification.close();

  if (event.action === 'explore') {
    // Open the app to the specific URL
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/dashboard')
    );
  } else if (event.action === 'close') {
    // Just close the notification
    event.notification.close();
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/dashboard')
    );
  }
});

// Notification close handler (for cleanup)
self.addEventListener('notificationclose', () => {
  console.log('Notification closed');
});

// Background sync for offline notifications
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Handle any pending notifications that failed to send
  try {
    const pendingNotifications = await getPendingNotifications();
    for (const notification of pendingNotifications) {
      await sendNotification(notification);
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

async function getPendingNotifications() {
  // Get pending notifications from IndexedDB
  return new Promise((resolve) => {
    const request = indexedDB.open('tourist-safety-db', 1);
    
    request.onerror = () => resolve([]);
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['notifications'], 'readonly');
      const store = transaction.objectStore('notifications');
      const getRequest = store.getAll();
      
      getRequest.onsuccess = () => resolve(getRequest.result || []);
    };
  });
}

async function sendNotification(notification) {
  // Send notification via API
  try {
    await fetch('/api/notifications/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notification),
    });
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
}

// Periodic sync for checking new alerts
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-alerts') {
    event.waitUntil(checkForNewAlerts());
  }
});

async function checkForNewAlerts() {
  try {
    // Check for new alerts for the current user
    const response = await fetch('/api/alerts/check');
    if (response.ok) {
      const alerts = await response.json();
      for (const alert of alerts) {
        await showLocalNotification(alert);
      }
    }
  } catch (error) {
    console.error('Failed to check for alerts:', error);
  }
}

async function showLocalNotification(alert) {
  const options = {
    body: alert.message || 'New alert detected',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    data: {
      url: `/dashboard?alert=${alert.id}`
    },
    tag: `alert-${alert.id}`
  };

  await self.registration.showNotification(
    `Tourist Safety: ${alert.type.toUpperCase()}`,
    options
  );
}
