
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { addRSSSource, RSSSource } from "@/services/rssSourcesService";

interface AddSourceFormProps {
  onSourceAdded: (source: RSSSource) => void;
}

export const AddSourceForm = ({ onSourceAdded }: AddSourceFormProps) => {
  const [newSourceName, setNewSourceName] = useState<string>("");
  const [newSourceUrl, setNewSourceUrl] = useState<string>("");
  const [isAddingSource, setIsAddingSource] = useState<boolean>(false);
  const { toast } = useToast();

  const handleAddSource = async () => {
    if (!newSourceName || !newSourceUrl) {
      toast({
        title: "שדות חסרים",
        description: "אנא מלא את שם המקור וכתובת ה-URL",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsAddingSource(true);
      const newSource = await addRSSSource(newSourceName, newSourceUrl);
      onSourceAdded(newSource);
      setNewSourceName("");
      setNewSourceUrl("");
      toast({
        title: "מקור RSS נוסף",
        description: "מקור ה-RSS נוסף בהצלחה",
      });
    } catch (error) {
      console.error("Error adding source:", error);
      toast({
        title: "שגיאה בהוספת מקור RSS",
        description: "אירעה שגיאה בעת ניסיון להוסיף מקור RSS חדש",
        variant: "destructive",
      });
    } finally {
      setIsAddingSource(false);
    }
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg mb-6">
      <h2 className="text-lg font-semibold mb-3 text-right">הוסף מקור חדש</h2>
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="שם המקור"
            value={newSourceName}
            onChange={(e) => setNewSourceName(e.target.value)}
            className="text-right"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="כתובת URL של מקור ה-RSS"
            value={newSourceUrl}
            onChange={(e) => setNewSourceUrl(e.target.value)}
            className="text-right"
          />
        </div>
        <div className="flex justify-end">
          <Button 
            onClick={handleAddSource} 
            disabled={isAddingSource || !newSourceName || !newSourceUrl}
            className="flex gap-2 items-center"
          >
            <Plus className="w-4 h-4" />
            <span>הוסף מקור</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
