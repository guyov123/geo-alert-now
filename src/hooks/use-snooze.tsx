
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export function useSnooze(refreshAlertsCallback: (location: string) => Promise<void>) {
  const [snoozeActive, setSnoozeActive] = useState<boolean>(false);
  const [snoozeEndTime, setSnoozeEndTime] = useState<Date | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const checkSnoozeStatus = () => {
      if (snoozeActive && snoozeEndTime && new Date() > snoozeEndTime) {
        setSnoozeActive(false);
        setSnoozeEndTime(null);
        toast({
          title: "התראות פעילות שוב",
          description: "מצב השתקה הסתיים. התראות יוצגו כרגיל.",
        });
      }
    };

    checkSnoozeStatus();
    const interval = setInterval(checkSnoozeStatus, 60000);

    return () => clearInterval(interval);
  }, [snoozeActive, snoozeEndTime, toast]);

  const handleSnoozeChange = (minutes: number, currentLocation: string) => {
    if (minutes === 0) {
      setSnoozeActive(false);
      setSnoozeEndTime(null);
      toast({
        title: "התראות פעילות",
        description: "מצב השקט בוטל. כל ההתראות יוצגו כרגיל.",
      });
      // Refresh alerts when snooze is canceled
      refreshAlertsCallback(currentLocation);
    } else {
      const endTime = new Date();
      endTime.setMinutes(endTime.getMinutes() + minutes);
      setSnoozeActive(true);
      setSnoozeEndTime(endTime);
      toast({
        title: "התראות הושתקו",
        description: `לא יוצגו התראות חדשות במשך ${minutes} דקות`,
      });
    }
  };

  return {
    snoozeActive,
    snoozeEndTime,
    handleSnoozeChange
  };
}
