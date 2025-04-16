
import { Bell, MapPin, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { LocationOverrideDialog } from "./LocationOverrideDialog";
import { SettingsDialog } from "./SettingsDialog";

interface HeaderProps {
  location: string;
  onLocationChange: (city: string) => void;
  onSnoozeChange: (minutes: number) => void;
  snoozeActive: boolean;
}

export function Header({ location, onLocationChange, onSnoozeChange, snoozeActive }: HeaderProps) {
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);

  return (
    <header className="sticky top-0 z-10 w-full bg-geoalert-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bell className="h-6 w-6 text-geoalert-turquoise" />
          <h1 className="text-xl font-semibold text-gray-900">גיאו-אלרט</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1"
            onClick={() => setLocationDialogOpen(true)}
          >
            <MapPin className="h-4 w-4 text-geoalert-turquoise" />
            <span className="text-sm">{location}</span>
          </Button>
          
          <Button
            variant="ghost" 
            size="icon"
            onClick={() => setSettingsDialogOpen(true)}
          >
            <Settings className="h-5 w-5 text-gray-600" />
          </Button>
        </div>
      </div>

      <LocationOverrideDialog 
        open={locationDialogOpen} 
        onOpenChange={setLocationDialogOpen}
        currentLocation={location}
        onLocationChange={onLocationChange} 
      />

      <SettingsDialog 
        open={settingsDialogOpen} 
        onOpenChange={setSettingsDialogOpen}
        onSnoozeChange={onSnoozeChange}
        snoozeActive={snoozeActive}
      />
    </header>
  );
}
