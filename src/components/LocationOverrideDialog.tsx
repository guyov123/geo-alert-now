
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
import { MapPin } from "lucide-react";

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (location.trim()) {
      onLocationChange(location);
      onOpenChange(false);
    }
  };

  const handleUseCurrentLocation = () => {
    // This would use the browser's geolocation API in a real app
    // For demo purposes, we'll just set a hardcoded value
    onLocationChange("תל אביב");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            <Button type="button" variant="outline" onClick={handleUseCurrentLocation} className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
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
