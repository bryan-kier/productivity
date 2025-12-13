import type { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import 'dotenv/config';

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
      // Only log in development or when debugging
      if (process.env.NODE_ENV === 'development') {
        console.log('Authentication failed: No token provided for', req.path);
      }
      res.status(401).json({ error: 'Unauthorized: No token provided' });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the JWT token using Supabase's getUser method
    // This is the recommended way to verify Supabase JWT tokens
    try {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      
      if (error) {
        console.error('Token verification error:', error.message);
        res.status(401).json({ 
          error: 'Unauthorized: Invalid token',
          details: error.message 
        });
        return;
      }

      if (!user) {
        console.error('Token verification failed: No user found');
        res.status(401).json({ error: 'Unauthorized: Invalid token - no user found' });
        return;
      }

      // Extract user info
      const userId = user.id;
      if (!userId || typeof userId !== 'string') {
        console.error('Token verification failed: Invalid user ID', { userId });
        res.status(401).json({ error: 'Unauthorized: Invalid token payload' });
        return;
      }

      // Attach user to request object
      req.user = {
        id: userId,
        email: user.email,
      };

      // Only log errors, not successful authentications (too verbose)
      // Uncomment the line below for debugging if needed:
      // console.log(`Authenticated user: ${userId} (${user.email || 'no email'})`);

      next();
    } catch (jwtError) {
      // JWT verification failed (invalid signature, expired, etc.)
      console.error('JWT verification error:', jwtError);
      res.status(401).json({ 
        error: 'Unauthorized: Invalid token',
        details: jwtError instanceof Error ? jwtError.message : String(jwtError)
      });
      return;
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ 
      error: 'Unauthorized: Authentication failed',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
