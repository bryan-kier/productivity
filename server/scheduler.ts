import cron from "node-cron";
import { storage } from "./storage";

export function initializeScheduler() {
  console.log("Initializing task refresh scheduler...");
  
  cron.schedule("0 7 * * *", async () => {
    console.log("Running daily task refresh at 7:00 AM SGT");
    try {
      await storage.resetDailyTasks();
      console.log("Daily tasks refreshed successfully");
    } catch (error) {
      console.error("Failed to refresh daily tasks:", error);
    }
  }, {
    timezone: "Asia/Singapore"
  });
  
  cron.schedule("0 7 * * 0", async () => {
    console.log("Running weekly task refresh on Sunday at 7:00 AM SGT");
    try {
      await storage.resetWeeklyTasks();
      console.log("Weekly tasks refreshed successfully");
    } catch (error) {
      console.error("Failed to refresh weekly tasks:", error);
    }
  }, {
    timezone: "Asia/Singapore"
  });
  
  console.log("Scheduler initialized: Daily tasks refresh at 7:00 AM SGT, Weekly tasks refresh on Sundays at 7:00 AM SGT");
}
