// DigiArtifact Workers - Service Worker
// Enables offline functionality, background sync, and push notifications

const CACHE_NAME = 'digiartifact-workers-v1';
const OFFLINE_CACHE = 'offline-actions-v1';

// Assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/dashboard/schedule',
  '/dashboard/notes',
  '/dashboard/reports',
  '/offline.html',
  '/manifest.json'
];

// API endpoints that support offline queue
const SYNC_ENDPOINTS = [
  '/api/time-entries',
  '/api/clock-in',
  '/api/clock-out',
  '/api/breaks'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== OFFLINE_CACHE)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  // Take control immediately
  self.clients.claim();
});

// Fetch event - network first with cache fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests for caching (but queue them for sync)
  if (request.method !== 'GET') {
    event.respondWith(handleMutatingRequest(request));
    return;
  }

  // For API requests, use network first
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // For page navigations, use cache first with network update
  if (request.mode === 'navigate') {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // For static assets, use cache first
  event.respondWith(cacheFirstStrategy(request));
});

// Network first strategy (for API calls)
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    // Return offline fallback for HTML requests
    if (request.headers.get('Accept')?.includes('text/html')) {
      return caches.match('/offline.html');
    }
    throw error;
  }
}

// Cache first strategy (for static assets)
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    // Update cache in background
    fetch(request).then((networkResponse) => {
      if (networkResponse.ok) {
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, networkResponse);
        });
      }
    }).catch(() => {});
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }
    throw error;
  }
}

// Handle mutating requests (POST, PUT, DELETE)
async function handleMutatingRequest(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch (error) {
    // Queue the request for later sync
    await queueOfflineAction(request);
    
    // Return a synthetic response indicating offline status
    return new Response(
      JSON.stringify({ 
        success: true, 
        offline: true, 
        message: 'Action queued for sync when online' 
      }),
      { 
        status: 202,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Queue offline actions for background sync
async function queueOfflineAction(request) {
  const cache = await caches.open(OFFLINE_CACHE);
  const clonedRequest = request.clone();
  const body = await clonedRequest.text();
  
  const offlineAction = {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body: body,
    timestamp: Date.now()
  };
  
  // Store in IndexedDB for sync
  const db = await openDatabase();
  const tx = db.transaction('offline-actions', 'readwrite');
  const store = tx.objectStore('offline-actions');
  await store.add(offlineAction);
  
  // Register for background sync if available
  if ('sync' in self.registration) {
    await self.registration.sync.register('sync-time-entries');
  }
}

// Open IndexedDB
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('workers-offline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('offline-actions')) {
        db.createObjectStore('offline-actions', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

// Background sync event
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-time-entries') {
    event.waitUntil(syncOfflineActions());
  }
});

// Sync queued offline actions
async function syncOfflineActions() {
  const db = await openDatabase();
  const tx = db.transaction('offline-actions', 'readonly');
  const store = tx.objectStore('offline-actions');
  const actions = await new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  
  console.log('[SW] Syncing', actions.length, 'offline actions');
  
  for (const action of actions) {
    try {
      const response = await fetch(action.url, {
        method: action.method,
        headers: action.headers,
        body: action.body
      });
      
      if (response.ok) {
        // Remove from queue
        const deleteTx = db.transaction('offline-actions', 'readwrite');
        const deleteStore = deleteTx.objectStore('offline-actions');
        deleteStore.delete(action.id);
        
        // Notify client
        self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: 'SYNC_SUCCESS',
              action: action
            });
          });
        });
      }
    } catch (error) {
      console.error('[SW] Failed to sync action:', action, error);
    }
  }
}

// Push notification event
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  const data = event.data?.json() || {
    title: 'DigiArtifact Workers',
    body: 'You have a new notification',
    icon: '/icon-192.png',
    badge: '/icon-72.png'
  };
  
  const options = {
    body: data.body,
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-72.png',
    tag: data.tag || 'workers-notification',
    requireInteraction: data.requireInteraction || false,
    data: data.data || {},
    actions: data.actions || [],
    vibrate: [200, 100, 200]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.tag);
  
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/dashboard';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      // Focus existing window if available
      for (const client of clients) {
        if (client.url.includes('/dashboard') && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

// Periodic sync for break reminders (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'break-reminder') {
    event.waitUntil(checkBreakReminder());
  }
});

async function checkBreakReminder() {
  // Check if user has been working for extended period
  // This would integrate with the actual time tracking data
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({ type: 'CHECK_BREAK_NEEDED' });
  });
}

// Message handler for client communication
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  switch (event.data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'SCHEDULE_NOTIFICATION':
      scheduleLocalNotification(event.data.notification, event.data.delay);
      break;
      
    case 'CLEAR_CACHE':
      caches.delete(CACHE_NAME).then(() => {
        event.source.postMessage({ type: 'CACHE_CLEARED' });
      });
      break;
      
    case 'GET_OFFLINE_QUEUE':
      getOfflineQueueCount().then((count) => {
        event.source.postMessage({ type: 'OFFLINE_QUEUE_COUNT', count });
      });
      break;
  }
});

async function getOfflineQueueCount() {
  try {
    const db = await openDatabase();
    const tx = db.transaction('offline-actions', 'readonly');
    const store = tx.objectStore('offline-actions');
    return new Promise((resolve) => {
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(0);
    });
  } catch {
    return 0;
  }
}

function scheduleLocalNotification(notification, delay) {
  setTimeout(() => {
    self.registration.showNotification(notification.title, {
      body: notification.body,
      icon: '/icon-192.png',
      badge: '/icon-72.png',
      tag: notification.tag || 'scheduled-notification',
      requireInteraction: notification.requireInteraction || false,
      data: notification.data || {},
      actions: notification.actions || []
    });
  }, delay);
}

console.log('[SW] Service worker script loaded');
