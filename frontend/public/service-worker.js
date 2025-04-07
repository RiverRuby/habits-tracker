/* eslint-disable no-restricted-globals */
/* eslint-disable no-undef */
// Service Worker for Habits Tracker PWA

// Cache version - update this when you make significant changes
const CACHE_NAME = "habits-tracker-v1";

// Static assets to cache on install
const STATIC_CACHE_URLS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/logo.png",
  "/static/js/main.chunk.js",
  "/static/js/0.chunk.js",
  "/static/js/bundle.js",
];

// Install the service worker
self.addEventListener("install", (event) => {
  console.log("[ServiceWorker] Install");

  // Precache static assets
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[ServiceWorker] Caching app shell");
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log("[ServiceWorker] Skip waiting on install");
        return self.skipWaiting();
      }),
  );
});

// Cache and return requests
self.addEventListener("fetch", (event) => {
  // Don't cache API requests
  if (event.request.url.includes("/habits")) {
    return fetch(event.request);
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return response
      if (response) {
        return response;
      }

      // Clone the request because it's a one-time use stream
      const fetchRequest = event.request.clone();

      return fetch(fetchRequest)
        .then((response) => {
          // Check if we received a valid response
          if (
            !response ||
            response.status !== 200 ||
            response.type !== "basic"
          ) {
            return response;
          }

          // Clone the response because it's a one-time use stream
          const responseToCache = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch((error) => {
          // Network request failed, try to serve from cache
          console.log(
            "[ServiceWorker] Network request failed. Serving content from cache: " +
              error,
          );
          return caches.open(CACHE_NAME).then((cache) => {
            return cache.match(event.request).then((matching) => {
              if (matching) {
                return matching;
              }

              // If there's no match in cache, return the offline page
              if (event.request.headers.get("accept").includes("text/html")) {
                return cache.match("/");
              }

              return Promise.reject("no-match");
            });
          });
        });
    }),
  );
});

// Update the service worker and cleanup old caches
self.addEventListener("activate", (event) => {
  console.log("[ServiceWorker] Activate");

  const cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheWhitelist.indexOf(cacheName) === -1) {
              console.log("[ServiceWorker] Clearing old cache:", cacheName);
              return caches.delete(cacheName);
            }
          }),
        );
      })
      .then(() => {
        console.log("[ServiceWorker] Claiming clients for version", CACHE_NAME);
        return self.clients.claim();
      }),
  );
});

// Handle push notifications
self.addEventListener("push", (event) => {
  console.log("[ServiceWorker] Push received:", event);

  let data = {};
  if (event.data) {
    try {
      data = JSON.parse(event.data.text());
      console.log("[ServiceWorker] Push data:", data);
    } catch (e) {
      console.error("[ServiceWorker] Error parsing push data:", e);
      data = {
        title: "Habits Tracker",
        body: event.data.text(),
      };
    }
  }

  // Determine if this is a test notification
  const isTest = data.tag === "test-notification" || data.data?.test === true;

  // Configure notification options
  const title = data.title || "Habits Tracker";
  const options = {
    body: data.body || "You have habits due to complete!",
    icon: data.icon || "/logo.png",
    badge: data.badge || "/logo.png",
    tag: data.tag || (isTest ? "test-notification" : "habits-notification"),
    data: data.data || { url: "/" },
    vibrate: [100, 50, 100],
    renotify: true,
    requireInteraction: true,
    // Add timestamp to notification data
    timestamp: Date.now(),
    // Different actions for test vs. regular notifications
    actions: isTest
      ? [{ action: "dismiss", title: "Dismiss" }]
      : [
          { action: "view", title: "View Habits" },
          { action: "dismiss", title: "Dismiss" },
        ],
  };

  // For test notifications, add some extra flare
  if (isTest) {
    options.body = `📱 ${options.body} [Test Notification]`;
  }

  console.log("[ServiceWorker] Showing notification:", { title, options });
  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  console.log("[ServiceWorker] Notification click received:", event);

  // Close the notification
  event.notification.close();

  // Get the notification data
  const notification = event.notification;
  const action = event.action;
  let urlToOpen = notification.data.url || "/";

  // Handle specific actions
  if (action === "view") {
    urlToOpen = "/"; // Navigate to home page to view habits
  } else if (action === "dismiss") {
    return; // Just close the notification without opening a page
  }

  // For test notifications, log additional information
  if (notification.tag === "test-notification" || notification.data.test) {
    console.log("[ServiceWorker] Test notification clicked:", {
      title: notification.title,
      body: notification.body,
      timestamp: new Date(notification.timestamp).toLocaleString(),
      data: notification.data,
    });
  }

  // Open the correct page when notification is clicked
  event.waitUntil(
    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then((windowClients) => {
        // If a tab matching the URL is already open, focus it
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          if (client.url.includes(urlToOpen) && "focus" in client) {
            return client.focus();
          }
        }

        // Otherwise, open a new tab
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      }),
  );
});
