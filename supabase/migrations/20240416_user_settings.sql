
-- טבלה לשמירת הגדרות משתמש, כולל מפתח API של OpenAI
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  openai_api_key TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- הרשאות RLS לטבלת הגדרות משתמש
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- מדיניות קריאה - משתמש יכול לקרוא רק את ההגדרות שלו
CREATE POLICY "Users can read their own settings" ON public.user_settings
  FOR SELECT
  USING (auth.uid() = user_id);

-- מדיניות עדכון - משתמש יכול לעדכן רק את ההגדרות שלו
CREATE POLICY "Users can update their own settings" ON public.user_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

-- מדיניות הוספה - משתמש יכול להוסיף רק הגדרות לעצמו
CREATE POLICY "Users can insert their own settings" ON public.user_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- מדיניות מחיקה - משתמש יכול למחוק רק את ההגדרות שלו
CREATE POLICY "Users can delete their own settings" ON public.user_settings
  FOR DELETE
  USING (auth.uid() = user_id);
