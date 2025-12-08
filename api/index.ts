import type { VercelRequest, VercelResponse } from "@vercel/node";
import express from "express";
import { registerRoutes } from "../server/routes";

// Initialize Express app (singleton pattern for Vercel)
let app: express.Express | null = null;

async function getApp(): Promise<express.Express> {
  if (app) return app;

  app = express();

  // Middleware
  app.use(
    express.json({
      verify: (req, _res, buf) => {
        (req as any).rawBody = buf;
      },
    }),
  );
  app.use(express.urlencoded({ extended: false }));

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

