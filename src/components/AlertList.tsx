
import { Alert } from "@/types";
import { AlertCard } from "./AlertCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";

interface AlertListProps {
  alerts: Alert[];
}

export function AlertList({ alerts }: AlertListProps) {
  const [relevantCount, setRelevantCount] = useState(0);
  
  useEffect(() => {
    setRelevantCount(alerts.filter(alert => alert.isRelevant).length);
  }, [alerts]);

  // Split alerts by relevance for different tabs
  const relevantAlerts = alerts.filter(alert => alert.isRelevant);
  const otherAlerts = alerts.filter(alert => !alert.isRelevant);
  
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
          <TabsTrigger value="nearby" className="flex-1">קרוב אליי</TabsTrigger>
        </TabsList>
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
          {alerts.length > 0 ? (
            alerts.map(alert => (
              <AlertCard key={alert.id} alert={alert} />
            ))
          ) : (
            <div className="text-center py-8 text-gray-500" dir="rtl">
              <p>אין התראות כרגע</p>
            </div>
          )}
        </TabsContent>
        <TabsContent value="nearby" className="mt-4 space-y-4">
          {/* In a real app, this would show alerts from nearby locations */}
          <div className="text-center py-8 text-gray-500" dir="rtl">
            <p>פיצ׳ר זה יהיה זמין בגרסה הבאה</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
