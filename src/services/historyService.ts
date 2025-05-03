
import { Alert } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';

const HISTORY_STORAGE_KEY = "geoalert_history";

/**
 * שמירת התראה להיסטוריה
 */
export async function saveAlertToHistory(alert: Alert): Promise<void> {
  try {
    // ניסיון לשמור בסופאבייס
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      console.log("Saving alert to history for authenticated user:", user.id);
      
      // בדיקה אם ההתראה קיימת בטבלת alerts
      const { data: existingAlert, error: checkError } = await supabase
        .from('alerts')
        .select('id')
        .eq('title', alert.title)
        .eq('timestamp', alert.timestamp)
        .maybeSingle();
      
      if (checkError) {
        console.error("Error checking for existing alert:", checkError);
      }
      
      let alertId = existingAlert?.id;
      
      // אם ההתראה לא קיימת, יש להוסיף אותה
      if (!alertId) {
        console.log("Alert doesn't exist, inserting new alert");
        
        const { data: newAlert, error: insertError } = await supabase
          .from('alerts')
          .insert({
            title: alert.title,
            description: alert.description,
            location: alert.location,
            timestamp: alert.timestamp,
            source: alert.source,
            link: alert.link || '',
            is_security_event: alert.isSecurityEvent,
            image_url: alert.imageUrl
          })
          .select('id')
          .single();
        
        if (insertError) {
          console.error("שגיאה בהוספת התראה לטבלת alerts:", insertError);
          throw insertError;
        }
        
        alertId = newAlert.id;
        console.log("New alert inserted with ID:", alertId);
      } else {
        console.log("Alert already exists with ID:", alertId);
      }
      
      // הוספת הקישור להיסטוריית המשתמש
      if (alertId) {
        console.log("Adding alert to user history:", alertId);
        
        const { error: historyError } = await supabase
          .from('user_alert_history')
          .insert({
            user_id: user.id,
            alert_id: alertId,
            is_relevant: alert.isRelevant || false
          });
        
        if (historyError && !historyError.message.includes('duplicate')) {
          console.error("שגיאה בהוספת התראה להיסטוריית המשתמש:", historyError);
          // אם יש שגיאה בשמירה לסופאבייס, נשמור באחסון מקומי
          saveAlertToLocalStorage(alert);
        } else {
          console.log("Alert successfully added to user history");
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
 * שמירת התראה לאחסון מקומי
 */
function saveAlertToLocalStorage(alert: Alert): void {
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
 * קבלת כל היסטוריית ההתראות
 */
export async function getAlertHistory(): Promise<Alert[]> {
  try {
    // ניסיון לקבל היסטוריה מסופאבייס
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      console.log("Getting alert history for authenticated user:", user.id);
      
      // קבלת היסטוריית ההתראות של המשתמש
      const { data: userAlerts, error: historyError } = await supabase
        .from('user_alert_history')
        .select(`
          alert_id,
          is_relevant,
          created_at,
          alerts (
            id,
            title,
            description,
            location,
            timestamp,
            source,
            link,
            is_security_event,
            image_url
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (historyError) {
        console.error("שגיאה בקבלת היסטוריית התראות:", historyError);
        // אם יש שגיאה בקבלת נתונים מסופאבייס, נשתמש באחסון מקומי
        return getAlertHistoryFromLocalStorage();
      }
      
      console.log(`Found ${userAlerts?.length || 0} alerts in history`);
      
      // המרת הנתונים למבנה של Alert
      return userAlerts.map(item => ({
        id: item.alerts.id,
        title: item.alerts.title,
        description: item.alerts.description,
        location: item.alerts.location,
        timestamp: item.alerts.timestamp,
        source: item.alerts.source,
        link: item.alerts.link || '',
        isRelevant: item.is_relevant,
        isSecurityEvent: item.alerts.is_security_event,
        imageUrl: item.alerts.image_url || undefined
      }));
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
 * קבלת היסטוריית התראות מהאחסון המקומי
 */
function getAlertHistoryFromLocalStorage(): Alert[] {
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
 * ניקוי היסטוריית ההתראות
 */
export async function clearAlertHistory(): Promise<void> {
  try {
    // ניסיון למחוק היסטוריה מסופאבייס
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { error } = await supabase
        .from('user_alert_history')
        .delete()
        .eq('user_id', user.id);
      
      if (error) {
        console.error("שגיאה בניקוי היסטוריית התראות מסופאבייס:", error);
      }
    }
    
    // ניקוי גם מהאחסון המקומי
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch (error) {
    console.error("שגיאה בניקוי היסטוריית התראות:", error);
    // במקרה של שגיאה, ניקוי רק מהאחסון המקומי
    localStorage.removeItem(HISTORY_STORAGE_KEY);
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
