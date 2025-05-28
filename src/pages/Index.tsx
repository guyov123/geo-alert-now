
import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { AlertList } from "@/components/AlertList";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { SnoozeAlert } from "@/components/SnoozeAlert";
import { BottomNav } from "@/components/BottomNav";
import { useAlerts } from "@/hooks/use-alerts";
import { useLocation } from "@/hooks/use-location";
import { useSnooze } from "@/hooks/use-snooze";
import { CalmChat } from "@/components/CalmChat";
import { ControlsSection } from "@/components/ControlsSection";

const Index = () => {
  const { toast } = useToast();
  const { location, handleLocationChange } = useLocation();
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());
  
  const { 
    alerts, 
    loading, 
    error,
    refreshAlerts
  } = useAlerts(location, false);

  const {
    snoozeActive,
    snoozeEndTime,
    handleSnoozeChange
  } = useSnooze((loc) => refreshAlerts(loc));

  const handleRefresh = async () => {
    await refreshAlerts(location);
    setLastRefreshTime(new Date());
  };

  const handleSnoozeCancel = () => {
    handleSnoozeChange(0, location);
  };

  // Update last refresh time when alerts change
  useEffect(() => {
    if (alerts.length > 0) {
      setLastRefreshTime(new Date());
    }
  }, [alerts]);

  if (loading) {
    return <LoadingSpinner message="טוען התראות..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-geoalert-gray pb-16">
        <Header 
          location={location} 
          onLocationChange={handleLocationChange}
          onSnoozeChange={(minutes) => handleSnoozeChange(minutes, location)}
          snoozeActive={snoozeActive}
        />
        
        <main className="flex-1 container mx-auto px-4 py-6 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-red-500 mb-4">{error}</p>
            <Button onClick={() => refreshAlerts(location)}>נסה שוב</Button>
          </div>
        </main>
        
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-geoalert-gray pb-16">
      <Header 
        location={location} 
        onLocationChange={handleLocationChange}
        onSnoozeChange={(minutes) => handleSnoozeChange(minutes, location)}
        snoozeActive={snoozeActive}
      />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        <ControlsSection onRefresh={handleRefresh} />

        {/* Last Refresh Time Indicator */}
        <div className="flex items-center justify-center mb-4 text-xs text-gray-500">
          <Clock className="h-3 w-3 mr-1" />
          <span>עודכן לאחרונה: {lastRefreshTime.toLocaleTimeString('he-IL')}</span>
        </div>

        <SnoozeAlert 
          snoozeActive={snoozeActive} 
          snoozeEndTime={snoozeEndTime}
          onSnoozeCancel={handleSnoozeCancel}
        />
        
        <AlertList alerts={alerts} />

        <CalmChat />
      </main>
      
      <BottomNav />
    </div>
  );
};

export default Index;
