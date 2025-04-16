
import { useState, useEffect } from "react";
import { Alert, RSSItem } from "@/types";
import { fetchRssFeeds } from "@/services/rssService";
import { 
  classifyAlerts, 
  classifyAlertsWithAI, 
  hasOpenAIApiKey 
} from "@/services/alertService";
import { getCurrentLocation, reverseGeocode } from "@/services/locationService";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { Loader2, Clock, Key } from "lucide-react";
import { Header } from "@/components/Header";
import { AlertList } from "@/components/AlertList";
import { ApiKeyDialog } from "@/components/ApiKeyDialog";

const Index = () => {
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [location, setLocation] = useState<string>("טוען...");
  const [loading, setLoading] = useState<boolean>(true);
  const [snoozeActive, setSnoozeActive] = useState<boolean>(false);
  const [snoozeEndTime, setSnoozeEndTime] = useState<Date | null>(null);
  const [useAI, setUseAI] = useState<boolean>(false);
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState<boolean>(false);

  const refreshAlerts = async (userLocation: string) => {
    try {
      const rssItems = await fetchRssFeeds();
      console.log(`Fetched ${rssItems.length} RSS items`); // New log for tracing
      
      let classifiedAlerts;
      if (useAI && hasOpenAIApiKey()) {
        try {
          classifiedAlerts = await classifyAlertsWithAI(rssItems, userLocation);
          console.log(`AI classified ${classifiedAlerts.length} security events`); // New log
        } catch (error) {
          console.error("AI classification failed:", error);
          classifiedAlerts = classifyAlerts(rssItems, userLocation);
          console.log(`Keyword classified ${classifiedAlerts.length} security events`); // New log
        }
      } else {
        classifiedAlerts = classifyAlerts(rssItems, userLocation);
        console.log(`Keyword classified ${classifiedAlerts.length} security events`); // New log
      }
      
      setAlerts(classifiedAlerts);
    } catch (error) {
      console.error("Error refreshing alerts:", error);
    }
  };
  
  useEffect(() => {
    const hasApiKey = hasOpenAIApiKey();
    setUseAI(hasApiKey);
    
    const initApp = async () => {
      try {
        const userLocation = await getCurrentLocation();
        const cityName = await reverseGeocode(userLocation.latitude, userLocation.longitude);
        setLocation(cityName);
        
        await refreshAlerts(cityName);
      } catch (error) {
        console.error("Error initializing app:", error);
        toast({
          title: "שגיאה בטעינת האפליקציה",
          description: "לא ניתן לטעון את המיקום או ההתראות. אנא נסה שוב.",
          variant: "destructive",
        });
        setLocation("לא ידוע");
      } finally {
        setLoading(false);
      }
    };

    initApp();
  }, [toast]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!snoozeActive) {
        refreshAlerts(location);
      }
    }, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [location, snoozeActive]);

  useEffect(() => {
    if (snoozeActive && snoozeEndTime && new Date() > snoozeEndTime) {
      setSnoozeActive(false);
      setSnoozeEndTime(null);
      toast({
        title: "התראות פעילות שוב",
        description: "מצב השתקה הסתיים. התראות יוצגו כרגיל.",
      });
      refreshAlerts(location);
    }

    const interval = setInterval(() => {
      if (snoozeActive && snoozeEndTime && new Date() > snoozeEndTime) {
        setSnoozeActive(false);
        setSnoozeEndTime(null);
        toast({
          title: "התראות פעילות שוב",
          description: "מצב השתקה הסתיים. התראות יוצגו כרגיל.",
        });
        refreshAlerts(location);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [snoozeActive, snoozeEndTime, location, toast]);

  const handleLocationChange = async (newLocation: string) => {
    setLocation(newLocation);
    await refreshAlerts(newLocation);
    toast({
      title: "המיקום עודכן",
      description: `המיקום שלך עודכן ל${newLocation}`,
    });
  };

  const handleSnoozeChange = (minutes: number) => {
    if (minutes === 0) {
      setSnoozeActive(false);
      setSnoozeEndTime(null);
      toast({
        title: "התראות פעילות",
        description: "מצב השקט בוטל. כל ההתראות יוצגו כרגיל.",
      });
    } else {
      const endTime = new Date();
      endTime.setMinutes(endTime.getMinutes() + minutes);
      setSnoozeActive(true);
      setSnoozeEndTime(endTime);
      toast({
        title: "התראות הושתקו",
        description: `לא יוצגו התראות חדשות במשך ${minutes} דקות`,
      });
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-geoalert-gray">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-geoalert-turquoise mx-auto" />
            <p className="mt-4 text-lg text-gray-600">טוען את האפליקציה...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-geoalert-gray">
      <Header 
        location={location} 
        onLocationChange={handleLocationChange}
        onSnoozeChange={handleSnoozeChange}
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

        {snoozeActive && snoozeEndTime && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded shadow-sm" dir="rtl">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="mr-3">
                <p className="text-sm text-yellow-700">
                  התראות הושתקו עד {snoozeEndTime.toLocaleTimeString()} 
                  <button 
                    onClick={() => handleSnoozeChange(0)} 
                    className="font-semibold mr-2 underline text-yellow-800"
                  >
                    בטל השתקה
                  </button>
                </p>
              </div>
            </div>
          </div>
        )}
        
        <AlertList alerts={alerts} />
        
        <ApiKeyDialog 
          open={apiKeyDialogOpen} 
          onOpenChange={setApiKeyDialogOpen} 
          onSuccess={handleApiKeySuccess}
        />
      </main>
      
      <footer className="mt-auto py-4 text-center text-sm text-gray-500 border-t border-gray-200 bg-white">
        גיאו-אלרט © {new Date().getFullYear()} - כל המידע מבוסס על RSS פידים של אתרי חדשות
      </footer>
    </div>
  );
};

export default Index;
