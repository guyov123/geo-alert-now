import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { getCurrentLocation, reverseGeocode } from "@/services/locationService";
import { updateUserLocation, getUserLocation } from "@/services/supabaseClient";
import { supabase } from "@/integrations/supabase/client";

// פונקציה לנרמול שמות מיקומים
const normalizeLocationName = (location: string): string => {
  // בדיקה אם המחרוזת ריקה
  if (!location) return "לא ידוע";
  
  // המרה למחרוזת בסיסית
  let normalized = location.trim();
  
  // החלפת כל סוגי המקפים לאחיד (מקף רגיל)
  normalized = normalized.replace(/[\u2010-\u2015\u2212\u23AF\uFE58\uFF0D\u002D\u05BE]/g, '-');
  
  // הסרת רווחים מיותרים
  normalized = normalized.replace(/\s+/g, ' ');
  
  // המרה לאותיות קטנות לצורך השוואה
  const locationLower = normalized.toLowerCase();
  
  // טיפול במקרים מיוחדים של תל אביב
  if (locationLower.includes('תל אביב') || locationLower.includes('ת"א') || locationLower.includes('תל-אביב')) {
    return 'תל אביב-יפו'; // נרמול לשם הרשמי של העיר
  }
  
  // החזרת המחרוזת המקורית אם לא נמצאה התאמה מיוחדת
  return normalized;
};

export function useLocation() {
  const [location, setLocation] = useState<string>("טוען...");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();

  const saveLocationHistory = async (lat: number, lng: number, city: string) => {
    try {
      const { error } = await supabase
        .from('location_history')
        .insert([
          { 
            latitude: lat,
            longitude: lng,
            city: city,
            user_id: (await supabase.auth.getUser()).data.user?.id
          }
        ]);

      if (error) {
        console.error("Error saving location history:", error);
      }
    } catch (error) {
      console.error("Error in saveLocationHistory:", error);
    }
  };

  const handleLocationChange = async (newLocation: string) => {
    if (!newLocation || newLocation.trim() === "") {
      toast({
        title: "שגיאה בעדכון מיקום",
        description: "המיקום שהוזן אינו תקין",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      // נרמול המיקום
      const normalizedLocation = normalizeLocationName(newLocation);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        try {
          await updateUserLocation(normalizedLocation);
          toast({
            title: "המיקום עודכן",
            description: `המיקום שלך עודכן ל${normalizedLocation}`,
          });
        } catch (error) {
          console.error("Error updating location in Supabase:", error);
          toast({
            title: "שגיאה בעדכון מיקום",
            description: "לא ניתן לעדכן את המיקום בשרת. המיקום נשמר מקומית בלבד.",
            variant: "destructive"
          });
        }
      }
      
      setLocation(normalizedLocation);
    } catch (error) {
      console.error("Error in handleLocationChange:", error);
      toast({
        title: "שגיאה בעדכון מיקום",
        description: "לא ניתן לעדכן את המיקום. אנא נסה שוב.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const initLocation = async () => {
      try {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // First try to get location from Supabase
          try {
            const savedLocation = await getUserLocation();
            if (savedLocation !== "לא ידוע") {
              // נרמול המ��קום
              const normalizedLocation = normalizeLocationName(savedLocation);
              setLocation(normalizedLocation);
              setIsLoading(false);
              return;
            }
          } catch (error) {
            console.error("Error fetching location from Supabase:", error);
          }
        }
        
        // If no saved location or not logged in, try to get current location
        const userLocation = await getCurrentLocation();
        const cityName = await reverseGeocode(userLocation.latitude, userLocation.longitude);
        
        // נרמול המיקום
        const normalizedLocation = normalizeLocationName(cityName);
        
        if (user) {
          // Save location history and update user location
          await saveLocationHistory(userLocation.latitude, userLocation.longitude, normalizedLocation);
          try {
            await updateUserLocation(normalizedLocation);
          } catch (error) {
            console.error("Error saving location to Supabase:", error);
          }
        }
        
        setLocation(normalizedLocation);
      } catch (error) {
        console.error("Error getting location:", error);
        setLocation("לא ידוע");
      } finally {
        setIsLoading(false);
      }
    };

    initLocation();
    
    // Set up periodic location updates
    const intervalId = setInterval(initLocation, 5 * 60 * 1000); // Update every 5 minutes
    
    return () => clearInterval(intervalId);
  }, []);

  return {
    location,
    setLocation,
    handleLocationChange,
    isLoading
  };
}
