
import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/LoadingSpinner";

export const AuthRoute = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // בדיקת סשן נוכחי
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setIsAuthenticated(!!data.session);
    };
    
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
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
