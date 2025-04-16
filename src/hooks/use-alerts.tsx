
import { useState, useEffect } from "react";
import { Alert, RSSItem } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { fetchRssFeeds } from "@/services/rssService";
import { 
  classifyAlerts, 
  classifyAlertsWithAI, 
  hasOpenAIApiKey 
} from "@/services/alertService";

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
      if (useAI && hasOpenAIApiKey()) {
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

  // Initialize AI state based on API key existence
  useEffect(() => {
    const hasApiKey = hasOpenAIApiKey();
    setUseAI(hasApiKey);
  }, []);

  // Initial load of alerts
  useEffect(() => {
    refreshAlerts(location);
  }, [location]);

  // Regular refresh of alerts
  useEffect(() => {
    const interval = setInterval(() => {
      if (!snoozeActive) {
        refreshAlerts(location);
      }
    }, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [location, snoozeActive]);

  return {
    alerts,
    loading,
    setLoading,
    error,
    useAI,
    setUseAI,
    refreshAlerts
  };
}
