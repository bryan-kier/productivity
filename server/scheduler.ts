import cron from "node-cron";
import { storage } from "./storage";

export function initializeScheduler() {
  cron.schedule("0 7 * * *", async () => {
    try {
      await storage.resetDailyTasks();
    } catch {
      // Failed to refresh daily tasks
    }
  }, {
    timezone: "Asia/Singapore"
  });
  
  cron.schedule("0 7 * * 0", async () => {
    try {
      await storage.resetWeeklyTasks();
    } catch {
      // Failed to refresh weekly tasks
    }
  }, {
    timezone: "Asia/Singapore"
  });
}
