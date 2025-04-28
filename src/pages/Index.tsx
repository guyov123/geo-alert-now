
import { useState, useEffect } from "react";
import { Key, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { AlertList } from "@/components/AlertList";
import { ApiKeyDialog } from "@/components/ApiKeyDialog";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { SnoozeAlert } from "@/components/SnoozeAlert";
import { BottomNav } from "@/components/BottomNav";
import { useAlerts } from "@/hooks/use-alerts";
import { useLocation } from "@/hooks/use-location";
import { useSnooze } from "@/hooks/use-snooze";
import { hasOpenAIApiKey } from "@/services/alertService";
import { CalmChat } from "@/components/CalmChat";

const Index = () => {
  const { toast } = useToast();
  const { location, handleLocationChange } = useLocation();
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState<boolean>(false);
  
  const { 
    alerts, 
    loading, 
    error,
    useAI, 
    setUseAI, 
    refreshAlerts,
    checkForApiKey
  } = useAlerts(location, false);

  const {
    snoozeActive,
    snoozeEndTime,
    handleSnoozeChange
  } = useSnooze((loc) => refreshAlerts(loc));

  const toggleAIClassification = () => {
    if (!useAI) {
      if (hasOpenAIApiKey()) {
        setUseAI(true);
        toast({
          title: "סיווג AI מופעל",
          description: "עברנו לסיווג חכם המבוסס על AI"
        });
        refreshAlerts(location);
      } else {
        setApiKeyDialogOpen(true);
      }
    } else {
      setUseAI(false);
      toast({
        title: "סיווג מבוסס מילות מפתח מופעל",
        description: "עברנו לסיווג פשוט המבוסס על מילות מפתח"
      });
      refreshAlerts(location);
    }
  };
  
  const handleApiKeySuccess = async () => {
    await checkForApiKey();
    refreshAlerts(location);
  };

  const handleSnoozeCancel = () => {
    handleSnoozeChange(0, location);
  };

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
        <div className="flex justify-end mb-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setApiKeyDialogOpen(true)}
            className="flex items-center gap-1"
          >
            <Key className="h-4 w-4 text-geoalert-turquoise" />
            <span>API הגדרות</span>
          </Button>
        </div>

        <SnoozeAlert 
          snoozeActive={snoozeActive} 
          snoozeEndTime={snoozeEndTime}
          onSnoozeCancel={handleSnoozeCancel}
        />
        
        <AlertList alerts={alerts} />
        
        <ApiKeyDialog 
          open={apiKeyDialogOpen} 
          onOpenChange={setApiKeyDialogOpen} 
          onSuccess={handleApiKeySuccess}
        />

        <CalmChat />
      </main>
      
      <BottomNav />
    </div>
  );
};

export default Index;
