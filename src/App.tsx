
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import History from "./pages/History";
import RssSources from "./pages/RssSources";
import { AuthRoute } from "./components/AuthRoute";
import { useEffect } from "react";
import { ensureUserProfile } from "@/services/supabaseClient";
import { supabase } from "@/integrations/supabase/client";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Check if user is logged in and ensure profile exists
    const checkAuthAndEnsureProfile = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        await ensureUserProfile();
      }
    };
    
    checkAuthAndEnsureProfile();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* נתיבים פתוחים (ללא אימות נדרש) */}
            <Route path="/auth" element={<Auth />} />
            
            {/* נתיבים מוגנים (דורשים אימות) */}
            <Route element={<AuthRoute />}>
              <Route path="/" element={<Index />} />
              <Route path="/history" element={<History />} />
              <Route path="/rss" element={<RssSources />} />
            </Route>
            
            {/* נתיב עבור דף שגיאה 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
