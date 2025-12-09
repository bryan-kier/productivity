import type { VercelRequest, VercelResponse } from "@vercel/node";
import { storage } from "../storage.js";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  // Verify this is a cron request from Vercel
  // Vercel Cron sends a special header, but for security, you can also check CRON_SECRET
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    await storage.resetWeeklyTasks();
    res.json({ 
      message: "Weekly tasks refreshed",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: "Failed to refresh weekly tasks",
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

