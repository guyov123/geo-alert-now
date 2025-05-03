
import { Alert } from "@/types";
import { supabase } from "@/integrations/supabase/client";

/**
 * שמירת התראה לבסיס הנתונים
 */
export async function saveAlertToDatabase(alert: Alert, userId: string): Promise<string | undefined> {
  try {
    console.log("Saving alert to database for user:", userId);
    
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
    
    return alertId;
  } catch (error) {
    console.error("שגיאה בשמירת התראה לבסיס הנתונים:", error);
    return undefined;
  }
}

/**
 * הוספת התראה להיסטוריית המשתמש
 */
export async function addAlertToUserHistory(userId: string, alertId: string, isRelevant: boolean = false): Promise<boolean> {
  try {
    console.log("Adding alert to user history:", alertId);
    
    const { error: historyError } = await supabase
      .from('user_alert_history')
      .insert({
        user_id: userId,
        alert_id: alertId,
        is_relevant: isRelevant
      });
    
    if (historyError && !historyError.message.includes('duplicate')) {
      console.error("שגיאה בהוספת התראה להיסטוריית המשתמש:", historyError);
      return false;
    }
    
    console.log("Alert successfully added to user history");
    return true;
  } catch (error) {
    console.error("שגיאה בהוספת התראה להיסטוריית המשתמש:", error);
    return false;
  }
}

/**
 * קבלת היסטוריית התראות מבסיס הנתונים
 */
export async function getAlertHistoryFromDatabase(userId: string): Promise<Alert[]> {
  try {
    console.log("Getting alert history from database for user:", userId);
    
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
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (historyError) {
      console.error("שגיאה בקבלת היסטוריית התראות:", historyError);
      throw historyError;
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
  } catch (error) {
    console.error("שגיאה בקריאת היסטוריית התראות מבסיס הנתונים:", error);
    throw error;
  }
}

/**
 * ניקוי היסטוריית ההתראות מבסיס הנתונים
 */
export async function clearDatabaseAlertHistory(userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_alert_history')
      .delete()
      .eq('user_id', userId);
    
    if (error) {
      console.error("שגיאה בניקוי היסטוריית התראות מסופאבייס:", error);
      throw error;
    }
  } catch (error) {
    console.error("שגיאה בניקוי היסטוריית התראות מבסיס הנתונים:", error);
    throw error;
  }
}
