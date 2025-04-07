import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendDueHabitsNotifications } from "../lib/cronJobs";

/**
 * Cron job API endpoint for daily habit notifications
 * This will be triggered by Vercel's cron job scheduler
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Check if request came from Vercel Cron
  const userAgent = req.headers["user-agent"] || "";
  const isVercelCron = userAgent.includes("vercel-cron");

  // In production, only allow request from Vercel Cron
  if (process.env.NODE_ENV === "production" && !isVercelCron) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Run the notification job
    const result = await sendDueHabitsNotifications();
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Cron job error:", error);
    return res.status(500).json({
      error: "Failed to process notifications",
      message: error.message || "Unknown error",
    });
  }
}
