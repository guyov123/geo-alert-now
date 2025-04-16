
import { Alert } from "@/types";

const HISTORY_STORAGE_KEY = "geoalert_history";

/**
 * שמירת התראה להיסטוריה
 */
export function saveAlertToHistory(alert: Alert): void {
  try {
    // קבלת ההיסטוריה הקיימת
    const history = getAlertHistory();
    
    // בדיקה אם ההתראה כבר קיימת בהיסטוריה (לפי ID)
    const exists = history.some(item => item.id === alert.id);
    
    // אם ההתראה לא קיימת, נוסיף אותה
    if (!exists) {
      // הוספת ההתראה בתחילת המערך (התראות חדשות בהתחלה)
      history.unshift(alert);
      
      // שמירה מחדש של ההיסטוריה
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    }
  } catch (error) {
    console.error("שגיאה בשמירת התראה להיסטוריה:", error);
  }
}

/**
 * קבלת כל היסטוריית ההתראות
 */
export function getAlertHistory(): Alert[] {
  try {
    const historyJson = localStorage.getItem(HISTORY_STORAGE_KEY);
    
    if (!historyJson) {
      return [];
    }
    
    return JSON.parse(historyJson);
  } catch (error) {
    console.error("שגיאה בקריאת היסטוריית התראות:", error);
    return [];
  }
}

/**
 * ניקוי היסטוריית ההתראות
 */
export function clearAlertHistory(): void {
  try {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch (error) {
    console.error("שגיאה בניקוי היסטוריית התראות:", error);
  }
}

/**
 * שמירת מספר התראות להיסטוריה
 */
export function saveAlertsToHistory(alerts: Alert[]): void {
  try {
    // לכל התראה נפעיל את פונקציית השמירה הבודדת
    alerts.forEach(alert => {
      if (alert.isSecurityEvent) {
        saveAlertToHistory(alert);
      }
    });
  } catch (error) {
    console.error("שגיאה בשמירת התראות להיסטוריה:", error);
  }
}
