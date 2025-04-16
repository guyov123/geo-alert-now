
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setOpenAIApiKey } from "@/services/alertService";
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

  const handleSaveApiKey = async () => {
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
      // שמירת המפתח בסופהבייס
      await setOpenAIApiKey(apiKey);
      
      toast({
        title: "מפתח ה-API נשמר בהצלחה",
        description: "האפליקציה תשתמש כעת בסיווג AI חכם באמצעות OpenAI",
      });
      
      // קריאה לקולבק של הצלחה
      onSuccess();
      
      // סגירת הדיאלוג
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving API key:", error);
      toast({
        title: "שגיאה בשמירת מפתח ה-API",
        description: "אנא נסה שוב מאוחר יותר או התחבר לחשבון",
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
            המפתח יישמר באופן מאובטח בחשבון שלך וגם מקומית במכשיר שלך.
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
            המפתח יישמר בחשבון שלך וגם ב-localStorage בדפדפן שלך. המפתח יהיה זמין בכל המכשירים שבהם תתחבר לחשבון.
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
