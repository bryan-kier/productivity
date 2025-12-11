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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/c5e65bbc-2508-49ba-9666-5872d0495869',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:23',message:'AuthProvider initialized',data:{href:typeof window !== 'undefined' ? window.location.href : 'SSR',hash:typeof window !== 'undefined' ? window.location.hash : 'SSR'},timestamp:Date.now(),sessionId:'debug-session',runId:'oauth-debug',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/c5e65bbc-2508-49ba-9666-5872d0495869',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:28',message:'Initial session loaded',data:{hasSession:!!session,userId:session?.user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'oauth-debug',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/c5e65bbc-2508-49ba-9666-5872d0495869',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:37',message:'Auth state changed',data:{event,hasSession:!!session,userId:session?.user?.id,href:typeof window !== 'undefined' ? window.location.href : 'SSR'},timestamp:Date.now(),sessionId:'debug-session',runId:'oauth-debug',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
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
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/c5e65bbc-2508-49ba-9666-5872d0495869',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:72',message:'OAuth response received',data:{hasData:!!data,hasError:!!error,error:error?.message,url:data?.url,redirectUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'oauth-debug',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    if (error) {
      throw error;
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
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
