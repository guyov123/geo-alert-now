
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { BellOff } from "lucide-react";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSnoozeChange: (minutes: number) => void;
  snoozeActive: boolean;
}

export function SettingsDialog({
  open,
  onOpenChange,
  onSnoozeChange,
  snoozeActive,
}: SettingsDialogProps) {
  const [snoozeDuration, setSnoozeDuration] = useState("30");
  const [isSnoozed, setIsSnoozed] = useState(snoozeActive);

  const handleSaveSettings = () => {
    if (isSnoozed) {
      onSnoozeChange(parseInt(snoozeDuration));
    } else {
      onSnoozeChange(0); // Disable snooze
    }
    onOpenChange(false);
  };

  const handleSnoozeToggle = (checked: boolean) => {
    setIsSnoozed(checked);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">הגדרות</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BellOff className="h-5 w-5 text-gray-600" />
              <Label htmlFor="snooze-toggle" className="text-right">השתק התראות</Label>
            </div>
            <Switch 
              id="snooze-toggle" 
              checked={isSnoozed}
              onCheckedChange={handleSnoozeToggle}
            />
          </div>

          {isSnoozed && (
            <div className="grid gap-2">
              <Label htmlFor="snooze-duration" className="text-right">למשך זמן</Label>
              <Select
                value={snoozeDuration}
                onValueChange={setSnoozeDuration}
              >
                <SelectTrigger id="snooze-duration" className="text-right">
                  <SelectValue placeholder="בחר משך זמן" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="15">15 דקות</SelectItem>
                  <SelectItem value="30">30 דקות</SelectItem>
                  <SelectItem value="60">שעה</SelectItem>
                  <SelectItem value="120">שעתיים</SelectItem>
                  <SelectItem value="1440">יום שלם</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter className="flex justify-end gap-2">
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              ביטול
            </Button>
          </DialogClose>
          <Button 
            type="button" 
            onClick={handleSaveSettings}
            className="bg-geoalert-turquoise hover:bg-geoalert-turquoise/90"
          >
            שמור
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
