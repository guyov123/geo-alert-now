
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
      const updatedLocation = await updateUserLocation(newLocation);
      setLocation(updatedLocation);
      toast({
        title: "המיקום עודכן",
        description: `המיקום שלך עודכן ל${updatedLocation}`,
      });
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
        const savedLocation = await getUserLocation();
        
        if (savedLocation !== "לא ידוע") {
          setLocation(savedLocation);
          setIsLoading(false);
          return;
        }
        
        // If no saved location, try to get current location
        const userLocation = await getCurrentLocation();
        const cityName = await reverseGeocode(userLocation.latitude, userLocation.longitude);
        
        // Update location in Supabase
        await updateUserLocation(cityName);
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
