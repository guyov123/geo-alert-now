
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { RSSSource, getRSSSources, addRSSSource, toggleRSSSource, deleteRSSSource } from "@/services/rssSourcesService";
import { Plus, Trash, Check, X } from "lucide-react";
import { useLocation } from "@/hooks/use-location";

const RssSources = () => {
  const [sources, setSources] = useState<RSSSource[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [newSourceName, setNewSourceName] = useState<string>("");
  const [newSourceUrl, setNewSourceUrl] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isAddingSource, setIsAddingSource] = useState<boolean>(false);
  const { toast } = useToast();
  const { location, handleLocationChange } = useLocation();

  const fetchSources = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRSSSources();
      setSources(data);
    } catch (error) {
      console.error("Error fetching sources:", error);
      setError("אירעה שגיאה בטעינת מקורות RSS");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  const handleToggleSource = async (id: string, isActive: boolean) => {
    try {
      await toggleRSSSource(id, isActive);
      setSources(sources.map(source => 
        source.id === id ? { ...source, is_active: isActive } : source
      ));
      toast({
        title: "מקור RSS עודכן",
        description: isActive ? "המקור הופעל בהצלחה" : "המקור הושבת בהצלחה",
      });
    } catch (error) {
      console.error("Error toggling source:", error);
      toast({
        title: "שגיאה בעדכון מקור RSS",
        description: "אירעה שגיאה בעת ניסיון לעדכן את מקור ה-RSS",
        variant: "destructive",
      });
    }
  };

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
      setSources([...sources, newSource]);
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

  const handleDeleteSource = async (id: string) => {
    if (!confirm("האם אתה בטוח שברצונך למחוק מקור זה?")) return;
    
    try {
      await deleteRSSSource(id);
      setSources(sources.filter(source => source.id !== id));
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

  // Create a dummy function for snoozeChange since we don't need it here
  const handleSnoozeChange = (minutes: number) => {
    console.log(`Snooze set for ${minutes} minutes, but not used in RSS page`);
  };

  if (loading) {
    return <LoadingSpinner message="טוען מקורות RSS..." />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-geoalert-gray pb-16">
      <Header 
        location={location}
        snoozeActive={false}
        onLocationChange={handleLocationChange}
        onSnoozeChange={handleSnoozeChange}
      />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-2xl font-bold mb-4 text-right">מקורות RSS</h1>
          <p className="text-right text-gray-600 mb-6">נהל את מקורות ה-RSS שלך לקבלת התראות</p>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 text-right">
              {error}
            </div>
          )}

          {/* Add new source form */}
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

          {/* Sources list */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-right">מקורות RSS שלך</h2>
            {sources.length > 0 ? (
              sources.map((source) => (
                <div key={source.id} className="bg-white border rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center space-x-2 ml-2">
                      <Checkbox
                        checked={source.is_active}
                        onCheckedChange={(checked) => handleToggleSource(source.id, checked as boolean)}
                        id={`checkbox-${source.id}`}
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
                        onClick={() => handleDeleteSource(source.id)}
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
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                אין מקורות RSS מוגדרים
              </div>
            )}
          </div>
        </div>
      </main>
      
      <BottomNav />
    </div>
  );
};

export default RssSources;
