
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { hasOpenAIApiKey, setOpenAIApiKey } from "@/services/alertService";
import { useToast } from "@/components/ui/use-toast";

interface ApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ApiKeyDialog({ open, onOpenChange, onSuccess }: ApiKeyDialogProps) {
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSaveApiKey = () => {
    if (!apiKey || apiKey.length < 20) {
      toast({
        title: "מפתח API לא תקין",
        description: "אנא הזן מפתח API תקין של OpenAI",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Save the API key
      setOpenAIApiKey(apiKey);
      
      toast({
        title: "מפתח ה-API נשמר בהצלחה",
        description: "האפליקציה תשתמש כעת בסיווג AI חכם באמצעות OpenAI",
      });
      
      // Call the success callback
      onSuccess();
      
      // Close the dialog
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving API key:", error);
      toast({
        title: "שגיאה בשמירת מפתח ה-API",
        description: "אנא נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" dir="rtl">
        <DialogHeader>
          <DialogTitle>הגדרת מפתח API של OpenAI</DialogTitle>
          <DialogDescription>
            הזן את מפתח ה-API של OpenAI כדי להפעיל סיווג התראות חכם באמצעות AI.
            המפתח יישמר באופן מקומי במכשיר שלך ולא יישלח לשרת.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="openai-key">מפתח API של OpenAI</Label>
            <Input
              id="openai-key"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="ltr"
            />
          </div>
          <p className="text-sm text-gray-500">
            המפתח יישמר ב-localStorage בדפדפן שלך. אם אתה משתמש במחשב משותף, זכור להסיר את המפתח לאחר השימוש.
          </p>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">בטל</Button>
          <Button onClick={handleSaveApiKey} disabled={loading}>
            {loading ? "שומר..." : "שמור מפתח"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
