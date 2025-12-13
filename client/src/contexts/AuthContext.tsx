import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Proactively refresh session if it's about to expire
      // This ensures the session stays valid for the full duration
      if (session && event === 'TOKEN_REFRESHED') {
        // Session was refreshed, update state
        const { data: { session: refreshedSession } } = await supabase.auth.getSession();
        if (refreshedSession) {
          setSession(refreshedSession);
          setUser(refreshedSession.user);
        }
      }
    });

    // Set up periodic session refresh to ensure tokens stay valid
    // Check every 5 minutes and refresh if needed
    const refreshInterval = setInterval(async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (currentSession) {
          // Check if token expires soon (within 5 minutes)
          // expires_at is in seconds since epoch
          const expiresAt = currentSession.expires_at;
          if (expiresAt) {
            const now = Math.floor(Date.now() / 1000);
            const expiresIn = expiresAt - now;
            // If token expires in less than 5 minutes, refresh it proactively
            if (expiresIn < 300 && expiresIn > 0) {
              const { data: { session: refreshedSession }, error } = await supabase.auth.refreshSession(currentSession);
              if (refreshedSession && !error) {
                setSession(refreshedSession);
                setUser(refreshedSession.user);
              }
            }
          }
        }
      } catch (error) {
        // Silently handle refresh errors - autoRefreshToken will handle it
        console.debug('Session refresh check failed:', error);
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => {
      subscription.unsubscribe();
      clearInterval(refreshInterval);
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { error };
  };

  const signInWithGoogle = async () => {
    // Use window.location.origin to get the full origin (protocol + host + port)
    const redirectUrl = window.location.origin;
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    
    if (error) {
      throw error;
    }
  };

  const signOut = async () => {
    // Clear all Supabase session data (tokens, refresh tokens, etc.)
    await supabase.auth.signOut();
    // Clear React Query cache to remove any cached data
    const { queryClient } = await import("@/lib/queryClient");
    queryClient.clear();
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}



