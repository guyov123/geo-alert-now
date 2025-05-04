
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Brain } from "lucide-react";
import { useState } from "react";

interface RefreshButtonProps {
  onRefresh: () => void;
}

export function RefreshButton({ onRefresh }: RefreshButtonProps) {
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    toast({
      title: "מרענן התראות",
      description: "המערכת מרעננת התראות בסיווג AI"
    });
    
    try {
      await onRefresh();
      toast({
        title: "רענון הושלם",
        description: "התראות עודכנו בהצלחה"
      });
    } catch (error) {
      console.error("Error during refresh:", error);
      // Error will be handled by the useAlerts hook
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleRefresh}
      className="flex items-center gap-1 max-w-[180px]"
      disabled={isRefreshing}
    >
      <Brain className={`h-4 w-4 ${isRefreshing ? 'animate-pulse text-blue-500' : 'text-geoalert-turquoise'}`} />
      <span className="text-xs">{isRefreshing ? "מרענן..." : "רענון התראות AI"}</span>
    </Button>
  );
}
