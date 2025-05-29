
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { RefreshCw } from "lucide-react";

export function TestProcessingButton() {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleTestProcessing = async () => {
    setIsProcessing(true);
    
    try {
      toast({
        title: "מתחיל בדיקת מערכת",
        description: "מפעיל את פונקציית העיבוד המרכזית..."
      });

      console.log("Calling process-alerts-centrally function...");
      
      const { data, error } = await supabase.functions.invoke('process-alerts-centrally', {
        body: JSON.stringify({ test: true })
      });

      if (error) {
        console.error("Error calling function:", error);
        throw error;
      }

      console.log("Function response:", data);

      toast({
        title: "בדיקת מערכת הושלמה",
        description: `תוצאה: ${data?.message || 'הפונקציה רצה בהצלחה'}. עובדו ${data?.processed || 0} התראות.`,
        duration: 10000
      });

    } catch (error: any) {
      console.error("Test processing error:", error);
      toast({
        title: "שגיאה בבדיקת המערכת",
        description: error.message || "אירעה שגיאה לא צפויה",
        variant: "destructive",
        duration: 10000
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Button 
      onClick={handleTestProcessing}
      disabled={isProcessing}
      variant="outline"
      className="flex items-center gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${isProcessing ? 'animate-spin' : ''}`} />
      {isProcessing ? "בודק מערכת..." : "בדיקת תקינות מערכת"}
    </Button>
  );
}
