
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Brain } from "lucide-react";

interface RefreshButtonProps {
  onRefresh: () => void;
}

export function RefreshButton({ onRefresh }: RefreshButtonProps) {
  const { toast } = useToast();

  const handleRefresh = () => {
    toast({
      title: "מרענן התראות",
      description: "המערכת מרעננת התראות בסיווג AI"
    });
    onRefresh();
  };

  return (
    <div className="flex justify-between mb-4">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleRefresh}
        className="flex items-center gap-1"
      >
        <Brain className="h-4 w-4 text-geoalert-turquoise" />
        <span>רענון התראות עם סיווג AI</span>
      </Button>
    </div>
  );
}
