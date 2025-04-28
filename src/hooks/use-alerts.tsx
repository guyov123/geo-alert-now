
import { useState, useEffect } from "react";
import { Alert, RSSItem } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { fetchRssFeeds } from "@/services/rssService";
import { 
  classifyAlerts, 
  classifyAlertsWithAI, 
  hasLocalApiKey
} from "@/services/alertService";
import { saveAlertsToHistory } from "@/services/historyService";

export function useAlerts(location: string, snoozeActive: boolean) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [useAI, setUseAI] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const refreshAlerts = async (userLocation: string) => {
    setLoading(true);
    setError(null);
    
    console.log(`DEBUG: Starting alert refresh for location: ${userLocation}`);
    
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
      
      // הדפסה לדיבאג של התראות רלוונטיות
      const relevantAlerts = classifiedAlerts.filter(alert => alert.isRelevant);
      console.log(`Found ${relevantAlerts.length} relevant alerts for location: ${userLocation}`);
      console.log("DEBUG: User location after normalization for comparison:", userLocation);
      relevantAlerts.forEach(alert => {
        console.log(`DEBUG: Relevant alert: "${alert.title}" | Location: ${alert.location}`);
      });
      
      // פירוט מלא של ההתראות לדיבאג
      classifiedAlerts.forEach(alert => {
        console.log(`DEBUG: Alert "${alert.title}" | Location: ${alert.location} | Relevant: ${alert.isRelevant}`);
      });
      
      // שמירת ההתראות להיסטוריה
      saveAlertsToHistory(classifiedAlerts);
      
      setAlerts(classifiedAlerts);
    } catch (error) {
      console.error("Error refreshing alerts:", error);
      setError("אירעה שגיאה בטעינת ההתראות");
    } finally {
      // Ensure loading state is always turned off after attempted refresh
      setLoading(false);
    }
  };

  // פונקציה לבדיקת קיום מפתח API
  const checkForApiKey = async () => {
    try {
      // בדיקה פשוטה האם קיים מפתח מקומי
      const hasKey = hasLocalApiKey();
      setUseAI(hasKey);
    } catch (error) {
      console.error("Error checking for API key:", error);
      setUseAI(false);
    }
  };

  // בדיקת קיום מפתח API בטעינת הדף
  useEffect(() => {
    checkForApiKey();
  }, []);

  // טעינת התראות בטעינת הדף
  useEffect(() => {
    console.log(`Location changed: ${location}, refreshing alerts...`);
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
