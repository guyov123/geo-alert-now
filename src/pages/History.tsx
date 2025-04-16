
import { useState, useEffect } from "react";
import { Alert } from "@/types";
import { AlertCard } from "@/components/AlertCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";

const History = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    // In a real app, this would fetch from localStorage or a backend
    // For demo purposes, we're using mock data
    const mockHistoryAlerts: Alert[] = [
      {
        id: "h1",
        title: "אזעקות נשמעו בנהריה ובסביבתה",
        description: "אזעקות נשמעו בנהריה ובסביבתה בעקבות חשש לירי רקטות מלבנון.",
        location: "נהריה",
        timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        isRelevant: false,
        source: "Ynet",
        link: "https://example.com/news/h1"
      },
      {
        id: "h2",
        title: "אזעקה בתל אביב: יירוט מוצלח של טיל",
        description: "אזעקה נשמעה בתל אביב וסביבתה. דווח על יירוט מוצלח של טיל שנורה מעזה.",
        location: "תל אביב",
        timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        isRelevant: true,
        source: "מעריב",
        link: "https://example.com/news/h2"
      },
      {
        id: "h3",
        title: "חשד לחדירת מחבלים ביישובי הדרום",
        description: "התראה על חשד לחדירת מחבלים באזור יישובי עוטף עזה. כוחות צה\"ל פועלים בשטח.",
        location: "עוטף עזה",
        timestamp: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
        isRelevant: false,
        source: "וואלה",
        link: "https://example.com/news/h3"
      },
      {
        id: "h4",
        title: "אזעקה במרכז הארץ: שני טילים יורטו בהצלחה",
        description: "אזעקות נשמעו במרכז הארץ כולל תל אביב, רמת גן, חולון ובת ים. שני טילים יורטו על ידי כיפת ברזל.",
        location: "תל אביב",
        timestamp: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
        isRelevant: true,
        source: "Ynet",
        link: "https://example.com/news/h4"
      },
      {
        id: "h5",
        title: "אזעקות בירושלים: האיום חלף",
        description: "אזעקות נשמעו בירושלים וביישובי הסביבה. לאחר מספר דקות הוכרז כי האיום חלף.",
        location: "ירושלים",
        timestamp: new Date(Date.now() - 432000000).toISOString(), // 5 days ago
        isRelevant: false,
        source: "מעריב",
        link: "https://example.com/news/h5"
      }
    ];
    
    setAlerts(mockHistoryAlerts);
  }, []);

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
        <div className="flex justify-end mb-4" dir="rtl">
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
        </div>
        
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
      </main>
      
      <footer className="mt-auto py-4 text-center text-sm text-gray-500 border-t border-gray-200 bg-white">
        גיאו-אלרט © {new Date().getFullYear()} - כל המידע מבוסס על RSS פידים של אתרי חדשות
      </footer>
    </div>
  );
};

export default History;
