import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../shared/schema.js";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure connection pool with sensible defaults
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  // Connection pool configuration
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
});

// Handle pool errors
pool.on("error", (err) => {
  console.error("Unexpected error on idle database client:", err);
});

// Test database connection
export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query("SELECT NOW()");
    client.release();
    return true;
  } catch (error) {
    console.error("Database connection test failed:", error);
    return false;
  }
}

// Initialize database connection on startup
export async function initializeDatabase(): Promise<void> {
  console.log("🔌 Testing database connection...");
  const isConnected = await testConnection();
  
  if (!isConnected) {
    console.error("❌ ERROR: Failed to connect to database");
    console.error("   Please verify your DATABASE_URL is correct and the database is accessible");
    throw new Error("Database connection failed");
  }
  
  console.log("✅ Database connection successful");
}

export const db = drizzle(pool, { schema });
