
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { getCurrentLocation, reverseGeocode } from "@/services/locationService";
import { updateUserLocation, getUserLocation } from "@/services/supabaseClient";

export function useLocation() {
  const [location, setLocation] = useState<string>("טוען...");
  const { toast } = useToast();

  const handleLocationChange = async (newLocation: string) => {
    try {
      const updatedLocation = await updateUserLocation(newLocation);
      setLocation(updatedLocation);
      toast({
        title: "המיקום עודכן",
        description: `המיקום שלך עודכן ל${updatedLocation}`,
      });
    } catch (error) {
      toast({
        title: "שגיאה בעדכון מיקום",
        description: "לא ניתן לעדכן את המיקום. אנא נסה שוב.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    const initLocation = async () => {
      try {
        // First try to get location from Supabase
        const savedLocation = await getUserLocation();
        
        if (savedLocation !== "לא ידוע") {
          setLocation(savedLocation);
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
      }
    };

    initLocation();
  }, []);

  return {
    location,
    setLocation,
    handleLocationChange
  };
}
