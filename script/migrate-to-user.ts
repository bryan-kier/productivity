import "dotenv/config";
import { initializeDatabase, pool } from "../server/db.js";

async function migrateDataToUser(userId: string) {
  try {
    console.log("Initializing database connection...");
    await initializeDatabase();

    console.log(`\nMigrating all data to user: ${userId}\n`);

    // Use raw SQL queries since we're migrating existing data
    const client = await pool.connect();

    try {
      // Migrate categories
      const categoriesResult = await client.query(
        `UPDATE categories SET user_id = $1 WHERE user_id IS NULL OR user_id = ''`,
        [userId]
      );
      console.log(`✓ Updated ${categoriesResult.rowCount || 0} categories`);

      // Migrate tasks
      const tasksResult = await client.query(
        `UPDATE tasks SET user_id = $1 WHERE user_id IS NULL OR user_id = ''`,
        [userId]
      );
      console.log(`✓ Updated ${tasksResult.rowCount || 0} tasks`);

      // Migrate notes
      const notesResult = await client.query(
        `UPDATE notes SET user_id = $1 WHERE user_id IS NULL OR user_id = ''`,
        [userId]
      );
      console.log(`✓ Updated ${notesResult.rowCount || 0} notes`);

      // Migrate announcements
      const announcementsResult = await client.query(
        `UPDATE announcements SET user_id = $1 WHERE user_id IS NULL OR user_id = ''`,
        [userId]
      );
      console.log(`✓ Updated ${announcementsResult.rowCount || 0} announcements`);

      console.log("\n✅ Migration completed successfully!");
      console.log("All existing data has been assigned to your user account.");
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("❌ Migration failed:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Stack:", error.stack);
    }
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

// Get user ID from command line argument
const userId = process.argv[2];

if (!userId) {
  console.error("❌ Error: User ID is required");
  console.log("\nUsage: npm run migrate-to-user <your-supabase-user-id>");
  console.log("\nTo find your user ID:");
  console.log("1. Go to your Supabase dashboard");
  console.log("2. Navigate to Authentication > Users");
  console.log("3. Copy the UUID from your user account");
  process.exit(1);
}

// Validate UUID format (basic check)
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
if (!uuidRegex.test(userId)) {
  console.error("❌ Error: Invalid user ID format. Expected a UUID.");
  console.log("Example: 123e4567-e89b-12d3-a456-426614174000");
  process.exit(1);
}

migrateDataToUser(userId);
