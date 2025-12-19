/**
 * Service Worker for Portfolio Application
 * Implements caching strategy for offline support
 * Requirements: 8.5 - Cache static assets for 1 year
 */

const CACHE_VERSION = 'v1';
const CACHE_NAME = `portfolio-cache-${CACHE_VERSION}`;
const RUNTIME_CACHE = `portfolio-runtime-${CACHE_VERSION}`;

// Assets to cache immediately on install
const PRECACHE_ASSETS = ['/', '/index.html', '/manifest.json', '/favicon.ico', '/placeholder.svg'];

// Cache duration in seconds
const CACHE_DURATION = {
  STATIC: 365 * 24 * 60 * 60, // 1 year for static assets
  API: 5 * 60, // 5 minutes for API responses
  IMAGES: 30 * 24 * 60 * 60, // 30 days for images
};

/**
 * Install event - precache essential assets
 */
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Precaching assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        console.log('[Service Worker] Skip waiting');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[Service Worker] Precaching failed:', error);
      })
  );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // Delete old cache versions
              return (
                cacheName.startsWith('portfolio-') &&
                cacheName !== CACHE_NAME &&
                cacheName !== RUNTIME_CACHE
              );
            })
            .map((cacheName) => {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[Service Worker] Claiming clients');
        return self.clients.claim();
      })
  );
});

/**
 * Fetch event - implement caching strategies
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome extensions and other protocols
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Skip admin routes from caching (always fetch fresh)
  if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/api/admin')) {
    event.respondWith(fetch(request));
    return;
  }

  // Determine caching strategy based on request type
  if (isStaticAsset(url)) {
    // Cache first for static assets (JS, CSS, fonts)
    event.respondWith(cacheFirst(request, CACHE_NAME));
  } else if (isImage(url)) {
    // Stale-while-revalidate for images
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
  } else if (isAPIRequest(url)) {
    // Network first for API requests with cache fallback
    event.respondWith(networkFirst(request, RUNTIME_CACHE));
  } else {
    // Stale-while-revalidate for HTML and other resources
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
  }
});

/**
 * Cache First Strategy
 * Best for: Static assets that rarely change (JS, CSS, fonts)
 */
async function cacheFirst(request, cacheName) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[Service Worker] Cache first failed:', error);
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

/**
 * Network First Strategy
 * Best for: API requests that need fresh data
 */
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Network failed, trying cache:', error.message);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

/**
 * Stale While Revalidate Strategy
 * Best for: Content that can be slightly stale (images, HTML)
 * Returns cached version immediately while fetching fresh version in background
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await caches.match(request);

  // Fetch fresh version in background
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch((error) => {
      console.log('[Service Worker] Background fetch failed:', error.message);
      return null;
    });

  // Return cached version immediately if available
  if (cachedResponse) {
    return cachedResponse;
  }

  // Otherwise wait for network
  const networkResponse = await fetchPromise;
  if (networkResponse) {
    return networkResponse;
  }

  return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
}

/**
 * Helper: Check if request is for a static asset
 */
function isStaticAsset(url) {
  const staticExtensions = ['.js', '.css', '.woff', '.woff2', '.ttf', '.eot'];
  return staticExtensions.some((ext) => url.pathname.endsWith(ext));
}

/**
 * Helper: Check if request is for an image
 */
function isImage(url) {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico'];
  return imageExtensions.some((ext) => url.pathname.endsWith(ext));
}

/**
 * Helper: Check if request is an API call
 */
function isAPIRequest(url) {
  return url.pathname.startsWith('/api/');
}

/**
 * Message event - handle commands from the app
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
      })
    );
  }
});
