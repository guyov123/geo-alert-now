
import { Alert } from "@/types";
import { AlertCard } from "./AlertCard";
import { useState, useEffect } from "react";
import { Loader2, Bell, MapPin, List, Trash2, Clock } from "lucide-react";
import { hasLocalApiKey } from "@/services/alertService";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { filterRecentAlerts } from "@/utils/alertTimeUtils";
import { clearAlertHistory } from "@/services/history";
import { useToast } from "@/hooks/use-toast";

interface AlertListProps {
  alerts: Alert[];
}

export function AlertList({ alerts }: AlertListProps) {
  const [activeView, setActiveView] = useState<'relevant' | 'all' | 'nearby'>('relevant');
  const [relevantCount, setRelevantCount] = useState(0);
  const [nearbyAlerts, setNearbyAlerts] = useState<Alert[]>([]);
  const [usingAI, setUsingAI] = useState(false);
  const [showOnlyRecent, setShowOnlyRecent] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    // Filter alerts to recent ones by default
    const recentAlerts = showOnlyRecent ? filterRecentAlerts(alerts, 24) : alerts;
    const relevantAlerts = recentAlerts.filter(alert => alert.isRelevant);
    setRelevantCount(relevantAlerts.length);
    
    console.log(`AlertList found ${relevantAlerts.length} relevant alerts out of ${recentAlerts.length} recent alerts (${alerts.length} total)`);
    
    // Debug logging for locations
    console.log("DEBUG: Recent alerts with locations:", recentAlerts.map(alert => ({
      title: alert.title,
      location: alert.location,
      isRelevant: alert.isRelevant,
      timestamp: alert.timestamp
    })));
    
    // For the "nearby" tab, include recent alerts that have known locations
    const locationKnown = recentAlerts.filter(alert => 
      alert.location && alert.location !== "לא ידוע"
    );
    setNearbyAlerts(locationKnown);
    
    // Check if AI classification is being used
    const checkAI = async () => {
      try {
        setUsingAI(hasLocalApiKey());
      } catch (error) {
        console.error("Error checking API key:", error);
      }
    };
    
    checkAI();
  }, [alerts, showOnlyRecent]);

  const handleClearHistory = async () => {
    try {
      await clearAlertHistory();
      toast({
        title: "היסטוריה נוקתה",
        description: "כל ההתראות הישנות נמחקו בהצלחה",
      });
      // Force a page refresh to show updated alerts
      window.location.reload();
    } catch (error) {
      console.error("Error clearing history:", error);
      toast({
        title: "שגיאה",
        description: "לא ניתן למחוק את ההיסטוריה",
        variant: "destructive"
      });
    }
  };

  // Filter alerts based on active view and recent filter
  const getFilteredAlerts = () => {
    const baseAlerts = showOnlyRecent ? filterRecentAlerts(alerts, 24) : alerts;
    
    switch (activeView) {
      case 'relevant':
        return baseAlerts.filter(alert => alert.isRelevant);
      case 'all':
        return baseAlerts.filter(alert => alert.isSecurityEvent);
      case 'nearby':
        return showOnlyRecent ? filterRecentAlerts(nearbyAlerts, 24) : nearbyAlerts;
      default:
        return baseAlerts;
    }
  };

  if (alerts.length === 0) {
    return (
      <div className="w-full text-center py-12">
        <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-700 mb-2" dir="rtl">📍 אין כרגע התראות באזור זה</h3>
        <p className="text-gray-500" dir="rtl">תהיה בטוח – אנו עוקבים עבורך.</p>
      </div>
    );
  }

  const filteredAlerts = getFilteredAlerts();
  
  return (
    <div className="w-full relative">
      {/* Time Filter Controls */}
      <div className="flex justify-between items-center mb-4 p-3 bg-white rounded-lg shadow-sm">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600">הצג:</span>
          <Button
            variant={showOnlyRecent ? "default" : "outline"}
            size="sm"
            onClick={() => setShowOnlyRecent(true)}
            className="text-xs"
          >
            24 שעות אחרונות
          </Button>
          <Button
            variant={!showOnlyRecent ? "default" : "outline"}
            size="sm"
            onClick={() => setShowOnlyRecent(false)}
            className="text-xs"
          >
            הכל
          </Button>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleClearHistory}
          className="text-xs text-red-600 hover:text-red-700"
        >
          <Trash2 className="h-3 w-3 mr-1" />
          נקה היסטוריה
        </Button>
      </div>

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
          <div className="text-center py-12">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2" dir="rtl">📍 אין כרגע התראות באזור זה</h3>
            <p className="text-gray-500" dir="rtl">
              {showOnlyRecent ? "אין התראות מה-24 שעות האחרונות." : "תהיה בטוח – אנו עוקבים עבורך."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
