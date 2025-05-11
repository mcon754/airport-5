// Service Worker for Task Manager PWA
const CACHE_NAME = 'task-manager-v4'; // Incremented version to force cache refresh

// Static assets to cache (cache-first strategy)
const STATIC_CACHE_ITEMS = [
  './offline.html',
  './favicon.ico',
  './logo192.png',
  './logo512.png',
  './pwa-detector.js'
];

// Dynamic content (network-first strategy)
const DYNAMIC_CACHE_ITEMS = [
  './',
  './index.html',
  './manifest.json',
  './static/js/main.chunk.js',
  './static/js/0.chunk.js',
  './static/js/bundle.js',
  './static/css/main.chunk.css'
];

// Offline fallback page
const OFFLINE_PAGE = './offline.html';

// Install event - cache all required resources
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing Service Worker...', event);
  
  // Skip waiting forces the waiting service worker to become the active service worker
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching app shell');
        // Cache static assets first
        return cache.addAll(STATIC_CACHE_ITEMS)
          .then(() => {
            // Then cache dynamic content
            return cache.addAll(DYNAMIC_CACHE_ITEMS);
          });
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

// Fetch event - use different strategies based on request type
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Check if this is a request for static assets (use cache-first)
  const isStaticAsset = STATIC_CACHE_ITEMS.some(item =>
    url.pathname.endsWith(item) || url.pathname.includes(item.substring(2))
  );
  
  if (isStaticAsset) {
    // Cache-first strategy for static assets
    event.respondWith(cacheFirstStrategy(event.request));
  } else {
    // Network-first strategy for dynamic content
    event.respondWith(networkFirstStrategy(event.request));
  }
});

// Cache-first strategy: try cache first, then network
async function cacheFirstStrategy(request) {
  try {
    // Try to get from cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('[Service Worker] Serving from cache:', request.url);
      return cachedResponse;
    }
    
    // If not in cache, get from network
    const networkResponse = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    
    // Clone the response and put it in the cache
    console.log('[Service Worker] Caching static resource:', request.url);
    cache.put(request, networkResponse.clone());
    
    return networkResponse;
  } catch (error) {
    console.error('[Service Worker] Cache-first strategy failed:', error);
    return handleOfflineResponse(request);
  }
}

// Network-first strategy: try network first, then cache
async function networkFirstStrategy(request) {
  try {
    // Try to get from network first
    console.log('[Service Worker] Fetching from network first:', request.url);
    const networkResponse = await fetch(request);
    
    // If successful, cache the response
    const cache = await caches.open(CACHE_NAME);
    console.log('[Service Worker] Caching dynamic resource:', request.url);
    cache.put(request, networkResponse.clone());
    
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Network request failed, trying cache:', request.url);
    
    // If network fails, try to get from cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If not in cache either, return offline response
    return handleOfflineResponse(request);
  }
}

// Handle offline responses based on request type
function handleOfflineResponse(request) {
  console.log('[Service Worker] Both network and cache failed, serving offline content');
  
  // If it's a navigation request, serve the offline page
  if (request.mode === 'navigate') {
    return caches.match(OFFLINE_PAGE);
  }
  
  // For image requests, return a default offline image
  if (request.destination === 'image') {
    return caches.match('./logo192.png');
  }
  
  // For other requests, return a simple offline response
  return new Response('You are currently offline', {
    status: 503,
    headers: { 'Content-Type': 'text/plain' }
  });
}

// Handle messages from clients
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // Handle cache refresh requests
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('[Service Worker] Clearing cache by request');
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            return caches.delete(cacheName);
          })
        );
      }).then(() => {
        console.log('[Service Worker] Cache cleared successfully');
        // Notify the client that cache was cleared
        if (event.source) {
          event.source.postMessage({
            type: 'CACHE_CLEARED'
          });
        }
      })
    );
  }
});