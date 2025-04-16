
import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { AlertList } from "@/components/AlertList";
import { Alert, LocationData } from "@/types";
import { fetchRssFeeds } from "@/services/rssService";
import { classifyAlerts } from "@/services/alertService";
import { getCurrentLocation, reverseGeocode } from "@/services/locationService";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index = () => {
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [location, setLocation] = useState<string>("טוען...");
  const [loading, setLoading] = useState<boolean>(true);
  const [snoozeActive, setSnoozeActive] = useState<boolean>(false);
  const [snoozeEndTime, setSnoozeEndTime] = useState<Date | null>(null);

  // Initialize the app by getting user location and loading first alerts
  useEffect(() => {
    const initApp = async () => {
      try {
        // Get user's location
        const userLocation = await getCurrentLocation();
        const cityName = await reverseGeocode(userLocation.latitude, userLocation.longitude);
        setLocation(cityName);
        
        // Load initial alerts
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

  // Set up periodic refresh for alerts
  useEffect(() => {
    const interval = setInterval(() => {
      if (!snoozeActive) {
        refreshAlerts(location);
      }
    }, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [location, snoozeActive]);

  // Check if snooze should be deactivated
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

    // Check every minute
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

  const refreshAlerts = async (userLocation: string) => {
    try {
      const rssItems = await fetchRssFeeds();
      const classifiedAlerts = classifyAlerts(rssItems, userLocation);
      setAlerts(classifiedAlerts);
      
      // Show toast for new relevant alerts (in a real app)
      // This is simplified for the demo
      const relevantAlerts = classifiedAlerts.filter(alert => alert.isRelevant);
      if (relevantAlerts.length > 0 && !snoozeActive) {
        // In a real app, compare with previous alerts to only notify about new ones
      }
    } catch (error) {
      console.error("Error refreshing alerts:", error);
    }
  };

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
        <div className="flex justify-end mb-4">
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
      </main>
      
      <footer className="mt-auto py-4 text-center text-sm text-gray-500 border-t border-gray-200 bg-white">
        גיאו-אלרט © {new Date().getFullYear()} - כל המידע מבוסס על RSS פידים של אתרי חדשות
      </footer>
    </div>
  );
};

export default Index;
