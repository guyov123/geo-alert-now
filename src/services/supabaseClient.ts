
import { createClient } from '@supabase/supabase-js';

// קריאת פרטי ההתחברות מהסביבה
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// יצירת לקוח סופהבייס
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// פונקציות עזר לניהול מפתח API של OpenAI

/**
 * שמירת מפתח API של OpenAI בסופהבייס
 */
export async function saveOpenAIApiKey(key: string): Promise<void> {
  try {
    // בדיקה אם המשתמש מחובר
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('יש להתחבר כדי לשמור את מפתח ה-API');
    }
    
    // שמירת המפתח בטבלת המשתמשים
    const { error } = await supabase
      .from('user_settings')
      .upsert({ 
        user_id: user.id, 
        openai_api_key: key,
        updated_at: new Date().toISOString()
      });
    
    if (error) throw error;
    
    // שמירה מקומית לשימוש מיידי
    localStorage.setItem('openai_api_key', key);
  } catch (error) {
    console.error('שגיאה בשמירת מפתח ה-API:', error);
    throw error;
  }
}

/**
 * קריאת מפתח API של OpenAI מסופהבייס
 */
export async function getOpenAIApiKey(): Promise<string | null> {
  try {
    // קודם כל בדיקה אם המפתח קיים ב-localStorage
    const localKey = localStorage.getItem('openai_api_key');
    if (localKey) return localKey;
    
    // בדיקה אם המשתמש מחובר
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return null;
    }
    
    // קריאת המפתח מטבלת המשתמשים
    const { data, error } = await supabase
      .from('user_settings')
      .select('openai_api_key')
      .eq('user_id', user.id)
      .single();
    
    if (error) {
      console.error('שגיאה בקריאת מפתח ה-API:', error);
      return null;
    }
    
    if (data?.openai_api_key) {
      // שמירה מקומית לשימוש עתידי
      localStorage.setItem('openai_api_key', data.openai_api_key);
      return data.openai_api_key;
    }
    
    return null;
  } catch (error) {
    console.error('שגיאה בקריאת מפתח ה-API:', error);
    return null;
  }
}

/**
 * בדיקה אם קיים מפתח API של OpenAI
 */
export async function hasOpenAIApiKey(): Promise<boolean> {
  const key = await getOpenAIApiKey();
  return key !== null && key.length > 0;
}
