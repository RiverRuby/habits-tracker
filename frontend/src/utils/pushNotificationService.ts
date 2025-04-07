import { api } from "./api";

export const pushNotificationService = {
  // Check if push notifications are supported
  isPushNotificationSupported() {
    return "serviceWorker" in navigator && "PushManager" in window;
  },

  // Register the service worker
  async registerServiceWorker() {
    if (!this.isPushNotificationSupported()) {
      return null;
    }

    try {
      return await navigator.serviceWorker.register("/service-worker.js");
    } catch (error) {
      console.error("Service Worker registration failed:", error);
      return null;
    }
  },

  // Check if user has already granted permission
  isPushNotificationEnabled() {
    return Notification.permission === "granted";
  },

  // Request permission for push notifications
  async requestNotificationPermission() {
    try {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  },

  // Get VAPID public key from environment variables or from the server
  async getVapidPublicKey() {
    try {
      // First check for environment variable
      if (process.env.REACT_APP_VAPID_PUBLIC_KEY) {
        return process.env.REACT_APP_VAPID_PUBLIC_KEY;
      }

      // Fall back to server request
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/push/vapidPublicKey`,
      );
      const data = await response.json();
      return data.publicKey;
    } catch (error) {
      console.error("Error fetching VAPID public key:", error);
      return null;
    }
  },

  // Convert the base64 VAPID public key to Uint8Array
  urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  },

  // Subscribe to push notifications
  async subscribeToPushNotifications() {
    try {
      // Register service worker if needed
      const registration = await this.registerServiceWorker();
      if (!registration) return false;

      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();

      // If not subscribed, create new subscription
      if (!subscription) {
        // Get VAPID key
        const vapidPublicKey = await this.getVapidPublicKey();
        if (!vapidPublicKey) return false;

        // Convert VAPID key
        const applicationServerKey = this.urlBase64ToUint8Array(vapidPublicKey);

        // Create subscription
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        });
      }

      // Send subscription to server
      await api.post("/push/subscribe", { subscription });

      return true;
    } catch (error) {
      console.error("Error subscribing to push notifications:", error);
      return false;
    }
  },

  // Unsubscribe from push notifications
  async unsubscribeFromPushNotifications() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Unsubscribe locally
        await subscription.unsubscribe();

        // Unsubscribe on server
        await api.post("/push/unsubscribe", {
          endpoint: subscription.endpoint,
        });

        return true;
      }

      return false;
    } catch (error) {
      console.error("Error unsubscribing from push notifications:", error);
      return false;
    }
  },

  // Check if subscribed to push notifications
  async isSubscribed() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      return !!subscription;
    } catch (error) {
      console.error("Error checking push notification subscription:", error);
      return false;
    }
  },

  // Manually trigger notifications for habits not completed in the last 2 days
  async triggerDueHabitsNotification() {
    try {
      await api.post("/push/notify-due-habits");
      return true;
    } catch (error) {
      console.error("Error triggering due habits notification:", error);
      return false;
    }
  },
};
