
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Get the API key from Supabase Edge Function secrets
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to build the OpenAI prompt
function buildPrompt(text: string): string {
  return `
טקסט: "${text}"

1. האם מדובר באירוע ביטחוני? ענה true או false בלבד.
2. אם מוזכר מיקום (עיר, יישוב, אזור גאוגרפי), כתוב את שם המקום בלבד.
3. אם לא ניתן להבין מה המיקום – כתוב null.

ענה בדיוק בפורמט JSON הבא:
{
  "is_security_event": true/false,
  "location": "שם המקום או null"
}
`;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if the API key is configured
    if (!openAIApiKey) {
      console.error("OpenAI API key is not configured in Edge Function secrets");
      return new Response(
        JSON.stringify({ 
          error: "OpenAI API key not configured on the server" 
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

    // Parse the request body
    const { text, userLocation } = await req.json();
    
    if (!text) {
      return new Response(
        JSON.stringify({ error: "Missing text parameter" }),
        { 
          status: 400, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    console.log("Classifying alert text:", text.substring(0, 100) + "...");
    
    // Create the prompt for OpenAI
    const prompt = buildPrompt(text);
    
    // Call OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openAIApiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", errorText);
      return new Response(
        JSON.stringify({ 
          error: "Error calling OpenAI API", 
          details: errorText 
        }),
        { 
          status: response.status, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }
    
    // Parse OpenAI response
    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    try {
      // Parse the JSON response from OpenAI
      const result = JSON.parse(aiResponse);
      
      // Return the classification result
      return new Response(
        JSON.stringify(result),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    } catch (e) {
      console.error("Error parsing AI response:", e, aiResponse);
      return new Response(
        JSON.stringify({ 
          error: "Failed to parse AI response", 
          aiResponse 
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
    console.error("Error in classify-alert function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error" }),
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
