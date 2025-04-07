import { PrismaClient } from "@prisma/client";
import webpush from "web-push";

const prisma = new PrismaClient();

/**
 * Sends push notifications to all users who have habits that haven't been completed in 2+ days.
 * This function is meant to be run as a daily cron job.
 */
export async function sendDueHabitsNotifications() {
  console.log("Running scheduled task: sendDueHabitsNotifications");

  try {
    // Get all users with push subscriptions
    const users = await prisma.user.findMany({
      include: {
        pushSubscription: true,
        habits: {
          include: {
            completed: true,
          },
        },
      },
    });

    console.log(`Found ${users.length} users to check for due habits`);

    const today = new Date();
    let notificationsSent = 0;

    // For each user, check if they have habits that are due
    for (const user of users) {
      // Skip users without push subscriptions
      if (!user.pushSubscription) {
        continue;
      }

      const dueHabits = [];

      // Check each habit
      for (const habit of user.habits) {
        // Sort completions by date (newest first)
        const sortedCompletions = [...habit.completed].sort((a, b) => {
          const dateA = new Date(a.day);
          const dateB = new Date(b.day);
          return dateB.getTime() - dateA.getTime();
        });

        // If no completions or last completion was more than 2 days ago
        if (sortedCompletions.length === 0) {
          dueHabits.push(habit);
        } else {
          const lastCompletion = new Date(sortedCompletions[0].day);
          const daysDifference = Math.floor(
            (today.getTime() - lastCompletion.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (daysDifference >= 2) {
            dueHabits.push(habit);
          }
        }
      }

      // If user has habits due, send notification
      if (dueHabits.length > 0) {
        await sendPushNotification(user.pushSubscription, dueHabits);
        notificationsSent++;
      }
    }

    console.log(`Sent notifications to ${notificationsSent} users`);
    return { success: true, notificationsSent };
  } catch (error: any) {
    console.error("Error sending notifications:", error);
    return { success: false, error: error.message || "Unknown error" };
  }
}

/**
 * Helper function to send push notification
 */
async function sendPushNotification(subscription: any, dueHabits: any[]) {
  const webpushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
  };

  const habitNames = dueHabits.map((habit) => habit.name).join(", ");
  const title = "Habits Due";
  const body = `You haven't completed these habits in 2+ days: ${habitNames}`;

  const payload = JSON.stringify({
    title,
    body,
    icon: "/logo.png",
    badge: "/logo.png",
    tag: "habits-due",
    data: {
      url: "/",
    },
  });

  try {
    await webpush.sendNotification(webpushSubscription, payload);
  } catch (error) {
    console.error("Error sending push notification:", error);
    throw error;
  }
}
