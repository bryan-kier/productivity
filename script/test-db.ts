#!/usr/bin/env tsx
/**
 * Database Connection Test Script
 * 
 * This script tests the database connection without starting the full server.
 * Run with: npm run test:db (add to package.json scripts) or tsx script/test-db.ts
 */

import "dotenv/config";
import { initializeDatabase, testConnection, pool } from "../server/db";

async function main() {
  console.log("🔍 Testing database connection...\n");

  try {
    // Test connection
    await initializeDatabase();
    
    // Test a simple query
    console.log("📊 Testing database query...");
    const result = await pool.query("SELECT version()");
    console.log("✅ Database query successful");
    console.log(`   PostgreSQL version: ${result.rows[0]?.version?.split(" ")[1] || "unknown"}\n`);
    
    // Test schema tables exist
    console.log("📋 Checking schema tables...");
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    const tables = tablesResult.rows.map(row => row.table_name);
    const expectedTables = ["users", "categories", "tasks", "subtasks", "notes"];
    const missingTables = expectedTables.filter(t => !tables.includes(t));
    
    if (missingTables.length > 0) {
      console.log("⚠️  Warning: Some expected tables are missing:");
      missingTables.forEach(table => console.log(`   - ${table}`));
      console.log("\n   Run: npm run db:push\n");
    } else {
      console.log("✅ All expected tables found:");
      tables.forEach(table => console.log(`   - ${table}`));
    }
    
    console.log("\n✅ Database connection test completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Database connection test failed!");
    console.error("\nError details:", error);
    console.error("\nTroubleshooting:");
    console.error("1. Verify DATABASE_URL environment variable is set");
    console.error("2. Check that the database server is running");
    console.error("3. Verify network connectivity to the database");
    console.error("4. Confirm database credentials are correct");
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
