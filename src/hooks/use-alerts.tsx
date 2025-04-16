
import { useState, useEffect } from "react";
import { Alert, RSSItem } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { fetchRssFeeds } from "@/services/rssService";
import { 
  classifyAlerts, 
  classifyAlertsWithAI, 
  hasOpenAIApiKey 
} from "@/services/alertService";
import { hasOpenAIApiKey as hasSupabaseApiKey } from "@/services/supabaseClient";

export function useAlerts(location: string, snoozeActive: boolean) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [useAI, setUseAI] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const refreshAlerts = async (userLocation: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const rssItems = await fetchRssFeeds();
      console.log(`Fetched ${rssItems.length} RSS items`); 
      
      let classifiedAlerts;
      // בדיקה אם להשתמש ב-AI
      if (useAI) {
        try {
          classifiedAlerts = await classifyAlertsWithAI(rssItems, userLocation);
          console.log(`AI classified ${classifiedAlerts.length} security events`);
        } catch (error) {
          console.error("AI classification failed:", error);
          classifiedAlerts = classifyAlerts(rssItems, userLocation);
          console.log(`Keyword classified ${classifiedAlerts.length} security events`);
          
          // Show toast notification about falling back to keyword classification
          toast({
            title: "שגיאה בסיווג AI",
            description: "עברנו לסיווג מבוסס מילות מפתח",
            variant: "destructive"
          });
        }
      } else {
        classifiedAlerts = classifyAlerts(rssItems, userLocation);
        console.log(`Keyword classified ${classifiedAlerts.length} security events`);
      }
      
      setAlerts(classifiedAlerts);
    } catch (error) {
      console.error("Error refreshing alerts:", error);
      setError("אירעה שגיאה בטעינת ההתראות");
    } finally {
      // Ensure loading state is always turned off after attempted refresh
      setLoading(false);
    }
  };

  // פונקציה לבדיקת קיום מפתח API - תבדוק בסופהבייס וגם בלקוד לאחור
  const checkForApiKey = async () => {
    try {
      // תחילה ננסה לבדוק בסופהבייס
      const hasKey = await hasSupabaseApiKey();
      
      if (hasKey) {
        setUseAI(true);
        return;
      }
      
      // אם אין מפתח בסופהבייס, ננסה בלקוד לאחור
      const hasLocalKey = hasOpenAIApiKey();
      setUseAI(hasLocalKey);
    } catch (error) {
      console.error("Error checking for API key:", error);
      // במקרה של שגיאה, ננסה להשתמש באחסון מקומי
      const hasLocalKey = hasOpenAIApiKey();
      setUseAI(hasLocalKey);
    }
  };

  // בדיקת קיום מפתח API בטעינת הדף
  useEffect(() => {
    checkForApiKey();
  }, []);

  // טעינת התראות בטעינת הדף
  useEffect(() => {
    refreshAlerts(location);
  }, [location]);

  // רענון תקופתי של התראות
  useEffect(() => {
    const interval = setInterval(() => {
      if (!snoozeActive) {
        refreshAlerts(location);
      }
    }, 60000); // רענון כל דקה

    return () => clearInterval(interval);
  }, [location, snoozeActive]);

  return {
    alerts,
    loading,
    setLoading,
    error,
    useAI,
    setUseAI,
    refreshAlerts,
    checkForApiKey // מייצאים את הפונקציה כדי שאפשר יהיה לקרוא לה אחרי שינוי מפתח
  };
}
