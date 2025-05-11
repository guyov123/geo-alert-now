
import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ensureUserProfile } from "@/services/supabaseClient";

export const AuthRoute = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // בדיקת סשן נוכחי
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      const isAuth = !!data.session;
      setIsAuthenticated(isAuth);
      
      // If user is authenticated, ensure they have a profile
      if (isAuth) {
        await ensureUserProfile();
      }
    };
    
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const isAuth = !!session;
      setIsAuthenticated(isAuth);
      
      // If user logged in or token refreshed, ensure profile
      if (isAuth && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        ensureUserProfile();
      }
    });
    
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // מציג מסך טעינה בזמן בדיקת האימות
  if (isAuthenticated === null) {
    return <LoadingSpinner message="בודק מצב התחברות..." />;
  }

  // אם המשתמש לא מאומת, הפנייה לעמוד ההתחברות
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // אם המשתמש מאומת, אפשר להמשיך לנתיב המבוקש
  return <Outlet />;
};
