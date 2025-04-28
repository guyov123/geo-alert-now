
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { getCurrentLocation, reverseGeocode } from "@/services/locationService";
import { updateUserLocation, getUserLocation } from "@/services/supabaseClient";

export function useLocation() {
  const [location, setLocation] = useState<string>("טוען...");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();

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
      
      // Try to update the location in Supabase
      try {
        await updateUserLocation(newLocation);
        toast({
          title: "המיקום עודכן",
          description: `המיקום שלך עודכן ל${newLocation}`,
        });
      } catch (error) {
        console.log("Error updating location in Supabase:", error);
        // If there's an authentication error, just update local state
        toast({
          title: "המיקום עודכן מקומית",
          description: "המיקום עודכן באופן מקומי בלבד (לא נשמר בחשבון)"
        });
      }
      
      // Update local state regardless of Supabase success
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
        // First try to get location from Supabase
        let savedLocation;
        
        try {
          savedLocation = await getUserLocation();
        } catch (error) {
          console.log("Error fetching location from Supabase:", error);
          savedLocation = "לא ידוע";
        }
        
        if (savedLocation !== "לא ידוע") {
          setLocation(savedLocation);
          setIsLoading(false);
          return;
        }
        
        // If no saved location, try to get current location
        const userLocation = await getCurrentLocation();
        const cityName = await reverseGeocode(userLocation.latitude, userLocation.longitude);
        
        // Try to update location in Supabase
        try {
          await updateUserLocation(cityName);
        } catch (error) {
          console.log("Error saving initial location to Supabase:", error);
          // Continue without saving to Supabase
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
  }, []);

  return {
    location,
    setLocation,
    handleLocationChange,
    isLoading
  };
}
