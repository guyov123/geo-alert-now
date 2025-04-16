
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";

export function HistoryLink() {
  return (
    <Link to="/history">
      <Button variant="outline" size="sm" className="flex items-center gap-1">
        <Clock className="h-4 w-4 text-geoalert-turquoise" />
        <span>היסטוריה</span>
      </Button>
    </Link>
  );
}
