
import { useState, useEffect } from "react";
import { Alert, RSSItem } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { fetchRssFeeds } from "@/services/rssService";
import { 
  classifyAlerts, 
  classifyAlertsWithAI
} from "@/services/alertService";
import { saveAlertsToHistory } from "@/services/history";
import { v4 as uuidv4 } from 'uuid';
import { supabase } from "@/integrations/supabase/client";
import { isPlatformNative } from "@/services/pushNotificationService";

export function useAlerts(location: string, snoozeActive: boolean) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const refreshAlerts = async (userLocation: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    console.log(`DEBUG: Starting alert refresh for location: ${userLocation}`);
    
    try {
      const rssItems = await fetchRssFeeds();
      console.log(`Fetched ${rssItems.length} RSS items`); 
      
      try {
        // Always use AI classification first
        console.log("Attempting AI classification...");
        const classifiedAlerts = await classifyAlertsWithAI(rssItems, userLocation);
        console.log(`AI classified ${classifiedAlerts.length} security events`);
        
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
        
        // Add unique IDs to all alerts if missing
        const alertsWithIds = classifiedAlerts.map(alert => {
          if (!alert.id) {
            return { ...alert, id: uuidv4() };
          }
          return alert;
        });
        
        // שמירת ההתראות להיסטוריה
        try {
          await saveAlertsToHistory(alertsWithIds);
        } catch (saveError) {
          console.error("שגיאה בשמירת התראה להיסטוריה:", saveError);
          // Continue even if history save fails
        }
        
        // Send push notifications for relevant alerts
        if (isPlatformNative()) {
          const user = await supabase.auth.getUser();
          const userId = user.data.user?.id;
          
          if (userId) {
            relevantAlerts.forEach(async (alert) => {
              try {
                await supabase.functions.invoke('send-notification', {
                  body: {
                    user_id: userId,
                    title: `התראה ב${alert.location}`,
                    body: alert.title,
                    data: { alert_id: alert.id }
                  }
                });
              } catch (pushError) {
                console.error('שגיאה בשליחת התראת Push:', pushError);
              }
            });
          }
        }
        
        setAlerts(alertsWithIds);
      } catch (error: any) {
        console.error("AI classification failed:", error);
        
        // Check for specific error message from Edge Function
        if (error.details && typeof error.details === 'string' && error.details.includes('API key')) {
          toast({
            title: "שגיאת סיווג AI",
            description: "מפתח ה-API של OpenAI לא מוגדר כראוי. אנא הגדר את המפתח בהגדרות Edge Function.",
            variant: "destructive"
          });
        } else {
          // General fallback notification
          toast({
            title: "שגיאה בסיווג AI",
            description: "המערכת עברה לסיווג מבוסס מילות מפתח",
            variant: "destructive"
          });
        }
        
        // Fall back to keyword classification
        console.log("Falling back to keyword classification...");
        const classifiedAlerts = classifyAlerts(rssItems, userLocation);
        console.log(`Fallback: Keyword classified ${classifiedAlerts.length} security events`);
        
        // Add unique IDs to all alerts if missing
        const alertsWithIds = classifiedAlerts.map(alert => {
          if (!alert.id) {
            return { ...alert, id: uuidv4() };
          }
          return alert;
        });
        
        // שמירת ההתראות להיסטוריה
        try {
          await saveAlertsToHistory(alertsWithIds);
        } catch (saveError) {
          console.error("שגיאה בשמירת התראה להיסטוריה:", saveError);
          // Continue even if history save fails
        }
        
        setAlerts(alertsWithIds);
      }
    } catch (error) {
      console.error("Error refreshing alerts:", error);
      setError("אירעה שגיאה בטעינת ההתראות");
      throw error; // Rethrow to allow RefreshButton to handle
    } finally {
      // Ensure loading state is always turned off after attempted refresh
      setLoading(false);
    }
  };

  // טעינת התראות בטעינת הדף
  useEffect(() => {
    console.log(`Location changed: ${location}, refreshing alerts...`);
    refreshAlerts(location).catch(err => {
      console.error("Error in initial alerts load:", err);
    });
  }, [location]);

  // רענון תקופתי של התראות
  useEffect(() => {
    const interval = setInterval(() => {
      if (!snoozeActive) {
        refreshAlerts(location).catch(err => {
          console.error("Error in periodic alerts refresh:", err);
        });
      }
    }, 60000); // רענון כל דקה

    return () => clearInterval(interval);
  }, [location, snoozeActive]);

  return {
    alerts,
    loading,
    setLoading,
    error,
    refreshAlerts
  };
}
