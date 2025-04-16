
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
import { AppFooter } from "@/components/AppFooter";
import { ControlsSection } from "@/components/ControlsSection";
import { useAlerts } from "@/hooks/use-alerts";
import { useLocation } from "@/hooks/use-location";
import { useSnooze } from "@/hooks/use-snooze";
import { hasOpenAIApiKey } from "@/services/alertService";

const Index = () => {
  const { toast } = useToast();
  const { location, handleLocationChange } = useLocation();
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState<boolean>(false);
  
  const { 
    alerts, 
    loading, 
    setLoading, 
    useAI, 
    setUseAI, 
    refreshAlerts 
  } = useAlerts(location, false);

  const {
    snoozeActive,
    snoozeEndTime,
    handleSnoozeChange
  } = useSnooze((loc) => refreshAlerts(loc));

  useEffect(() => {
    if (!loading) {
      refreshAlerts(location);
    }
  }, [location]);

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
  
  const handleApiKeySuccess = () => {
    setUseAI(true);
    refreshAlerts(location);
  };

  const handleSnoozeCancel = () => {
    handleSnoozeChange(0, location);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-geoalert-gray">
      <Header 
        location={location} 
        onLocationChange={handleLocationChange}
        onSnoozeChange={(minutes) => handleSnoozeChange(minutes, location)}
        snoozeActive={snoozeActive}
      />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="flex justify-between mb-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleAIClassification}
            className="flex items-center gap-1"
          >
            <span>{useAI ? "סיווג AI" : "סיווג רגיל"}</span>
            <div className={`h-2 w-2 rounded-full ${useAI ? "bg-green-500" : "bg-gray-400"}`}></div>
          </Button>
          
          {useAI && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setApiKeyDialogOpen(true)}
              className="flex items-center gap-1 mx-2"
            >
              <Key className="h-4 w-4 text-geoalert-turquoise" />
              <span>שינוי מפתח API</span>
            </Button>
          )}
          
          <Link to="/history">
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-geoalert-turquoise" />
              <span>היסטוריה</span>
            </Button>
          </Link>
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
      </main>
      
      <AppFooter />
    </div>
  );
};

export default Index;
