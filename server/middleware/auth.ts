import type { Request, Response, NextFunction } from 'express';
import { createRemoteJWKSet, jwtVerify } from 'jose';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
      };
    }
  }
}

// Get Supabase URL from environment
const supabaseUrl = process.env.VITE_SUPABASE_URL;
if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable');
}

// Create JWKS client (caches keys automatically)
const JWKS = createRemoteJWKSet(
  new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`)
);

export async function authenticateUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized: No token provided' });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the JWT token locally (no network call)
    try {
      const { payload } = await jwtVerify(token, JWKS, {
        issuer: `${supabaseUrl}/auth/v1`,
      });

      // Check if token is expired
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        res.status(401).json({ error: 'Unauthorized: Token expired' });
        return;
      }

      // Extract user info from JWT payload
      const userId = payload.sub;
      if (!userId || typeof userId !== 'string') {
        res.status(401).json({ error: 'Unauthorized: Invalid token payload' });
        return;
      }

      // Attach user to request object
      req.user = {
        id: userId,
        email: payload.email as string | undefined,
      };

      next();
    } catch (jwtError) {
      // JWT verification failed (invalid signature, expired, etc.)
      res.status(401).json({ error: 'Unauthorized: Invalid token' });
      return;
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Unauthorized: Authentication failed' });
  }
}
