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
    // Reset weekly tasks
    await storage.resetWeeklyTasks();
    
    // Delete tasks that have been completed for more than a week
    await storage.deleteOldCompletedTasks();
    
    // Delete subtasks that have been completed for more than a week
    await storage.deleteOldCompletedSubtasks();
    
    res.json({ 
      message: "Weekly tasks refreshed and old completed tasks/subtasks cleaned up",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: "Failed to refresh weekly tasks or clean up completed tasks",
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

