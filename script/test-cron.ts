import "dotenv/config";
import { storage } from "../api/storage.js";

async function testResetDaily() {
  try {
    await storage.resetDailyTasks();
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ✅ Daily tasks reset successful`);
  } catch (error) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ❌ Daily tasks reset failed:`, error instanceof Error ? error.message : String(error));
  }
}

async function testResetWeekly() {
  try {
    await storage.resetWeeklyTasks();
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ✅ Weekly tasks reset successful`);
  } catch (error) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ❌ Weekly tasks reset failed:`, error instanceof Error ? error.message : String(error));
  }
}

async function runTests() {
  console.log("Starting cron job test - calling reset functions every minute...");
  console.log("Press Ctrl+C to stop\n");
  
  // Call immediately
  console.log("Initial call...");
  await testResetDaily();
  await testResetWeekly();
  
  // Then call every minute
  setInterval(async () => {
    console.log("\n--- Minute interval ---");
    await testResetDaily();
    await testResetWeekly();
  }, 60000); // 60 seconds
}

runTests().catch(console.error);

