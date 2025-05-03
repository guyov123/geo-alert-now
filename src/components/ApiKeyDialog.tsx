
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

interface ApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

// This component is no longer used as API keys are now managed server-side
// It is kept for backward compatibility but disabled
export function ApiKeyDialog({ open, onOpenChange, onSuccess }: ApiKeyDialogProps) {
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSaveApiKey = async () => {
    toast({
      title: "שינוי במערכת",
      description: "מפתחות API מנוהלים כעת בשרת ולא נדרשת הזנה ידנית",
    });
    
    // Call success callback to close dialog
    onSuccess();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" dir="rtl">
        <DialogHeader>
          <DialogTitle>ניהול מפתחות API</DialogTitle>
          <DialogDescription>
            המערכת עברה לשימוש במפתח API מרכזי בשרת.
            אין צורך להזין מפתח API אישי.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="openai-key">עדכון מערכת</Label>
            <p className="text-sm text-gray-500">
              המערכת כעת משתמשת במפתח API מרכזי שמוגדר בשרת.
              כל המשתמשים נהנים מסיווג AI אוטומטי ללא צורך בהגדרות.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">סגור</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
