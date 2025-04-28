
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      throw new Error("מפתח API של OpenAI לא מוגדר");
    }
    
    const { message } = await req.json();

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'אתה עוזר וירטואלי מרגיע. בכל פעם שמשתמש פונה אליך בלחץ או פחד, תענה בצורה אמפתית, תציע הרגעה, נשימות עמוקות, ותזכיר שהכל זמני. אל תספק מידע חדשותי, רק תמיכה רגשית.'
            },
            { role: 'user', content: message }
          ],
          temperature: 0.7,
          max_tokens: 150,
        }),
      });

      const data = await response.json();
      
      // בדיקה אם OpenAI החזיר שגיאה
      if (data.error) {
        console.error("OpenAI API error:", JSON.stringify(data.error));
        
        if (data.error.type === "insufficient_quota") {
          return new Response(
            JSON.stringify({ 
              error: "חריגה ממכסת השימוש ב-API של OpenAI. אנא בדוק את פרטי החיוב שלך."
            }),
            { 
              status: 402, // Payment Required - מתאים לשגיאת מכסה
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
              }
            }
          );
        }
        
        throw new Error(data.error.message || "שגיאה לא מוגדרת מ-OpenAI API");
      }
      
      const aiResponse = data.choices[0].message.content;

      return new Response(
        JSON.stringify({ message: aiResponse }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json'
          } 
        }
      );
    } catch (apiError) {
      console.error('OpenAI API error:', apiError);
      
      return new Response(
        JSON.stringify({ 
          error: apiError.message || "שגיאה בתקשורת עם OpenAI API"
        }),
        { 
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }
  } catch (error) {
    console.error('Error in chat-calm function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "שגיאת שרת פנימית"
      }),
      { 
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
