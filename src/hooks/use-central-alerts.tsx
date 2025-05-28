
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

// פונקציה לבדיקה אם המיקום רלוונטי למשתמש
function isLocationRelevant(location: string, userLocation: string): boolean {
  if (!location || !userLocation) return false;
  
  const normalizedLocation = normalizeLocation(location);
  const normalizedUserLocation = normalizeLocation(userLocation);
  
  // בדיקה ישירה לאחר נרמול
  if (normalizedLocation === normalizedUserLocation) {
    return true;
  }
  
  // רשימת מיקומים שייחשבו כרלוונטיים לכל המשתמשים
  const nationalLocations = ["ישראל", "כל הארץ", "המרכז", "הדרום", "הצפון", "גוש דן"];
  if (nationalLocations.some(loc => normalizedLocation.includes(normalizeLocation(loc)))) {
    return true;
  }
  
  // רשימת מיקומים קרובים
  const locationMap = {
    'תל אביב-יפו': ['רמת גן', 'גבעתיים', 'בני ברק', 'חולון', 'בת ים', 'רמת השרון', 'הרצליה'],
    'ירושלים': ['מעלה אדומים', 'גבעת זאב', 'בית שמש'],
    'חיפה': ['קריות', 'טירת הכרמל', 'נשר'],
    'באר שבע': ['אופקים', 'נתיבות', 'רהט', 'דימונה']
  };
  
  for (const [area, nearby] of Object.entries(locationMap)) {
    const normalizedArea = normalizeLocation(area);
    if (normalizedUserLocation === normalizedArea) {
      if (nearby.some(place => normalizedLocation.includes(normalizeLocation(place)))) {
        return true;
      }
    }
  }
  
  // בדיקת הכלה
  if (normalizedLocation.includes(normalizedUserLocation) || normalizedUserLocation.includes(normalizedLocation)) {
    return true;
  }
  
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
