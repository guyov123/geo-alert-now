
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, X, Trash } from "lucide-react";
import { RSSSource, toggleRSSSource, deleteRSSSource } from "@/services/rssSourcesService";

interface SourceItemProps {
  source: RSSSource;
  onSourceUpdated: (id: string, isActive: boolean) => void;
  onSourceDeleted: (id: string) => void;
}

export const SourceItem = ({ source, onSourceUpdated, onSourceDeleted }: SourceItemProps) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const handleToggleSource = async (checked: boolean) => {
    try {
      setIsUpdating(true);
      await toggleRSSSource(source.id, checked);
      onSourceUpdated(source.id, checked);
      
      toast({
        title: "מקור RSS עודכן",
        description: checked ? "המקור הופעל בהצלחה" : "המקור הושבת בהצלחה",
      });
    } catch (error) {
      console.error("Error toggling source:", error);
      toast({
        title: "שגיאה בעדכון מקור RSS",
        description: "אירעה שגיאה בעת ניסיון לעדכן את מקור ה-RSS",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteSource = async () => {
    if (!confirm("האם אתה בטוח שברצונך למחוק מקור זה?")) return;
    
    try {
      await deleteRSSSource(source.id);
      onSourceDeleted(source.id);
      
      toast({
        title: "מקור RSS נמחק",
        description: "מקור ה-RSS הוסר בהצלחה",
      });
    } catch (error) {
      console.error("Error deleting source:", error);
      toast({
        title: "שגיאה במחיקת מקור RSS",
        description: "אירעה שגיאה בעת ניסיון למחוק את מקור ה-RSS",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="bg-white border rounded-lg p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex items-center space-x-2 ml-2">
          <Checkbox
            checked={source.is_active}
            onCheckedChange={(checked) => handleToggleSource(checked as boolean)}
            id={`checkbox-${source.id}`}
            disabled={isUpdating}
          />
          {source.is_active ? (
            <Check className="h-6 w-6 text-green-500" />
          ) : (
            <X className="h-6 w-6 text-red-500" />
          )}
        </div>
        {!source.is_default && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDeleteSource}
            className="text-red-500 hover:text-red-700"
          >
            <Trash className="w-4 h-4" />
          </Button>
        )}
      </div>
      <div className="flex flex-col items-end">
        <div className="font-medium">{source.name}</div>
        <div className="text-sm text-gray-500 truncate max-w-[200px]" dir="ltr">
          {source.url}
        </div>
        {source.is_default && (
          <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded mt-1">
            ברירת מחדל
          </div>
        )}
      </div>
    </div>
  );
};
