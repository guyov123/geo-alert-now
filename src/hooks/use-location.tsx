
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { getCurrentLocation, reverseGeocode } from "@/services/locationService";

export function useLocation() {
  const [location, setLocation] = useState<string>("טוען...");
  const { toast } = useToast();

  const handleLocationChange = async (newLocation: string) => {
    setLocation(newLocation);
    toast({
      title: "המיקום עודכן",
      description: `המיקום שלך עודכן ל${newLocation}`,
    });
  };

  useEffect(() => {
    const initLocation = async () => {
      try {
        const userLocation = await getCurrentLocation();
        const cityName = await reverseGeocode(userLocation.latitude, userLocation.longitude);
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
