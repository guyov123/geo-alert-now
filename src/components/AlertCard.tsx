
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Share2, MessageSquare } from "lucide-react";
import { Alert } from "@/types";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";
import { Button } from "./ui/button";

interface AlertCardProps {
  alert: Alert;
}

export function AlertCard({ alert }: AlertCardProps) {
  const formattedTime = formatDistanceToNow(new Date(alert.timestamp), { 
    addSuffix: true,
    locale: he 
  });

  return (
    <Card className={cn(
      "w-full transition-all duration-300 overflow-hidden",
      alert.isRelevant 
        ? "border-geoalert-turquoise bg-geoalert-turquoise/5" 
        : "border-gray-200"
    )}>
      {alert.imageUrl && (
        <div className="relative w-full h-48">
          <img
            src={alert.imageUrl}
            alt={alert.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <CardContent className="p-4" dir="rtl">
        <div className="flex justify-between items-start gap-2">
          <h3 className="text-lg font-semibold text-right">{alert.title}</h3>
          {alert.isRelevant && (
            <Badge className="bg-geoalert-turquoise whitespace-nowrap">רלוונטי</Badge>
          )}
        </div>
        
        <p className="mt-2 text-sm text-gray-600 text-right">{alert.description}</p>
        
        <div className="flex flex-wrap items-center gap-4 mt-3">
          <div className="flex items-center text-xs text-gray-500">
            <MapPin className="h-3.5 w-3.5 ml-1" />
            <span>{alert.location}</span>
          </div>
          
          <div className="flex items-center text-xs text-gray-500">
            <Clock className="h-3.5 w-3.5 ml-1" />
            <span>{formattedTime}</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="px-4 pb-4 pt-0 flex justify-between items-center border-t border-gray-100 mt-2 pt-2" dir="rtl">
        <span className="text-xs text-gray-500">מקור: {alert.source}</span>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="text-gray-500 hover:text-geoalert-turquoise">
            <MessageSquare className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-gray-500 hover:text-geoalert-turquoise"
            onClick={() => {
              if (alert.link) {
                window.open(alert.link, '_blank');
              }
            }}
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
