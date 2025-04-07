import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { nanoid } from "nanoid";

const app = express();
const prisma = new PrismaClient();

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
