import cron from "node-cron";
import { storage } from "./storage";
import { db } from "./db";
import { tasks } from "../shared/schema";
import { eq } from "drizzle-orm";

export function initializeScheduler() {
  cron.schedule("0 7 * * *", async () => {
    try {
      // Get all distinct user IDs that have daily tasks
      const allTasks = await db
        .select({ userId: tasks.userId })
        .from(tasks)
        .where(eq(tasks.refreshType, "daily"));
      
      // Get unique user IDs
      const userIds = [...new Set(allTasks.map(t => t.userId))];
      
      // Reset daily tasks for each user
      for (const userId of userIds) {
        await storage.resetDailyTasks(userId);
      }
    } catch (error) {
      console.error("Failed to refresh daily tasks:", error);
    }
  }, {
    timezone: "Asia/Singapore"
  });
  
  cron.schedule("0 7 * * 0", async () => {
    try {
      // Get all distinct user IDs that have weekly tasks
      const allTasks = await db
        .select({ userId: tasks.userId })
        .from(tasks)
        .where(eq(tasks.refreshType, "weekly"));
      
      // Get unique user IDs
      const userIds = [...new Set(allTasks.map(t => t.userId))];
      
      // Reset weekly tasks for each user
      for (const userId of userIds) {
        await storage.resetWeeklyTasks(userId);
      }
    } catch (error) {
      console.error("Failed to refresh weekly tasks:", error);
    }
  }, {
    timezone: "Asia/Singapore"
  });
}
