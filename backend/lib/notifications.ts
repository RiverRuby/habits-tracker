import { PrismaClient } from "@prisma/client";
import webpush from "web-push";

const prisma = new PrismaClient();

// Helper function to get habits not completed in the last 2 days
export async function getHabitsNotCompletedInLast2Days(userId: string) {
  // Get all habits for the user
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { habits: { include: { completed: true } } },
  });

  if (!user) {
    return [];
  }

  // Define the type for habits with completed array
  const dueHabits: Array<(typeof user.habits)[number]> = [];
  const today = new Date();

  // Check each habit's last completion
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

  return dueHabits;
}

// Helper function to send push notification
export async function sendPushNotification(
  subscription: any,
  dueHabits: any[]
) {
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

// Helper function to send a test notification
export async function sendTestNotification(subscription: any, message: string) {
  const webpushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
  };

  const payload = JSON.stringify({
    title: "Test Notification",
    body: message,
    icon: "/logo.png",
    badge: "/logo.png",
    tag: "test-notification",
    data: {
      url: "/",
      test: true,
    },
  });

  try {
    await webpush.sendNotification(webpushSubscription, payload);
  } catch (error) {
    console.error("Error sending test notification:", error);
    throw error;
  }
}
