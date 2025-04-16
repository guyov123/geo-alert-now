
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Brain, Key } from "lucide-react";
import { useState } from "react";
import { hasOpenAIApiKey } from "@/services/alertService";

interface RefreshButtonProps {
  useAI: boolean;
  onAIToggle: () => void;
  onApiKeyDialogOpen: () => void;
}

export function RefreshButton({ useAI, onAIToggle, onApiKeyDialogOpen }: RefreshButtonProps) {
  const { toast } = useToast();

  return (
    <div className="flex justify-between mb-4">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onAIToggle}
        className="flex items-center gap-1"
      >
        <span>{useAI ? "סיווג AI" : "סיווג רגיל"}</span>
        <div className={`h-2 w-2 rounded-full ${useAI ? "bg-green-500" : "bg-gray-400"}`}></div>
      </Button>
      
      {useAI && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onApiKeyDialogOpen}
          className="flex items-center gap-1 mx-2"
        >
          <Key className="h-4 w-4 text-geoalert-turquoise" />
          <span>שינוי מפתח API</span>
        </Button>
      )}
    </div>
  );
}
