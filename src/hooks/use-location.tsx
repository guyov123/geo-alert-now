
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { getCurrentLocation, reverseGeocode } from "@/services/locationService";
import { updateUserLocation, getUserLocation } from "@/services/supabaseClient";
import { supabase } from "@/integrations/supabase/client";

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
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        try {
          await updateUserLocation(newLocation);
          toast({
            title: "המיקום עודכן",
            description: `המיקום שלך עודכן ל${newLocation}`,
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
      
      setLocation(newLocation);
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
              setLocation(savedLocation);
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
        
        if (user) {
          // Save location history and update user location
          await saveLocationHistory(userLocation.latitude, userLocation.longitude, cityName);
          try {
            await updateUserLocation(cityName);
          } catch (error) {
            console.error("Error saving location to Supabase:", error);
          }
        }
        
        setLocation(cityName);
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
