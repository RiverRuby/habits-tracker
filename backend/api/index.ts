import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { nanoid } from "nanoid";
import webpush from "web-push";
import { sendDueHabitsNotifications } from "../lib/cronJobs";
import {
  getHabitsNotCompletedInLast2Days,
  sendTestNotification,
  sendPushNotification,
} from "../lib/notifications";

const app = express();
const prisma = new PrismaClient();

// Configure web-push
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY || "",
  privateKey: process.env.VAPID_PRIVATE_KEY || "",
};

webpush.setVapidDetails(
  "mailto:" + (process.env.VAPID_EMAIL || "example@example.com"),
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// Middleware
app.use(cors());
app.use(express.json());

// Authentication middleware
const authenticate = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const userId = req.headers.authorization;

  if (!userId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  req.body.userId = userId;
  next();
};

// Routes
app.get("/", (_, res) => {
  res.send("Habits Tracker API is running!");
});

// Find users endpoint to help testing
app.get("/find-users", async (req, res) => {
  try {
    // Get all users with push subscriptions
    const users = await prisma.user.findMany({
      select: {
        id: true,
        created: true,
        habits: {
          select: {
            name: true,
          },
        },
        pushSubscription: {
          select: {
            id: true,
            createdAt: true,
          },
        },
      },
      take: 10,
      orderBy: {
        created: "desc",
      },
    });

    return res.send(`
      <html>
        <head>
          <title>Find Users for Testing</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 900px; margin: 0 auto; padding: 20px; }
            h1 { color: #333; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f2f2f2; }
            tr:hover { background-color: #f5f5f5; }
            .hasNotification { color: green; }
            .noNotification { color: red; }
            .button { display: inline-block; padding: 8px 16px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; }
          </style>
        </head>
        <body>
          <h1>Users for Notification Testing</h1>
          <p>Click on a user's ID to send a test notification:</p>
          
          <table>
            <thead>
              <tr>
                <th>User ID</th>
                <th>Notifications</th>
                <th>Habits</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${users
                .map(
                  (user) => `
                <tr>
                  <td><code>${user.id}</code></td>
                  <td class="${
                    user.pushSubscription ? "hasNotification" : "noNotification"
                  }">
                    ${user.pushSubscription ? "✅ Enabled" : "❌ Not enabled"}
                  </td>
                  <td>${
                    user.habits.map((h) => h.name).join(", ") || "No habits"
                  }</td>
                  <td>${new Date(user.created).toLocaleString()}</td>
                  <td>
                    ${
                      user.pushSubscription
                        ? `<a href="/test-notification/${user.id}?message=Test notification" class="button">Send Test</a>`
                        : "Enable notifications in app first"
                    }
                  </td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
          
          <p><strong>Note:</strong> Users must have enabled notifications in the app before testing.</p>
        </body>
      </html>
    `);
  } catch (error: any) {
    console.error("Error finding users:", error);
    return res.status(500).send(`Error: ${error.message || "Unknown error"}`);
  }
});

// Testing endpoint to trigger notifications for a specific user
// Usage: /test-notification/{userId}?message=Your custom message
app.get("/test-notification/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const customMessage =
      (req.query.message as string) || "This is a test notification";

    if (!userId) {
      return res
        .status(400)
        .send("Missing user ID. Use /test-notification/{userId}");
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        pushSubscription: true,
        habits: { include: { completed: true } },
      },
    });

    if (!user) {
      return res.status(404).send(`User with ID ${userId} not found`);
    }

    if (!user.pushSubscription) {
      return res
        .status(404)
        .send(
          `No push subscription found for user ${userId}. Please enable notifications in the app first.`
        );
    }

    // Send test notification
    await sendTestNotification(user.pushSubscription, customMessage);

    return res.send(`
      <html>
        <head>
          <title>Test Notification Sent</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
            .success { color: green; font-weight: bold; }
            .info { background: #f0f0f0; padding: 10px; border-radius: 5px; }
          </style>
        </head>
        <body>
          <h1>Test Notification Sent</h1>
          <p class="success">✅ Notification has been sent successfully!</p>
          <div class="info">
            <p><strong>User ID:</strong> ${userId}</p>
            <p><strong>Message:</strong> ${customMessage}</p>
            <p><strong>Subscription endpoint:</strong> ${user.pushSubscription.endpoint.substring(
              0,
              50
            )}...</p>
          </div>
          <p>If you don't receive the notification:</p>
          <ul>
            <li>Make sure notifications are enabled in your browser</li>
            <li>Check that you subscribed to notifications in the app</li>
            <li>Try refreshing the app and enabling notifications again</li>
          </ul>
          <p><a href="/test-notification/${userId}?message=Another test message">Send another test notification</a></p>
          <p><a href="/find-users">← Back to user list</a></p>
        </body>
      </html>
    `);
  } catch (error: any) {
    console.error("Error sending test notification:", error);
    return res.status(500).send(`
      <html>
        <head>
          <title>Test Notification Error</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
            .error { color: red; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Test Notification Error</h1>
          <p class="error">❌ Failed to send notification</p>
          <p>Error: ${error.message || "Unknown error"}</p>
          <p>Please check the console logs for more details.</p>
          <p><a href="/find-users">← Back to user list</a></p>
        </body>
      </html>
    `);
  }
});

// Admin endpoint to manually trigger notifications
// This should be protected in a real app
app.post("/admin/trigger-notifications", async (_, res) => {
  try {
    const result = await sendDueHabitsNotifications();
    return res.json(result);
  } catch (error: any) {
    console.error("Error triggering notifications:", error);
    return res.status(500).json({ error: error.message || "Unknown error" });
  }
});

// Get the VAPID public key
app.get("/push/vapidPublicKey", (_, res) => {
  res.json({ publicKey: vapidKeys.publicKey });
});

// Subscribe to push notifications
app.post("/push/subscribe", authenticate, async (req, res) => {
  try {
    const { userId, subscription } = req.body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ message: "Invalid subscription" });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if subscription already exists for this endpoint
    const existingSubscription = await prisma.pushSubscription.findUnique({
      where: { endpoint: subscription.endpoint },
    });

    if (existingSubscription) {
      // Update existing subscription
      await prisma.pushSubscription.update({
        where: { id: existingSubscription.id },
        data: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          userId: userId,
        },
      });
    } else {
      // Create new subscription
      await prisma.pushSubscription.create({
        data: {
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          userId: userId,
        },
      });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error("Error subscribing to push notifications:", error);
    return res
      .status(500)
      .json({ message: "Failed to subscribe to push notifications" });
  }
});

// Unsubscribe from push notifications
app.post("/push/unsubscribe", authenticate, async (req, res) => {
  try {
    const { userId, endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({ message: "Endpoint is required" });
    }

    // Delete the subscription
    await prisma.pushSubscription.deleteMany({
      where: {
        endpoint,
        userId,
      },
    });

    return res.json({ success: true });
  } catch (error) {
    console.error("Error unsubscribing from push notifications:", error);
    return res
      .status(500)
      .json({ message: "Failed to unsubscribe from push notifications" });
  }
});

// Manually trigger notifications for habits not completed in the last 2 days
app.post("/push/notify-due-habits", authenticate, async (req, res) => {
  try {
    const { userId } = req.body;
    const dueHabits = await getHabitsNotCompletedInLast2Days(userId);

    if (dueHabits.length === 0) {
      return res.json({ message: "No habits due for notification" });
    }

    const subscription = await prisma.pushSubscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      return res
        .status(404)
        .json({ message: "No push subscription found for user" });
    }

    await sendPushNotification(subscription, dueHabits);
    return res.json({ success: true, habitsNotified: dueHabits.length });
  } catch (error) {
    console.error("Error sending push notifications:", error);
    return res
      .status(500)
      .json({ message: "Failed to send push notifications" });
  }
});

// Get user's habits
app.get("/habits", authenticate, async (req, res) => {
  try {
    const { userId } = req.body;

    // Check if user exists, create if not
    let user = await prisma.user.findUnique({
      where: { id: userId },
      include: { habits: { include: { completed: true } } },
    });

    if (!user) {
      user = await prisma.user.create({
        data: { id: userId },
        include: { habits: { include: { completed: true } } },
      });
    }

    // Transform the habits data to match frontend expectations
    const transformedHabits = user.habits.map((habit) => ({
      id: habit.id,
      name: habit.name,
      created: habit.created.getTime(),
      completed: habit.completed.map((completion) => completion.day),
    }));

    // Return the response in the format expected by the frontend
    return res.json({
      id: user.id,
      created: user.created.getTime(),
      habits: transformedHabits,
    });
  } catch (error) {
    console.error("Error fetching habits:", error);
    return res.status(500).json({ message: "Failed to fetch habits" });
  }
});

// Create a new habit
app.post("/habits/create", authenticate, async (req, res) => {
  try {
    const { userId, name = "New Habit" } = req.body;

    // Check if user exists, create if not
    let user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      user = await prisma.user.create({
        data: { id: userId },
      });
    }

    // Create the new habit
    await prisma.habit.create({
      data: {
        id: nanoid(),
        name,
        userId,
      },
    });

    // Fetch all habits to return updated list
    const userWithHabits = await prisma.user.findUnique({
      where: { id: userId },
      include: { habits: { include: { completed: true } } },
    });

    if (!userWithHabits) {
      return res.status(404).json({ message: "User not found" });
    }

    // Transform the habits data
    const transformedHabits = userWithHabits.habits.map((habit) => ({
      id: habit.id,
      name: habit.name,
      created: habit.created.getTime(),
      completed: habit.completed.map((completion) => completion.day),
    }));

    // Return the response
    return res.json({
      id: userWithHabits.id,
      created: userWithHabits.created.getTime(),
      habits: transformedHabits,
    });
  } catch (error) {
    console.error("Error creating habit:", error);
    return res.status(500).json({ message: "Failed to create habit" });
  }
});

// Delete a habit
app.post("/habits/delete", authenticate, async (req, res) => {
  try {
    const { userId, id } = req.body;

    if (!id) {
      return res.status(400).json({ message: "Habit ID is required" });
    }

    // Delete the habit
    await prisma.habit.delete({
      where: { id },
    });

    // Fetch all habits to return updated list
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { habits: { include: { completed: true } } },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Transform the habits data
    const transformedHabits = user.habits.map((habit) => ({
      id: habit.id,
      name: habit.name,
      created: habit.created.getTime(),
      completed: habit.completed.map((completion) => completion.day),
    }));

    // Return the response
    return res.json({
      id: user.id,
      created: user.created.getTime(),
      habits: transformedHabits,
    });
  } catch (error) {
    console.error("Error deleting habit:", error);
    return res.status(500).json({ message: "Failed to delete habit" });
  }
});

// Rename a habit
app.post("/habits/rename", authenticate, async (req, res) => {
  try {
    const { userId, id, name } = req.body;

    if (!id || !name) {
      return res
        .status(400)
        .json({ message: "Habit ID and name are required" });
    }

    // Update the habit
    await prisma.habit.update({
      where: { id },
      data: { name },
    });

    // Fetch all habits to return updated list
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { habits: { include: { completed: true } } },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Transform the habits data
    const transformedHabits = user.habits.map((habit) => ({
      id: habit.id,
      name: habit.name,
      created: habit.created.getTime(),
      completed: habit.completed.map((completion) => completion.day),
    }));

    // Return the response
    return res.json({
      id: user.id,
      created: user.created.getTime(),
      habits: transformedHabits,
    });
  } catch (error) {
    console.error("Error renaming habit:", error);
    return res.status(500).json({ message: "Failed to rename habit" });
  }
});

// Log a habit completion
app.post("/habits/log", authenticate, async (req, res) => {
  try {
    const { userId, id, day } = req.body;

    if (!id || !day) {
      return res.status(400).json({ message: "Habit ID and day are required" });
    }

    // Check if the habit exists and belongs to the user
    const habit = await prisma.habit.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!habit) {
      return res.status(404).json({ message: "Habit not found" });
    }

    // Create the habit completion
    await prisma.habitCompletion.create({
      data: {
        day,
        habitId: id,
      },
    });

    return res.json({ success: true });
  } catch (error) {
    console.error("Error logging habit completion:", error);

    return res.status(500).json({ message: "Failed to log habit completion" });
  }
});

// Unlog a habit completion
app.post("/habits/unlog", authenticate, async (req, res) => {
  try {
    const { userId, id, day } = req.body;

    if (!id || !day) {
      return res.status(400).json({ message: "Habit ID and day are required" });
    }

    // Check if the habit exists and belongs to the user
    const habit = await prisma.habit.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!habit) {
      return res.status(404).json({ message: "Habit not found" });
    }

    // Delete the habit completion
    await prisma.habitCompletion.deleteMany({
      where: {
        habitId: id,
        day,
      },
    });

    return res.json({ success: true });
  } catch (error) {
    console.error("Error unlogging habit completion:", error);
    return res
      .status(500)
      .json({ message: "Failed to unlog habit completion" });
  }
});

// Start the server if not running in Vercel
if (process.env.NODE_ENV !== "production") {
  const port = process.env.PORT || 3001;
  app.listen(port, () => {
    console.log(`Habits Tracker API running on port ${port}`);
  });
}

// Export for Vercel serverless function
export default app;
