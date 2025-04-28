
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { getCurrentLocation, reverseGeocode } from "@/services/locationService";
import { useToast } from "@/components/ui/use-toast";

interface LocationOverrideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentLocation: string;
  onLocationChange: (city: string) => void;
}

export function LocationOverrideDialog({
  open,
  onOpenChange,
  currentLocation,
  onLocationChange,
}: LocationOverrideDialogProps) {
  const [location, setLocation] = useState(currentLocation);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // כאשר הדיאלוג נפתח, עדכן את השדה עם המיקום הנוכחי
  // זה טוב עבור פתיחות חוזרות של הדיאלוג
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && currentLocation !== "טוען..." && currentLocation !== "לא ידוע") {
      setLocation(currentLocation);
    }
    onOpenChange(isOpen);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (location.trim()) {
      onLocationChange(location);
      onOpenChange(false);
    } else {
      toast({
        title: "שגיאה",
        description: "אנא הזן שם עיר תקין",
        variant: "destructive",
      });
    }
  };

  const handleUseCurrentLocation = async () => {
    setLoading(true);
    try {
      const locationData = await getCurrentLocation();
      const cityName = await reverseGeocode(locationData.latitude, locationData.longitude);
      
      if (cityName) {
        setLocation(cityName);
        onLocationChange(cityName);
        toast({
          title: "המיקום עודכן",
          description: `המיקום עודכן ל${cityName} בהתבסס על המיקום הנוכחי שלך`,
        });
        onOpenChange(false);
      } else {
        throw new Error("לא ניתן לאתר את שם העיר");
      }
    } catch (error) {
      console.error("Error getting current location:", error);
      toast({
        title: "שגיאה בקבלת המיקום",
        description: "לא ניתן לקבל את המיקום הנוכחי. אנא נסה שוב או הזן מיקום ידנית.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">עדכון מיקום</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="location" className="text-right">עיר</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="הזן שם עיר"
                className="text-right"
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleUseCurrentLocation} 
              className="flex items-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MapPin className="h-4 w-4" />
              )}
              השתמש במיקום הנוכחי
            </Button>
            <div className="flex justify-end gap-2 mt-2 sm:mt-0">
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  ביטול
                </Button>
              </DialogClose>
              <Button type="submit" className="bg-geoalert-turquoise hover:bg-geoalert-turquoise/90">
                שמור
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
