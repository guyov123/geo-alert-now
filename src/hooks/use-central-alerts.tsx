
import { useState, useEffect } from "react";
import { Alert } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// פונקציית עזר לנירמול שמות מיקומים
function normalizeLocation(location: string): string {
  if (!location) return "";
  
  let normalized = location.trim();
  normalized = normalized.replace(/[\u2010-\u2015\u2212\u23AF\uFE58\uFF0D\u002D\u05BE]/g, '-');
  normalized = normalized.replace(/\s+/g, ' ');
  normalized = normalized.toLowerCase();
  
  if (normalized.includes('תל אביב') || normalized.includes('ת"א') || normalized.includes('תל-אביב')) {
    return 'תל אביב-יפו';
  }
  
  return normalized;
}

// פונקציה משופרת לבדיקה אם המיקום רלוונטי למשתמש
function isLocationRelevant(location: string, userLocation: string): boolean {
  if (!location || !userLocation || location === "לא ידוע") {
    return false;
  }
  
  const normalizedLocation = normalizeLocation(location);
  const normalizedUserLocation = normalizeLocation(userLocation);
  
  console.log(`DEBUG: Checking relevance - Alert: "${normalizedLocation}" vs User: "${normalizedUserLocation}"`);
  
  // בדיקה ישירה לאחר נרמול
  if (normalizedLocation === normalizedUserLocation) {
    console.log("DEBUG: Direct match found after normalization");
    return true;
  }
  
  // רשימת מיקומים שייחשבו כרלוונטיים לכל המשתמשים
  const nationalLocations = ["ישראל", "כל הארץ", "המרכז", "הדרום", "הצפון", "גוש דן"];
  if (nationalLocations.some(loc => normalizedLocation.includes(normalizeLocation(loc)))) {
    console.log("DEBUG: National location match found");
    return true;
  }
  
  // רשימת מיקומים קרובים - יותר מגבילה ומדויקת
  const locationMap: Record<string, string[]> = {
    'תל אביב-יפו': ['רמת גן', 'גבעתיים', 'בני ברק', 'חולון', 'בת ים'],
    'ירושלים': ['מעלה אדומים', 'גבעת זאב'],
    'חיפה': ['קריות', 'טירת הכרמל'],
    'באר שבע': ['אופקים', 'נתיבות']
  };
  
  // בדיקה אם המיקום הוא חלק מאזור קרוב למיקום המשתמש
  for (const [area, nearby] of Object.entries(locationMap)) {
    const normalizedArea = normalizeLocation(area);
    if (normalizedUserLocation === normalizedArea) {
      if (nearby.some(place => normalizedLocation.includes(normalizeLocation(place)))) {
        console.log(`DEBUG: Nearby location match found: ${area} includes ${normalizedLocation}`);
        return true;
      }
    }
  }
  
  // בדיקת הכלה מגבילה יותר - רק אם מיקום ההתראה מכיל את מיקום המשתמש ויש אורך מינימלי
  if (normalizedLocation.includes(normalizedUserLocation) && normalizedUserLocation.length > 3) {
    console.log("DEBUG: Substring match found");
    return true;
  }
  
  console.log("DEBUG: No location match found");
  return false;
}

export function useCentralAlerts(location: string, snoozeActive: boolean) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const refreshAlerts = async (userLocation: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    console.log(`Fetching alerts from central database for location: ${userLocation}`);
    
    try {
      // Fetch alerts from the last 24 hours
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const { data: dbAlerts, error: fetchError } = await supabase
        .from('alerts')
        .select('*')
        .eq('is_security_event', true)
        .gte('created_at', yesterday)
        .order('timestamp', { ascending: false });
      
      if (fetchError) {
        console.error("Error fetching alerts:", fetchError);
        setError("אירעה שגיאה בטעינת ההתראות");
        return;
      }
      
      console.log(`Fetched ${dbAlerts?.length || 0} alerts from database`);
      
      // Convert database alerts to our Alert type and filter by relevance
      const convertedAlerts: Alert[] = (dbAlerts || []).map(dbAlert => ({
        id: dbAlert.id,
        title: dbAlert.title,
        description: dbAlert.description,
        location: dbAlert.location,
        timestamp: dbAlert.timestamp,
        isRelevant: isLocationRelevant(dbAlert.location, userLocation),
        source: dbAlert.source,
        link: dbAlert.link,
        isSecurityEvent: dbAlert.is_security_event,
        imageUrl: dbAlert.image_url
      }));
      
      const relevantAlerts = convertedAlerts.filter(alert => alert.isRelevant);
      console.log(`Found ${relevantAlerts.length} relevant alerts for location: ${userLocation}`);
      
      // Log detailed location matching for debugging
      convertedAlerts.forEach(alert => {
        console.log(`Alert: "${alert.title}" in "${alert.location}" - Relevant: ${alert.isRelevant}`);
      });
      
      setAlerts(convertedAlerts);
    } catch (error) {
      console.error("Error refreshing alerts:", error);
      setError("אירעה שגיאה בטעינת ההתראות");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // טעינת התראות בטעינת הדף
  useEffect(() => {
    console.log(`Location changed: ${location}, fetching alerts...`);
    refreshAlerts(location).catch(err => {
      console.error("Error in initial alerts load:", err);
    });
  }, [location]);

  // רענון תקופתי של התראות (כל 5 דקות)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!snoozeActive) {
        refreshAlerts(location).catch(err => {
          console.error("Error in periodic alerts refresh:", err);
        });
      }
    }, 5 * 60 * 1000); // רענון כל 5 דקות

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
