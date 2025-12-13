import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Settings from "@/pages/Settings";
import OfflineBanner from "@/components/OfflineBanner";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";

function Router() {
  const { user, loading } = useAuth();
  const [location] = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // If no user, always show login
  if (!user) {
    return <Login />;
  }

  // User is authenticated, show routes using component prop to prevent premature evaluation
  return (
    <Switch>
      <Route path="/settings" component={Settings} />
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <OfflineBanner />
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
