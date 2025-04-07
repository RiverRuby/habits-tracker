import { pushNotificationService } from "./pushNotificationService";

/**
 * Schedules a daily check for habits that haven't been completed
 * in the last 2+ days. This will trigger a notification if needed.
 */
export const scheduleHabitCheck = () => {
  // Check if push notifications are supported and enabled
  if (
    !pushNotificationService.isPushNotificationSupported() ||
    !pushNotificationService.isPushNotificationEnabled()
  ) {
    return;
  }

  // Function to check habits
  const checkHabits = async () => {
    // Only check if user is subscribed to notifications
    const isSubscribed = await pushNotificationService.isSubscribed();
    if (isSubscribed) {
      await pushNotificationService.triggerDueHabitsNotification();
    }
  };

  // Calculate time until midnight
  const now = new Date();
  const night = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1, // tomorrow
    0, // midnight
    0,
    1, // 1 second after midnight
  );
  const msUntilMidnight = night.getTime() - now.getTime();

  // Schedule first check at midnight
  setTimeout(() => {
    checkHabits();

    // Then set up daily interval (24 hours)
    setInterval(checkHabits, 24 * 60 * 60 * 1000);
  }, msUntilMidnight);

  // Also check immediately if it's been more than a day since the last check
  const lastCheck = localStorage.getItem("lastHabitCheck");
  if (!lastCheck || Date.now() - parseInt(lastCheck) > 24 * 60 * 60 * 1000) {
    checkHabits();
    localStorage.setItem("lastHabitCheck", Date.now().toString());
  }
};
