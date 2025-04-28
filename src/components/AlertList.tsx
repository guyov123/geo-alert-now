
import { Alert } from "@/types";
import { AlertCard } from "./AlertCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { Loader2, Brain } from "lucide-react";
import { hasLocalApiKey } from "@/services/alertService";

interface AlertListProps {
  alerts: Alert[];
}

export function AlertList({ alerts }: AlertListProps) {
  const [relevantCount, setRelevantCount] = useState(0);
  const [nearbyAlerts, setNearbyAlerts] = useState<Alert[]>([]);
  const [usingAI, setUsingAI] = useState(false);
  
  useEffect(() => {
    const relevantAlerts = alerts.filter(alert => alert.isRelevant);
    setRelevantCount(relevantAlerts.length);
    console.log(`AlertList found ${relevantAlerts.length} relevant alerts out of ${alerts.length} total alerts`);
    
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

  // Split alerts by relevance for different tabs
  const relevantAlerts = alerts.filter(alert => alert.isRelevant);
  
  // Filter alerts that are security events - for "all alerts" tab
  const securityAlerts = alerts.filter(alert => alert.isSecurityEvent);
  
  if (alerts.length === 0) {
    return (
      <div className="w-full text-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-geoalert-turquoise mx-auto mb-4" />
        <p className="text-gray-600" dir="rtl">טוען התראות...</p>
      </div>
    );
  }
  
  return (
    <div className="w-full">
      <Tabs defaultValue="relevant" dir="rtl">
        <TabsList className="w-full">
          <TabsTrigger value="relevant" className="flex-1 relative">
            התראות רלוונטיות
            {relevantCount > 0 && (
              <span className="absolute top-0.5 -right-0.5 bg-geoalert-turquoise text-white text-xs font-bold px-1.5 rounded-full">
                {relevantCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="all" className="flex-1">כל ההתראות</TabsTrigger>
          <TabsTrigger value="nearby" className="flex-1">לפי מיקום</TabsTrigger>
        </TabsList>
        
        {usingAI && (
          <div className="flex items-center justify-end mt-2 text-xs text-gray-500">
            <Brain className="h-3 w-3 mr-1" />
            <span>סיווג באמצעות AI</span>
          </div>
        )}
        
        <TabsContent value="relevant" className="mt-4 space-y-4">
          {relevantAlerts.length > 0 ? (
            relevantAlerts.map(alert => (
              <AlertCard key={alert.id} alert={alert} />
            ))
          ) : (
            <div className="text-center py-8 text-gray-500" dir="rtl">
              <p>אין התראות רלוונטיות כרגע</p>
            </div>
          )}
        </TabsContent>
        <TabsContent value="all" className="mt-4 space-y-4">
          {securityAlerts.length > 0 ? (
            securityAlerts.map(alert => (
              <AlertCard key={alert.id} alert={alert} />
            ))
          ) : (
            <div className="text-center py-8 text-gray-500" dir="rtl">
              <p>אין התראות ביטחוניות כרגע</p>
            </div>
          )}
        </TabsContent>
        <TabsContent value="nearby" className="mt-4 space-y-4">
          {nearbyAlerts.length > 0 ? (
            <div>
              <div className="mb-3 text-sm text-gray-500 text-right">
                התראות ממוינות לפי מיקום
              </div>
              {nearbyAlerts.map(alert => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500" dir="rtl">
              <p>אין התראות עם מיקום ידוע כרגע</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
