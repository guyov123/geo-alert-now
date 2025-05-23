
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Get the API key from Supabase Edge Function secrets
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to validate OpenAI API key format
function isValidOpenAIApiKey(apiKey: string | undefined): boolean {
  if (!apiKey) return false;
  // OpenAI API keys typically start with "sk-" and are fairly long
  return apiKey.startsWith('sk-') && apiKey.length > 20;
}

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
    // Check if the API key is configured and valid
    if (!openAIApiKey) {
      console.error("OpenAI API key is not configured in Edge Function secrets");
      return new Response(
        JSON.stringify({ 
          error: "OpenAI API key not configured on the server",
          details: "Please add OPENAI_API_KEY secret in the Supabase Edge Functions settings"
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

    if (!isValidOpenAIApiKey(openAIApiKey)) {
      console.error(`Invalid OpenAI API key format: Key length = ${openAIApiKey.length}, starts with correct prefix = ${openAIApiKey.startsWith('sk-')}`);
      return new Response(
        JSON.stringify({ 
          error: "Invalid OpenAI API key format",
          details: "The OPENAI_API_KEY secret appears to be in an incorrect format. It should start with 'sk-' and be fairly long."
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
    console.log("Using OpenAI API key (masked):", `sk-****${openAIApiKey.slice(-4)}`);
    
    // Create the prompt for OpenAI
    const prompt = buildPrompt(text);
    
    try {
      // Call OpenAI API
      console.log("Sending request to OpenAI API...");
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
        console.error("Status code:", response.status);
        return new Response(
          JSON.stringify({ 
            error: "Error calling OpenAI API", 
            details: errorText,
            status: response.status
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
      console.log("OpenAI response received successfully");
      const aiResponse = data.choices[0].message.content;
      
      try {
        // Parse the JSON response from OpenAI
        const result = JSON.parse(aiResponse);
        console.log("Successful classification:", result);
        
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
    } catch (apiError) {
      console.error("Error making request to OpenAI:", apiError);
      return new Response(
        JSON.stringify({ 
          error: "Error making request to OpenAI API", 
          details: apiError.message || "Unknown API error"
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
