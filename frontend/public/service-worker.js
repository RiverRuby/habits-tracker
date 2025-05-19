/* eslint-disable no-restricted-globals */
// Simple service worker that only caches static assets

// Cache name - change this if you need to force cache updates
const CACHE_NAME = "habits-cache-v1";

// Only cache static assets, NOT HTML files
const urlsToCache = [
  "/manifest.json",
  "/logo.png",
  "/static/js/",
  "/static/css/",
  "/static/media/",
];

// Install service worker and cache static assets
self.addEventListener("install", (event) => {
  // Force activation
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Pre-cache important static assets
      return cache.addAll(
        urlsToCache.filter((url) => !url.includes("/static/")),
      );
    }),
  );
});

// Clean up old caches on activation
self.addEventListener("activate", (event) => {
  // Take control immediately
  event.waitUntil(self.clients.claim());

  // Delete old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
});

// Network-first strategy for HTML, cache-first for static assets
self.addEventListener("fetch", (event) => {
  // HTML requests - always go to network first
  if (
    event.request.mode === "navigate" ||
    (event.request.method === "GET" &&
      event.request.headers.get("accept").includes("text/html"))
  ) {
    event.respondWith(
      fetch(event.request).catch(() => {
        // Fallback to cache if network fails
        return caches.match(event.request);
      }),
    );
    return;
  }

  // For static assets, try cache first, then network
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached version if available
      if (cachedResponse) {
        return cachedResponse;
      }

      // Otherwise fetch from network and cache the result
      return fetch(event.request).then((response) => {
        // Don't cache if not a valid response
        if (!response || response.status !== 200) {
          return response;
        }

        // Cache successful responses for static assets
        if (
          response.url.includes("/static/") ||
          urlsToCache.some((url) => response.url.includes(url))
        ) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }

        return response;
      });
    }),
  );
});
