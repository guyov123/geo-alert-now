
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface ApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

// Server-side only implementation - API keys are now managed on the server
export function ApiKeyDialog({ open, onOpenChange, onSuccess }: ApiKeyDialogProps) {
  const { toast } = useToast();

  const handleClose = () => {
    toast({
      title: "מערכת עם מפתח מרכזי",
      description: "המערכת משתמשת במפתח API מרכזי בשרת. אין צורך בהגדרות נוספות.",
    });
    
    onSuccess();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" dir="rtl">
        <DialogHeader>
          <DialogTitle>ניהול API מרכזי</DialogTitle>
          <DialogDescription>
            המערכת משתמשת במפתח API מרכזי שמוגדר בשרת.
            כל המשתמשים נהנים מסיווג AI אוטומטי ללא צורך בהגדרות נוספות.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={handleClose} variant="default">הבנתי</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
