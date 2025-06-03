
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Heart, Activity } from "lucide-react";

export function SystemHealthButton() {
  const { toast } = useToast();
  const [isChecking, setIsChecking] = useState(false);

  const handleHealthCheck = async () => {
    setIsChecking(true);
    
    try {
      toast({
        title: "בודק תקינות המערכת",
        description: "מבצע בדיקה מקיפה של כל רכיבי המערכת..."
      });

      console.log("Starting health check...");
      
      const { data, error } = await supabase.functions.invoke('process-alerts-centrally', {
        body: JSON.stringify({ health_check: true })
      });

      if (error) {
        console.error("Health check error:", error);
        throw error;
      }

      console.log("Health check response:", data);

      const isHealthy = data?.status === 'healthy';
      const details = data?.details || {};

      let description = `סטטוס: ${isHealthy ? 'תקין' : 'בעייתי'}\n`;
      description += `מסד נתונים: ${details.database ? '✓' : '✗'}\n`;
      description += `מקורות RSS: ${details.rss_sources || 0}\n`;
      description += `התראות אחרונות: ${details.recent_alerts || 0}\n`;
      description += `OpenAI: ${details.openai_configured ? '✓' : '✗'}`;

      if (details.errors && details.errors.length > 0) {
        description += `\nשגיאות: ${details.errors.join(', ')}`;
      }

      toast({
        title: isHealthy ? "המערכת תקינה" : "זוהו בעיות במערכת",
        description,
        variant: isHealthy ? "default" : "destructive",
        duration: 10000
      });

    } catch (error: any) {
      console.error("System health check error:", error);
      toast({
        title: "שגיאה בבדיקת תקינות",
        description: error.message || "אירעה שגיאה לא צפויה",
        variant: "destructive",
        duration: 10000
      });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <Button 
      onClick={handleHealthCheck}
      disabled={isChecking}
      variant="outline"
      className="flex items-center gap-2"
    >
      {isChecking ? (
        <Activity className="h-4 w-4 animate-pulse text-blue-500" />
      ) : (
        <Heart className="h-4 w-4 text-green-500" />
      )}
      {isChecking ? "בודק..." : "בדיקת תקינות"}
    </Button>
  );
}
