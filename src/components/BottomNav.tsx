
import { Home, History, User, Search } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 flex justify-around items-center z-50">
      <Link 
        to="/" 
        className={cn(
          "flex flex-col items-center text-sm",
          location.pathname === "/" ? "text-geoalert-turquoise" : "text-gray-500"
        )}
      >
        <Home className="h-5 w-5" />
        <span className="text-xs mt-1">בית</span>
      </Link>
      
      <Link 
        to="/search" 
        className={cn(
          "flex flex-col items-center text-sm",
          location.pathname === "/search" ? "text-geoalert-turquoise" : "text-gray-500"
        )}
      >
        <Search className="h-5 w-5" />
        <span className="text-xs mt-1">חיפוש</span>
      </Link>
      
      <Link 
        to="/history" 
        className={cn(
          "flex flex-col items-center text-sm",
          location.pathname === "/history" ? "text-geoalert-turquoise" : "text-gray-500"
        )}
      >
        <History className="h-5 w-5" />
        <span className="text-xs mt-1">היסטוריה</span>
      </Link>
      
      <Link 
        to="/profile" 
        className={cn(
          "flex flex-col items-center text-sm",
          location.pathname === "/profile" ? "text-geoalert-turquoise" : "text-gray-500"
        )}
      >
        <User className="h-5 w-5" />
        <span className="text-xs mt-1">פרופיל</span>
      </Link>
    </nav>
  );
}
