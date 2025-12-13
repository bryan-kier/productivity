import type { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';

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

    // Verify the JWT token using Supabase's built-in verification
    try {
      // Use Supabase's getUser method which handles all token verification automatically
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      
      if (error || !user) {
        res.status(401).json({ error: 'Unauthorized: Invalid token' });
        return;
      }

      // Extract user info
      const userId = user.id;
      if (!userId || typeof userId !== 'string') {
        res.status(401).json({ error: 'Unauthorized: Invalid token payload' });
        return;
      }

      // Attach user to request object
      req.user = {
        id: userId,
        email: user.email,
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
