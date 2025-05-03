
import { useState, useEffect } from "react";
import { Alert } from "@/types";
import { AlertCard } from "@/components/AlertCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Trash2, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { getAlertHistory, clearAlertHistory } from "@/services/history";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const History = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();

  // Load alert history when component mounts
  useEffect(() => {
    const fetchAlertHistory = async () => {
      setLoading(true);
      try {
        const historyAlerts = await getAlertHistory();
        setAlerts(historyAlerts);
      } catch (error) {
        console.error("Error fetching alert history:", error);
        toast({
          title: "שגיאה בטעינת היסטוריה",
          description: "לא ניתן לטעון את היסטוריית ההתראות",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchAlertHistory();
  }, [toast]);

  const filteredAlerts = () => {
    switch (filter) {
      case "relevant":
        return alerts.filter(alert => alert.isRelevant);
      case "week":
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return alerts.filter(alert => new Date(alert.timestamp) > weekAgo);
      case "day":
        const dayAgo = new Date();
        dayAgo.setDate(dayAgo.getDate() - 1);
        return alerts.filter(alert => new Date(alert.timestamp) > dayAgo);
      default:
        return alerts;
    }
  };

  const handleClearHistory = async () => {
    setLoading(true);
    try {
      await clearAlertHistory();
      setAlerts([]);
      toast({
        title: "היסטוריה נוקתה",
        description: "היסטוריית ההתראות נוקתה בהצלחה",
      });
    } catch (error) {
      console.error("Error clearing alert history:", error);
      toast({
        title: "שגיאה בניקוי היסטוריה",
        description: "לא ניתן לנקות את היסטוריית ההתראות",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-geoalert-gray">
      <header className="sticky top-0 z-10 w-full bg-geoalert-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold text-gray-900 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-geoalert-turquoise" />
            היסטוריית התראות
          </h1>
          <div className="w-10"></div> {/* Spacer for centering */}
        </div>
      </header>
      
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="flex justify-between mb-4" dir="rtl">
          <div className="w-full sm:w-48">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger>
                <SelectValue placeholder="סנן לפי" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל ההתראות</SelectItem>
                <SelectItem value="relevant">התראות רלוונטיות</SelectItem>
                <SelectItem value="week">שבוע אחרון</SelectItem>
                <SelectItem value="day">יום אחרון</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {alerts.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="bg-white text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600">
                  <Trash2 className="h-4 w-4 mr-1" />
                  נקה היסטוריה
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>נקה היסטוריית התראות</AlertDialogTitle>
                  <AlertDialogDescription>
                    האם אתה בטוח שברצונך למחוק את כל היסטוריית ההתראות? פעולה זו אינה ניתנת לביטול.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>ביטול</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearHistory} className="bg-red-500 hover:bg-red-600">
                    אישור מחיקה
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="h-8 w-8 text-geoalert-turquoise animate-spin" />
            <span className="mr-2">טוען היסטוריה...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAlerts().length > 0 ? (
              filteredAlerts().map(alert => (
                <AlertCard key={alert.id} alert={alert} />
              ))
            ) : (
              <div className="text-center py-8 text-gray-500" dir="rtl">
                <p>לא נמצאו התראות בהיסטוריה</p>
              </div>
            )}
          </div>
        )}
      </main>
      
      <footer className="mt-auto py-4 text-center text-sm text-gray-500 border-t border-gray-200 bg-white">
        גיאו-אלרט © {new Date().getFullYear()} - כל המידע מבוסס על RSS פידים של אתרי חדשות
      </footer>
    </div>
  );
};

export default History;
