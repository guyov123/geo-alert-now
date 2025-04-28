
import { Home, Clock, Rss } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export function BottomNav() {
  const location = useLocation();
  
  return (
    <div className="fixed bottom-0 w-full bg-white border-t border-gray-200 shadow-md py-2 px-6 z-50">
      <div className="flex justify-around items-center">
        <Link
          to="/rss"
          className={`flex flex-col items-center p-2 ${
            location.pathname === "/rss"
              ? "text-geoalert-turquoise"
              : "text-gray-600"
          }`}
        >
          <Rss className="h-6 w-6" />
          <span className="text-xs mt-1">מקורות</span>
        </Link>
        
        <Link
          to="/"
          className={`flex flex-col items-center p-2 ${
            location.pathname === "/"
              ? "text-geoalert-turquoise"
              : "text-gray-600"
          }`}
        >
          <Home className="h-6 w-6" />
          <span className="text-xs mt-1">ראשי</span>
        </Link>
        
        <Link
          to="/history"
          className={`flex flex-col items-center p-2 ${
            location.pathname === "/history"
              ? "text-geoalert-turquoise"
              : "text-gray-600"
          }`}
        >
          <Clock className="h-6 w-6" />
          <span className="text-xs mt-1">היסטוריה</span>
        </Link>
      </div>
    </div>
  );
}
