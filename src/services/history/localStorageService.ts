
import { Alert } from "@/types";

const HISTORY_STORAGE_KEY = "geoalert_history";

/**
 * שמירת התראה לאחסון מקומי
 */
export function saveAlertToLocalStorage(alert: Alert): void {
  try {
    // קבלת ההיסטוריה הקיימת
    const history = getAlertHistoryFromLocalStorage();
    
    // בדיקה אם ההתראה כבר קיימת בהיסטוריה (לפי ID)
    const exists = history.some(item => item.id === alert.id);
    
    // אם ההתראה לא קיימת, נוסיף אותה
    if (!exists) {
      // הוספת ההתראה בתחילת המערך (התראות חדשות בהתחלה)
      history.unshift(alert);
      
      // הגבלה ל-50 התראות אחרונות
      const limitedHistory = history.slice(0, 50);
      
      // שמירה מחדש של ההיסטוריה
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(limitedHistory));
    }
  } catch (error) {
    console.error("שגיאה בשמירת התראה לאחסון מקומי:", error);
  }
}

/**
 * קבלת היסטוריית התראות מהאחסון המקומי
 */
export function getAlertHistoryFromLocalStorage(): Alert[] {
  try {
    const historyJson = localStorage.getItem(HISTORY_STORAGE_KEY);
    
    if (!historyJson) {
      return [];
    }
    
    return JSON.parse(historyJson);
  } catch (error) {
    console.error("שגיאה בקריאת היסטוריית התראות מהאחסון המקומי:", error);
    return [];
  }
}

/**
 * ניקוי היסטוריית ההתראות מהאחסון המקומי
 */
export function clearLocalAlertHistory(): void {
  try {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch (error) {
    console.error("שגיאה בניקוי היסטוריית התראות מהאחסון המקומי:", error);
  }
}
