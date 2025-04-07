import { BellRing, BellOff, Info } from "lucide-react";
import React, { useEffect, useState } from "react";
import { pushNotificationService } from "../utils/pushNotificationService";

export const NotificationConsent: React.FC = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showBanner, setShowBanner] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    const checkSupport = async () => {
      const supported = pushNotificationService.isPushNotificationSupported();
      setIsSupported(supported);

      if (supported) {
        // Register service worker first
        await pushNotificationService.registerServiceWorker();

        // Then check if already subscribed
        const subscribed = await pushNotificationService.isSubscribed();
        setIsSubscribed(subscribed);

        // Show banner only if supported and not yet subscribed
        setShowBanner(supported && !subscribed);
      }

      setIsLoading(false);
    };

    checkSupport();
  }, []);

  const handleSubscribe = async () => {
    setIsLoading(true);

    // Request permission first
    const permissionGranted =
      await pushNotificationService.requestNotificationPermission();

    if (permissionGranted) {
      // Subscribe to push notifications
      const success =
        await pushNotificationService.subscribeToPushNotifications();

      if (success) {
        setIsSubscribed(true);
        setShowBanner(false);
      }
    }

    setIsLoading(false);
  };

  const handleUnsubscribe = async () => {
    setIsLoading(true);

    const success =
      await pushNotificationService.unsubscribeFromPushNotifications();

    if (success) {
      setIsSubscribed(false);
      setShowBanner(true);
    }

    setIsLoading(false);
  };

  const toggleInfo = () => {
    setShowInfo(!showInfo);
  };

  // Don't show anything if not supported or still loading
  if (!isSupported || isLoading) {
    return null;
  }

  // Banner for non-subscribed users
  if (showBanner) {
    return (
      <div className="mb-4 rounded-lg bg-dark-gray p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BellRing className="size-5 text-light-gray" />
            <span>Get notified when habits need attention</span>
            <button
              onClick={toggleInfo}
              className="ml-1 text-light-gray hover:text-white"
              aria-label="More information about notifications"
            >
              <Info className="size-4" />
            </button>
          </div>
          <button
            className="bg-blue-600 hover:bg-blue-700 rounded-lg px-3 py-1 text-sm font-bold text-white duration-100"
            onClick={handleSubscribe}
            disabled={isLoading}
          >
            Enable
          </button>
        </div>

        {showInfo && (
          <div className="mt-3 rounded-md bg-gray p-3 text-sm">
            <p className="mb-2">Enabling notifications will:</p>
            <ul className="list-disc pl-5">
              <li>Alert you when you haven't completed habits in 2+ days</li>
              <li>Help maintain your streaks and build consistency</li>
              <li>Run once daily at midnight (UTC)</li>
            </ul>
            <p className="mt-2 text-xs text-light-gray">
              You can disable notifications at any time.
            </p>
          </div>
        )}
      </div>
    );
  }

  // Small indicator for subscribed users
  if (isSubscribed) {
    return (
      <div className="mb-4 flex items-center justify-end gap-2">
        <span className="text-xs text-light-gray">Notifications enabled</span>
        <button
          className="flex items-center gap-1 rounded-lg bg-dark-gray px-2 py-1 text-xs font-bold text-light-gray duration-100 hover:bg-opacity-80"
          onClick={handleUnsubscribe}
          disabled={isLoading}
        >
          <BellOff className="size-3" />
          Disable
        </button>
      </div>
    );
  }

  return null;
};
