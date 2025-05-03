
import { Alert } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';
import { 
  saveAlertToLocalStorage, 
  getAlertHistoryFromLocalStorage, 
  clearLocalAlertHistory
} from './localStorageService';
import { 
  saveAlertToDatabase, 
  addAlertToUserHistory, 
  getAlertHistoryFromDatabase, 
  clearDatabaseAlertHistory 
} from './databaseService';

/**
 * שמירת התראה להיסטוריה
 */
export async function saveAlertToHistory(alert: Alert): Promise<void> {
  try {
    // ניסיון לשמור בסופאבייס
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      console.log("Saving alert to history for authenticated user:", user.id);
      
      // ניסיון לשמור בבסיס הנתונים
      const alertId = await saveAlertToDatabase(alert, user.id);
      
      if (alertId) {
        // הוספת הקישור להיסטוריית המשתמש
        const success = await addAlertToUserHistory(user.id, alertId, alert.isRelevant || false);
        
        if (!success) {
          // אם יש שגיאה בשמירה לסופאבייס, נשמור באחסון מקומי
          saveAlertToLocalStorage(alert);
        }
      }
    } else {
      // אם אין משתמש מחובר, שמירה באחסון מקומי
      console.log("No authenticated user, saving to local storage");
      saveAlertToLocalStorage(alert);
    }
  } catch (error) {
    console.error("שגיאה בשמירת התראה להיסטוריה:", error);
    // במקרה של שגיאה, שמירה באחסון מקומי
    saveAlertToLocalStorage(alert);
  }
}

/**
 * קבלת כל היסטוריית ההתראות
 */
export async function getAlertHistory(): Promise<Alert[]> {
  try {
    // ניסיון לקבל היסטוריה מסופאבייס
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      console.log("Getting alert history for authenticated user:", user.id);
      
      try {
        return await getAlertHistoryFromDatabase(user.id);
      } catch (error) {
        // אם יש שגיאה בקבלת נתונים מסופאבייס, נשתמש באחסון מקומי
        console.error("Error fetching from database, falling back to local storage", error);
        return getAlertHistoryFromLocalStorage();
      }
    } else {
      // אם אין משתמש מחובר, השתמש באחסון מקומי
      console.log("No authenticated user, getting history from local storage");
      return getAlertHistoryFromLocalStorage();
    }
  } catch (error) {
    console.error("שגיאה בקריאת היסטוריית התראות:", error);
    // במקרה של שגיאה, קריאה מהאחסון המקומי
    return getAlertHistoryFromLocalStorage();
  }
}

/**
 * ניקוי היסטוריית ההתראות
 */
export async function clearAlertHistory(): Promise<void> {
  try {
    // ניסיון למחוק היסטוריה מסופאבייס
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      await clearDatabaseAlertHistory(user.id);
    }
    
    // ניקוי גם מהאחסון המקומי
    clearLocalAlertHistory();
  } catch (error) {
    console.error("שגיאה בניקוי היסטוריית התראות:", error);
    // במקרה של שגיאה, ניקוי רק מהאחסון המקומי
    clearLocalAlertHistory();
  }
}

/**
 * שמירת מספר התראות להיסטוריה
 */
export async function saveAlertsToHistory(alerts: Alert[]): Promise<void> {
  try {
    console.log(`Saving ${alerts.length} alerts to history`);
    
    // לכל התראה נפעיל את פונקציית השמירה הבודדת
    for (const alert of alerts) {
      if (alert.isSecurityEvent) {
        // התראות ביטחוניות בלבד ישמרו בהיסטוריה
        
        // וידוא שיש מזהה להתראה
        if (!alert.id) {
          alert.id = uuidv4();
        }
        
        await saveAlertToHistory(alert);
      }
    }
    
    console.log("Completed saving alerts to history");
  } catch (error) {
    console.error("שגיאה בשמירת התראות להיסטוריה:", error);
  }
}
