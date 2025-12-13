import type { VercelRequest, VercelResponse } from "@vercel/node";
import { storage } from "../storage.js";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  // Verify this is a cron request from Vercel
  // Vercel Cron sends a special header 'x-vercel-cron'
  const isVercelCron = req.headers['x-vercel-cron'] === '1';
  const authHeader = req.headers.authorization;
  
  // If CRON_SECRET is set, require it; otherwise, require Vercel header
  if (process.env.CRON_SECRET) {
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  } else if (!isVercelCron) {
    // If no CRON_SECRET is set, only allow requests from Vercel Cron
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Reset weekly tasks
    await storage.resetWeeklyTasks();
    
    // Delete tasks that have been completed for more than a week
    await storage.deleteOldCompletedTasks();
    
    res.json({ 
      message: "Weekly tasks refreshed and old completed tasks cleaned up",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: "Failed to refresh weekly tasks or clean up completed tasks",
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

