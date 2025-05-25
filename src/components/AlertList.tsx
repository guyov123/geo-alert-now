
import { Alert } from "@/types";
import { AlertCard } from "./AlertCard";
import { useState, useEffect } from "react";
import { Bell, MapPin, List, Trash2 } from "lucide-react";
import { hasLocalApiKey } from "@/services/alertService";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { clearAlertHistory } from "@/services/history";
import { useToast } from "@/hooks/use-toast";

interface AlertListProps {
  alerts: Alert[];
  onRefresh?: () => void;
}

export function AlertList({ alerts, onRefresh }: AlertListProps) {
  const [activeView, setActiveView] = useState<'relevant' | 'all' | 'nearby'>('relevant');
  const [relevantCount, setRelevantCount] = useState(0);
  const [nearbyAlerts, setNearbyAlerts] = useState<Alert[]>([]);
  const [usingAI, setUsingAI] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    // Count relevant alerts
    const relevantAlerts = alerts.filter(alert => alert.isRelevant);
    setRelevantCount(relevantAlerts.length);
    
    console.log(`AlertList found ${relevantAlerts.length} relevant alerts out of ${alerts.length} total alerts`);
    
    // Debug logging for locations
    console.log("DEBUG: Alerts with locations:", alerts.map(alert => ({
      title: alert.title,
      location: alert.location,
      isRelevant: alert.isRelevant,
      timestamp: alert.timestamp
    })));
    
    // For the "nearby" tab, include alerts that have known locations
    const locationKnown = alerts.filter(alert => 
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
  }, [alerts]);

  const handleClearHistory = async () => {
    try {
      await clearAlertHistory();
      toast({
        title: "היסטוריה נוקתה",
        description: "כל ההתראות הישנות נמחקו בהצלחה",
      });
      
      // Call refresh to update the current view
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error("Error clearing history:", error);
      toast({
        title: "שגיאה",
        description: "לא ניתן למחוק את ההיסטוריה",
        variant: "destructive"
      });
    }
  };

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
        <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-700 mb-2" dir="rtl">📍 אין כרגע התראות באזור זה</h3>
        <p className="text-gray-500" dir="rtl">תהיה בטוח – אנו עוקבים עבורך.</p>
      </div>
    );
  }

  const filteredAlerts = getFilteredAlerts();
  
  return (
    <div className="w-full relative">
      {/* Clear History Button */}
      <div className="flex justify-end mb-4">
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
            <p className="text-gray-500" dir="rtl">תהיה בטוח – אנו עוקבים עבורך.</p>
          </div>
        )}
      </div>
    </div>
  );
}
