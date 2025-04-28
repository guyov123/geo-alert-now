
import { Alert } from "@/types";
import { AlertCard } from "./AlertCard";
import { useState, useEffect } from "react";
import { Loader2, Bell, MapPin, List } from "lucide-react";
import { hasLocalApiKey } from "@/services/alertService";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface AlertListProps {
  alerts: Alert[];
}

export function AlertList({ alerts }: AlertListProps) {
  const [activeView, setActiveView] = useState<'relevant' | 'all' | 'nearby'>('relevant');
  const [relevantCount, setRelevantCount] = useState(0);
  const [nearbyAlerts, setNearbyAlerts] = useState<Alert[]>([]);
  const [usingAI, setUsingAI] = useState(false);
  
  useEffect(() => {
    const relevantAlerts = alerts.filter(alert => alert.isRelevant);
    setRelevantCount(relevantAlerts.length);
    console.log(`AlertList found ${relevantAlerts.length} relevant alerts out of ${alerts.length} total alerts`);
    
    // יומן מיקומים לדיבאג
    console.log("DEBUG: Alerts with locations:", alerts.map(alert => ({
      title: alert.title,
      location: alert.location,
      isRelevant: alert.isRelevant
    })));
    
    // For the "nearby" tab, include alerts that have known locations
    // but might not have been marked as directly relevant to the user's city
    const locationKnown = alerts.filter(alert => 
      alert.location && alert.location !== "לא ידוע"
    );
    setNearbyAlerts(locationKnown);
    
    // Check if AI classification is being used
    const checkAI = async () => {
      try {
        // סופהבייס מחייב async/await, אך יתכן שנצטרך להשתמש בגרסה הישנה עבור תצוגה מיידית
        setUsingAI(hasLocalApiKey());
      } catch (error) {
        console.error("Error checking API key:", error);
      }
    };
    
    checkAI();
  }, [alerts]);

  // Filter alerts based on active view
  const getFilteredAlerts = () => {
    switch (activeView) {
      case 'relevant':
        return alerts.filter(alert => alert.isRelevant);
      case 'all':
        return alerts.filter(alert => alert.isSecurityEvent);
      case 'nearby':
        return nearbyAlerts;
      default:
        return alerts;
    }
  };

  if (alerts.length === 0) {
    return (
      <div className="w-full text-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-geoalert-turquoise mx-auto mb-4" />
        <p className="text-gray-600" dir="rtl">טוען התראות...</p>
      </div>
    );
  }

  const filteredAlerts = getFilteredAlerts();
  
  return (
    <div className="w-full relative">
      {/* Floating Action Buttons */}
      <div className="fixed right-4 top-1/2 transform -translate-y-1/2 flex flex-col gap-3 z-50">
        <Button
          variant="secondary"
          size="icon"
          onClick={() => setActiveView('relevant')}
          className={cn(
            "rounded-full shadow-lg hover:scale-110 transition-transform",
            activeView === 'relevant' ? "bg-geoalert-turquoise text-white" : "bg-white"
          )}
        >
          <Bell className="h-5 w-5" />
          {relevantCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {relevantCount}
            </span>
          )}
        </Button>

        <Button
          variant="secondary"
          size="icon"
          onClick={() => setActiveView('all')}
          className={cn(
            "rounded-full shadow-lg hover:scale-110 transition-transform",
            activeView === 'all' ? "bg-geoalert-turquoise text-white" : "bg-white"
          )}
        >
          <List className="h-5 w-5" />
        </Button>

        <Button
          variant="secondary"
          size="icon"
          onClick={() => setActiveView('nearby')}
          className={cn(
            "rounded-full shadow-lg hover:scale-110 transition-transform",
            activeView === 'nearby' ? "bg-geoalert-turquoise text-white" : "bg-white"
          )}
        >
          <MapPin className="h-5 w-5" />
        </Button>
      </div>

      {/* Alert Cards */}
      <div className="space-y-4">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map(alert => (
            <AlertCard key={alert.id} alert={alert} />
          ))
        ) : (
          <div className="text-center py-8" dir="rtl">
            <p className="text-gray-500">אין התראות זמינות בתצוגה זו</p>
          </div>
        )}
      </div>
    </div>
  );
}
