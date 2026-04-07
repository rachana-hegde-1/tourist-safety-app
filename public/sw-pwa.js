const CACHE_NAME = 'tourist-safety-v1';
const urlsToCache = [
  '/',
  '/dashboard',
  '/api/notify',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-96x96.png'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Offline support cached');
      })
  );
});

// Fetch event with offline support
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Handle panic API calls offline
  if (url.pathname === '/api/notify') {
    if (!navigator.onLine) {
      // Store panic request for when online
      request.clone().json().then((requestData) => {
        const panicData = {
          timestamp: new Date().toISOString(),
          data: requestData,
          retryCount: 0
        };

        // Store in IndexedDB for retry
        caches.open('panic-requests').then((requestStore) => {
          requestStore.put(request.url, new Response(JSON.stringify(panicData)));
        });
      });

      return new Response(JSON.stringify({
        success: false,
        message: 'Offline: Panic alert saved. Will send when online.',
        offline: true
      }), {
        status: 200,
        statusText: 'OK'
      });
    }
  }

  event.respondWith(
    caches.match(request)
      .then((response) => {
        // Return cached response if available
        if (response) {
          return response;
        }

        // Otherwise fetch from network
        return fetch(request).then((networkResponse) => {
          // Cache successful network responses
          if (networkResponse.ok) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        });
      })
      .catch(() => {
        // Return offline fallback
        return new Response('Offline - No network connection available', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      })
  );
});

// Sync stored panic requests when back online
self.addEventListener('sync', (event) => {
  if (event.tag === 'panic-sync') {
    event.waitUntil(
      caches.open('panic-requests').then((cache) => {
        return cache.keys().then((keys) => {
          return Promise.all(
            keys.map((key) => {
              return cache.get(key).then((response) => {
                if (response) {
                  response.text().then((panicDataText) => {
                    const panicData = JSON.parse(panicDataText);
                  
                    // Retry the panic API call
                    fetch('/api/notify', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify(panicData.data)
                    }).then((retryResponse) => {
                      if (retryResponse.ok) {
                        // Success - remove from offline storage
                        cache.delete(key);
                      }
                    }).catch((error) => {
                      console.error('Failed to retry panic request:', error);
                    });
                  });
                }
              });
            })
          );
        });
      })
    );
  }
});

// Background sync registration
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
