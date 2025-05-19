// Register service worker for PWA support
export function register() {
  if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
    window.addEventListener("load", () => {
      const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

      navigator.serviceWorker
        .register(swUrl)
        .then((registration) => {
          // Basic update handling
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              console.log("New service worker installing");
            }
          });

          console.log("Service Worker registered: ", registration);
        })
        .catch((error) => {
          console.error("Error registering Service Worker: ", error);
        });
    });
  }
}

// Unregister service worker
export function unregister() {
  if ("serviceWorker" in navigator) {
    return navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
  return Promise.resolve();
}
