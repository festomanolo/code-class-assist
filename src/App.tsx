import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { supabaseService, type Profile } from "@/services/supabaseService";
import Index from "./pages/Index";
import Student from "./pages/Student";
import Teacher from "./pages/Teacher";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";

const queryClient = new QueryClient();

const App = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Load user profile
          try {
            const userProfile = await supabaseService.getProfile();
            setProfile(userProfile);
          } catch (error) {
            console.error('Error loading profile:', error);
            setProfile(null);
          }
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        try {
          const userProfile = await supabaseService.getProfile();
          setProfile(userProfile);
        } catch (error) {
          console.error('Error loading profile:', error);
          setProfile(null);
        }
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route 
              path="/" 
              element={
                !session ? <Auth /> :
                !profile ? <Auth /> :
                profile.user_type === 'student' ? <Navigate to="/student" replace /> :
                profile.user_type === 'teacher' ? <Navigate to="/teacher" replace /> :
                <Index />
              } 
            />
            <Route path="/auth" element={session && profile ? <Navigate to="/" replace /> : <Auth />} />
            <Route 
              path="/student" 
              element={
                !session || !profile ? <Auth /> :
                profile.user_type !== 'student' ? <Navigate to="/" replace /> :
                <Student />
              } 
            />
            <Route 
              path="/teacher" 
              element={
                !session || !profile ? <Auth /> :
                profile.user_type !== 'teacher' ? <Navigate to="/" replace /> :
                <Teacher />
              } 
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
