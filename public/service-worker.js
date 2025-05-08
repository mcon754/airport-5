// Service Worker for Task Manager PWA
const CACHE_NAME = 'task-manager-v3';

// Files to cache for offline use
const urlsToCache = [
  './',
  './index.html',
  './offline.html',
  './manifest.json',
  './favicon.ico',
  './logo192.png',
  './logo512.png',
  './pwa-detector.js',
  './static/js/main.chunk.js',
  './static/js/0.chunk.js',
  './static/js/bundle.js',
  './static/css/main.chunk.css',
  './service-worker.js'
];

// Offline fallback page
const OFFLINE_PAGE = '/offline.html';

// Install event - cache all required resources
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing Service Worker...', event);
  
  // Skip waiting forces the waiting service worker to become the active service worker
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('[Service Worker] Cache failure:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating Service Worker...', event);
  
  // Claim clients forces the service worker to become the active service worker for all clients
  event.waitUntil(self.clients.claim());
  
  // Remove old caches
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
  console.log('[Service Worker] Fetching resource:', event.request.url);
  
  event.respondWith(
    // Try the cache first
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          console.log('[Service Worker] Serving from cache:', event.request.url);
          return response;
        }
        
        // Not in cache - fetch from network
        console.log('[Service Worker] Fetching from network:', event.request.url);
        return fetch(event.request.clone())
          .then(response => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response
            const responseToCache = response.clone();
            
            // Cache the fetched response
            caches.open(CACHE_NAME)
              .then(cache => {
                console.log('[Service Worker] Caching new resource:', event.request.url);
                cache.put(event.request, responseToCache);
              });
              
            return response;
          })
          .catch(error => {
            // Network request failed, try to serve from cache
            console.log('[Service Worker] Network error, serving offline page');
            
            // If it's a navigation request, serve the offline page
            if (event.request.mode === 'navigate') {
              return caches.match('./offline.html');
            }
            
            // For image requests, return a default offline image
            if (event.request.destination === 'image') {
              return caches.match('/logo192.png');
            }
            
            // For other requests, return a simple offline response
            return new Response('You are currently offline', {
              status: 503,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});

// Handle messages from clients
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});