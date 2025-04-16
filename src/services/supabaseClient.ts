
import { createClient } from '@supabase/supabase-js';

// קריאת פרטי ההתחברות מהסביבה
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// בדיקה אם המשתנים קיימים
let supabase;

// ניסיון ליצור לקוח סופהבייס
try {
  if (!supabaseUrl || !supabaseAnonKey) {
    // לוגיקת גיבוי אם אין מפתחות סופהבייס
    console.warn('Supabase environment variables are missing. Using localStorage only.');
    // יצירת מוק של לקוח סופהבייס עם לוגיקת גיבוי מקומית
    supabase = {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: null }),
          }),
        }),
        upsert: async () => ({ error: null }),
      }),
    };
  } else {
    // יצירת לקוח סופהבייס אמיתי
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
} catch (error) {
  console.error('Error initializing Supabase client:', error);
  // יצירת מוק במקרה של שגיאה
  supabase = {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: null }),
        }),
      }),
      upsert: async () => ({ error: null }),
    }),
  };
}

export { supabase };

/**
 * שמירת מפתח API של OpenAI בסופהבייס
 */
export async function saveOpenAIApiKey(key: string): Promise<void> {
  try {
    // בדיקה אם המשתמש מחובר
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      // שמירה מקומית בלבד אם המשתמש לא מחובר
      localStorage.setItem('openai_api_key', key);
      return;
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
    // במקרה של שגיאה, שומרים רק מקומית
    localStorage.setItem('openai_api_key', key);
  }
}

/**
 * קריאת מפתח API של OpenAI מסופהבייס
 */
export async function getOpenAIApiKeyFromSupabase(): Promise<string | null> {
  try {
    // בדיקה אם המשתמש מחובר
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return localStorage.getItem('openai_api_key');
    }
    
    // קריאת המפתח מטבלת המשתמשים
    const { data, error } = await supabase
      .from('user_settings')
      .select('openai_api_key')
      .eq('user_id', user.id)
      .single();
    
    if (error) {
      console.error('שגיאה בקריאת מפתח ה-API:', error);
      return localStorage.getItem('openai_api_key');
    }
    
    if (data?.openai_api_key) {
      // שמירה מקומית לשימוש עתידי
      localStorage.setItem('openai_api_key', data.openai_api_key);
      return data.openai_api_key;
    }
    
    return localStorage.getItem('openai_api_key');
  } catch (error) {
    console.error('שגיאה בקריאת מפתח ה-API:', error);
    // במקרה של שגיאה, מנסים לקבל מהאחסון המקומי
    return localStorage.getItem('openai_api_key');
  }
}

/**
 * בדיקה אם קיים מפתח API של OpenAI
 */
export async function hasOpenAIApiKeyInSupabase(): Promise<boolean> {
  const key = await getOpenAIApiKeyFromSupabase();
  return key !== null && key.length > 0;
}
