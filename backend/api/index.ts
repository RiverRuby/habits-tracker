import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import * as crypto from "crypto";
// import { GoogleGenAI } from "@google/genai";

// Simple ID generator (replacement for nanoid)
const nanoid = (size = 21) => crypto.randomBytes(size).toString('base64url').slice(0, size);

// Temporarily disable call service imports to debug module issues
// import {
//   initiateHabitCall,
//   handleCallWebhook,
//   checkScheduledCalls,
//   textToSpeech,
// } from "./callService";

// Placeholder functions
const initiateHabitCall = async (_userId: string) => ({ success: false, error: "Not configured" });
const handleCallWebhook = async (_event: any) => {};
const checkScheduledCalls = async () => {};
const textToSpeech = async (_text: string) => null;

const app = express();
const prisma = new PrismaClient();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
// Temporarily disabled for debugging
// const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const ai: any = null;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://habits.vivs.wiki',
    'https://habits-tracker-ten-gray.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
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

// Helper function to transform habits consistently
const transformHabit = (habit: any) => ({
  id: habit.id,
  name: habit.name,
  description: habit.description || null,
  theme: habit.theme || "ORANGE",
  emoji: habit.emoji || null,
  created: habit.created.getTime(),
  completed: habit.completed.map((completion: any) => completion.day),
  completionDetails: habit.completed.map((completion: any) => ({
    day: completion.day,
    notes: completion.notes || null,
  })),
});

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
    const transformedHabits = user.habits.map(transformHabit);

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
    const { userId, name = "New Habit", theme = "ORANGE" } = req.body;

    // Check if user exists, create if not
    let user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      user = await prisma.user.create({
        data: { id: userId },
      });
    }

    // Validate theme value
    const validThemes = ["ORANGE", "BLUE", "GREEN", "YELLOW"];
    const validTheme = validThemes.includes(theme) ? theme : "ORANGE";

    // Create the new habit
    await prisma.habit.create({
      data: {
        id: nanoid(),
        name,
        theme: validTheme,
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
    const transformedHabits = userWithHabits.habits.map(transformHabit);

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
    const transformedHabits = user.habits.map(transformHabit);

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
    const transformedHabits = user.habits.map(transformHabit);

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

// Update habit theme
app.post("/habits/update-theme", authenticate, async (req, res) => {
  try {
    const { userId, id, theme } = req.body;

    if (!id || !theme) {
      return res
        .status(400)
        .json({ message: "Habit ID and theme are required" });
    }

    // Validate theme value
    const validThemes = ["ORANGE", "BLUE", "GREEN", "YELLOW"];
    if (!validThemes.includes(theme)) {
      return res.status(400).json({ message: "Invalid theme value" });
    }

    // Update the habit theme
    await prisma.habit.update({
      where: { id },
      data: { theme },
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
    const transformedHabits = user.habits.map(transformHabit);

    // Return the response
    return res.json({
      id: user.id,
      created: user.created.getTime(),
      habits: transformedHabits,
    });
  } catch (error) {
    console.error("Error updating habit theme:", error);
    return res.status(500).json({ message: "Failed to update habit theme" });
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

// Parse natural language dates and log habit completions
app.post("/habits/log-natural", authenticate, async (req, res) => {
  try {
    const { userId, id, naturalDate } = req.body;

    if (!id || !naturalDate) {
      return res.status(400).json({
        message: "Habit ID and natural date description are required",
      });
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

    // Sanitize the natural language input
    const sanitizedInput = naturalDate
      .replace(/["\\]/g, "") // Remove quotes and backslashes
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Remove control characters
      .replace(/[^\x20-\x7E\s]/g, "") // Keep only printable ASCII and whitespace
      .trim();

    if (!sanitizedInput) {
      return res
        .status(400)
        .json({ message: "Invalid date description after sanitization" });
    }

    // Get today's date in a consistent format
    const today = new Date().toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    console.log(sanitizedInput);

    // Use Gemini to parse the natural language date
    const prompt = `Parse the following natural language date description into a JSON array of dates in the format "DDD, D MMM, YYYY" where DDD is the 3-letter day name and D is the day without leading zeros for days 1-9. For relative dates, use today (${today}) as the reference point. Example output format: ["Wed, 20 Mar, 2024", "Thu, 1 Apr, 2024"]. Natural language input: ${sanitizedInput}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });
    const text = response.text || "";
    console.log(text);

    let dates;
    try {
      // Remove markdown formatting if present
      const jsonText = text.replace(/^```json\n|\n```$/g, "").trim();
      dates = JSON.parse(jsonText);
      if (!Array.isArray(dates)) {
        throw new Error("Response is not an array");
      }

      // Validate each date string format
      const dateRegex = /^[A-Za-z]{3}, \d{1,2} [A-Za-z]{3}, \d{4}$/;
      const validDates = dates.every(
        (date) => typeof date === "string" && dateRegex.test(date)
      );
      if (!validDates) {
        throw new Error("Invalid date format in response");
      }
    } catch (error) {
      console.error("Failed to parse Gemini response:", error);
      return res
        .status(500)
        .json({ message: "Failed to parse natural language date" });
    }

    // Create habit completions for each date
    const completions = await Promise.all(
      dates.map(async (day) => {
        try {
          return await prisma.habitCompletion.create({
            data: {
              day,
              habitId: id,
            },
          });
        } catch (error: any) {
          // Skip if completion already exists
          if (error.code !== "P2002") {
            console.error("Error creating habit completion:", error);
          }
          return null;
        }
      })
    );

    return res.json({ success: true });
  } catch (error) {
    console.error("Error logging habit completion:", error);
    return res.status(500).json({ message: "Failed to log habit completion" });
  }
});

// Process voice transcript for habit identification and date extraction
app.post("/habits/process-voice", authenticate, async (req, res) => {
  try {
    const { userId, transcript } = req.body;

    if (!transcript) {
      return res.status(400).json({
        message: "Transcript is required",
      });
    }

    // Sanitize the transcript
    const sanitizedTranscript = transcript
      .replace(/["\\]/g, "") // Remove quotes and backslashes
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Remove control characters
      .replace(/[^\x20-\x7E\s]/g, "") // Keep only printable ASCII and whitespace
      .trim();

    if (!sanitizedTranscript) {
      return res
        .status(400)
        .json({ message: "Invalid transcript after sanitization" });
    }

    console.log(sanitizedTranscript);

    // Fetch user's existing habits for context
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { habits: true },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const existingHabits = user.habits.map((habit) => habit.name);
    const habitsContext =
      existingHabits.length > 0
        ? `User's existing habits: ${existingHabits.join(", ")}.`
        : "User doesn't have any existing habits yet.";

    // Get today's date in a consistent format
    const today = new Date().toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    // Use Gemini to analyze the voice transcript
    const prompt = `
      Analyze this voice transcript from a habit tracker app: "${sanitizedTranscript}"
      
      ${habitsContext}
      
      Extract the following information and return it as JSON:
      1. The habit mentioned (what activity the user is tracking)
      2. The date or time period when the user did/wants to do this habit
      
      Today's date for reference: ${today}
      
      If the transcript mentions or closely matches an existing habit, use that exact habit name.
      
      Return ONLY valid JSON in this exact format:
      {
        "habit": "specific habit name",
        "day": "specific date or time description"
      }
      
      For example, if the transcript is "I went for a run yesterday", return:
      {
        "habit": "run",
        "day": "yesterday"
      }
      
      Or if the transcript is "I want to read a book every Monday", return:
      {
        "habit": "read a book",
        "day": "every Monday"
      }
      
      Keep the habit name concise but descriptive. The date can be a specific date, day of week, or relative term.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    const text = response.text || "";
    console.log("Gemini response:", text);

    let result;
    try {
      // Remove markdown formatting if present
      const jsonText = text.replace(/^```json\n|\n```$/g, "").trim();
      result = JSON.parse(jsonText);

      if (!result.habit || !result.day) {
        throw new Error("Missing required fields in response");
      }
    } catch (error) {
      console.error("Failed to parse Gemini response:", error);
      return res
        .status(500)
        .json({ message: "Failed to process voice transcript" });
    }

    return res.json({
      success: true,
      result: {
        habit: result.habit,
        day: result.day,
      },
    });
  } catch (error) {
    console.error("Error processing voice transcript:", error);
    return res
      .status(500)
      .json({ message: "Failed to process voice transcript" });
  }
});

// Update habit details (description, emoji)
app.post("/habits/update-details", authenticate, async (req, res) => {
  try {
    const { userId, id, description, emoji } = req.body;

    if (!id) {
      return res.status(400).json({ message: "Habit ID is required" });
    }

    // Check if the habit exists and belongs to the user
    const habit = await prisma.habit.findFirst({
      where: { id, userId },
    });

    if (!habit) {
      return res.status(404).json({ message: "Habit not found" });
    }

    // Update the habit
    await prisma.habit.update({
      where: { id },
      data: {
        ...(description !== undefined && { description }),
        ...(emoji !== undefined && { emoji }),
      },
    });

    // Fetch all habits to return updated list
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { habits: { include: { completed: true } } },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const transformedHabits = user.habits.map(transformHabit);

    return res.json({
      id: user.id,
      created: user.created.getTime(),
      habits: transformedHabits,
    });
  } catch (error) {
    console.error("Error updating habit details:", error);
    return res.status(500).json({ message: "Failed to update habit details" });
  }
});

// Add/update notes for a habit completion
app.post("/habits/add-notes", authenticate, async (req, res) => {
  try {
    const { userId, habitId, day, notes } = req.body;

    if (!habitId || !day) {
      return res.status(400).json({ message: "Habit ID and day are required" });
    }

    // Check if the habit exists and belongs to the user
    const habit = await prisma.habit.findFirst({
      where: { id: habitId, userId },
    });

    if (!habit) {
      return res.status(404).json({ message: "Habit not found" });
    }

    // Update or create the completion with notes
    await prisma.habitCompletion.upsert({
      where: {
        habitId_day: { habitId, day },
      },
      update: { notes },
      create: { habitId, day, notes },
    });

    return res.json({ success: true });
  } catch (error) {
    console.error("Error adding notes:", error);
    return res.status(500).json({ message: "Failed to add notes" });
  }
});

// Get user settings (including call settings)
app.get("/user/settings", authenticate, async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      phone: user.phone,
      callEnabled: user.callEnabled,
      callTime: user.callTime,
      timezone: user.timezone,
    });
  } catch (error) {
    console.error("Error fetching user settings:", error);
    return res.status(500).json({ message: "Failed to fetch user settings" });
  }
});

// Update user settings (phone, call preferences)
app.post("/user/settings", authenticate, async (req, res) => {
  try {
    const { userId, phone, callEnabled, callTime, timezone } = req.body;

    await prisma.user.update({
      where: { id: userId },
      data: {
        ...(phone !== undefined && { phone }),
        ...(callEnabled !== undefined && { callEnabled }),
        ...(callTime !== undefined && { callTime }),
        ...(timezone !== undefined && { timezone }),
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    return res.json({
      phone: user?.phone,
      callEnabled: user?.callEnabled,
      callTime: user?.callTime,
      timezone: user?.timezone,
    });
  } catch (error) {
    console.error("Error updating user settings:", error);
    return res.status(500).json({ message: "Failed to update user settings" });
  }
});

// Initiate a call to the user
app.post("/calls/initiate", authenticate, async (req, res) => {
  try {
    const { userId } = req.body;

    const result = await initiateHabitCall(userId);

    if (result.success) {
      return res.json({ success: true, callId: result.callId });
    } else {
      return res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error("Error initiating call:", error);
    return res.status(500).json({ message: "Failed to initiate call" });
  }
});

// Webhook for Telnyx call events
app.post("/calls/webhook", async (req, res) => {
  try {
    await handleCallWebhook(req.body);
    return res.status(200).send("OK");
  } catch (error) {
    console.error("Error handling call webhook:", error);
    return res.status(500).send("Error");
  }
});

// Get call history
app.get("/calls/history", authenticate, async (req, res) => {
  try {
    const { userId } = req.body;

    const calls = await prisma.callLog.findMany({
      where: { userId },
      orderBy: { startedAt: "desc" },
      take: 20,
    });

    return res.json({ calls });
  } catch (error) {
    console.error("Error fetching call history:", error);
    return res.status(500).json({ message: "Failed to fetch call history" });
  }
});

// Generate TTS audio preview
app.post("/tts/preview", authenticate, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ message: "Text is required" });
    }

    const audioBuffer = await textToSpeech(text);

    if (!audioBuffer) {
      return res.status(500).json({ message: "Failed to generate audio" });
    }

    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Length": audioBuffer.length,
    });

    return res.send(audioBuffer);
  } catch (error) {
    console.error("Error generating TTS:", error);
    return res.status(500).json({ message: "Failed to generate audio" });
  }
});

// Start the server if not running in Vercel
if (process.env.NODE_ENV !== "production") {
  const port = process.env.PORT || 3001;
  app.listen(port, () => {
    console.log(`Habits Tracker API running on port ${port}`);

    // Start scheduled call checker (runs every minute)
    setInterval(checkScheduledCalls, 60000);
  });
}

// Export for Vercel serverless function
export default app;
