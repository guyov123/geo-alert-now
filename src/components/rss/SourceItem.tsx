
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { RSSSource, toggleRSSSource } from "@/services/rssSourcesService";

interface SourceItemProps {
  source: RSSSource;
  onSourceUpdated: (id: string, isActive: boolean) => void;
}

export const SourceItem = ({ source, onSourceUpdated }: SourceItemProps) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const handleToggleSource = async (checked: boolean) => {
    try {
      setIsUpdating(true);
      await toggleRSSSource(source.id, checked);
      onSourceUpdated(source.id, checked);
      
      toast({
        title: "ערוץ RSS עודכן",
        description: checked ? "הערוץ הופעל בהצלחה" : "הערוץ הושבת בהצלחה",
      });
    } catch (error) {
      console.error("Error toggling source:", error);
      toast({
        title: "שגיאה בעדכון ערוץ RSS",
        description: "אירעה שגיאה בעת ניסיון לעדכן את ערוץ ה-RSS",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-white border rounded-lg p-4 flex items-center justify-between shadow-sm hover:shadow transition-shadow duration-200">
      <div className="font-medium text-lg">{source.name}</div>
      <Switch 
        checked={source.is_active} 
        onCheckedChange={(checked) => handleToggleSource(checked)}
        disabled={isUpdating}
      />
    </div>
  );
};
