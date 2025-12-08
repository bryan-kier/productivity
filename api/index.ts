import "dotenv/config";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import express from "express";
import { registerRoutes } from "./routes.js";

// Initialize Express app (singleton pattern for Vercel)
let app: express.Express | null = null;
let dbInitialized = false;

async function getApp(): Promise<express.Express> {
  if (app) return app;

  app = express();

  // CORS middleware
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    // Allow requests from same origin (Vercel deployment)
    if (origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    } else {
      res.setHeader("Access-Control-Allow-Origin", "*");
    }
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  // Middleware
  app.use(
    express.json({
      verify: (req, _res, buf) => {
        (req as any).rawBody = buf;
      },
    }),
  );
  app.use(express.urlencoded({ extended: false }));

  // Test database connection on first initialization (for serverless)
  if (!dbInitialized) {
    try {
      const { initializeDatabase } = await import("../server/db");
      await initializeDatabase();
      dbInitialized = true;
    } catch (error) {
      console.error("Database initialization failed:", error);
      // Don't throw here - let the health endpoint report the issue
      // Some serverless functions may not need DB access immediately
    }
  }

  // Register all routes (API routes only - static files handled by Vercel)
  await registerRoutes(null, app);

  return app;
}

// Export the Express app as a Vercel serverless function
export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  try {
    const expressApp = await getApp();
    
    // Convert Vercel request/response to Express format
    return new Promise<void>((resolve, reject) => {
      expressApp(req as any, res as any, (err?: any) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  } catch (error) {
    console.error("API handler error:", error);
    res.status(500).json({ 
      error: "Internal server error",
      message: error instanceof Error ? error.message : String(error)
    });
  }
}

