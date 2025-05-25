
import { Alert } from "@/types";

/**
 * Check if an alert is from the last 24 hours
 */
export function isAlertRecent(alert: Alert, hoursThreshold: number = 24): boolean {
  try {
    const alertTime = new Date(alert.timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - alertTime.getTime()) / (1000 * 60 * 60);
    
    // Check if the date is valid
    if (isNaN(alertTime.getTime())) {
      console.warn(`Invalid date for alert: ${alert.timestamp}`);
      return false;
    }
    
    // Check if the alert is from the future (likely invalid)
    if (diffInHours < 0) {
      console.warn(`Alert appears to be from the future: ${alert.timestamp}`);
      return false;
    }
    
    return diffInHours <= hoursThreshold;
  } catch (error) {
    console.error("Error checking alert recency:", error);
    return false;
  }
}

/**
 * Filter alerts to show only recent ones
 */
export function filterRecentAlerts(alerts: Alert[], hoursThreshold: number = 24): Alert[] {
  return alerts.filter(alert => isAlertRecent(alert, hoursThreshold));
}

/**
 * Get relative time string with validation
 */
export function getRelativeTimeString(timestamp: string): string {
  try {
    const alertTime = new Date(timestamp);
    const now = new Date();
    
    if (isNaN(alertTime.getTime())) {
      return "זמן לא תקין";
    }
    
    const diffInMinutes = (now.getTime() - alertTime.getTime()) / (1000 * 60);
    
    if (diffInMinutes < 0) {
      return "זמן לא תקין";
    }
    
    if (diffInMinutes < 60) {
      const minutes = Math.floor(diffInMinutes);
      return minutes === 0 ? "כעת" : `לפני ${minutes} דקות`;
    }
    
    const diffInHours = diffInMinutes / 60;
    if (diffInHours < 24) {
      return `לפני ${Math.floor(diffInHours)} שעות`;
    }
    
    const diffInDays = diffInHours / 24;
    return `לפני ${Math.floor(diffInDays)} ימים`;
  } catch (error) {
    console.error("Error formatting relative time:", error);
    return "זמן לא תקין";
  }
}
