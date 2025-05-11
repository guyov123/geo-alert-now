
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const FIREBASE_CLIENT_EMAIL = Deno.env.get('FIREBASE_CLIENT_EMAIL');
const FIREBASE_PRIVATE_KEY = Deno.env.get('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n');
const FIREBASE_PROJECT_ID = Deno.env.get('FIREBASE_PROJECT_ID');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check for required Firebase credentials
    if (!FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY || !FIREBASE_PROJECT_ID) {
      throw new Error('Missing Firebase authentication details');
    }

    const { user_id, title, body, data = {} } = await req.json();
    
    if (!user_id || !title || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Create supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Get user's FCM token
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('fcm_token')
      .eq('id', user_id)
      .single();
      
    if (profileError || !profile.fcm_token) {
      return new Response(
        JSON.stringify({ error: 'No FCM token found for user' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Create JWT for Firebase Admin SDK
    const token = await createFirebaseJWT();
    
    // Send the notification
    const fcmResponse = await sendFCM(profile.fcm_token, title, body, data, token);
    
    return new Response(
      JSON.stringify({ success: true, fcm_response: fcmResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Create JWT for use with Firebase Admin SDK
async function createFirebaseJWT() {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 60 * 60; // 1 hour expiration

  const payload = {
    iss: FIREBASE_CLIENT_EMAIL,
    sub: FIREBASE_CLIENT_EMAIL,
    aud: `https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit`,
    iat,
    exp,
    uid: FIREBASE_CLIENT_EMAIL
  };

  // Import JWT library
  const createJWT = await import("https://deno.land/x/djwt@v2.8/mod.ts");
  
  // Convert private key to the right format
  const privateKey = await createJWT.importPKCS8(FIREBASE_PRIVATE_KEY, "RS256");
  
  // Create JWT
  return await createJWT.create({ alg: "RS256", typ: "JWT" }, payload, privateKey);
}

// Send notification using Firebase Cloud Messaging
async function sendFCM(token, title, body, data, jwt) {
  const fcmUrl = `https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`;
  
  const response = await fetch(fcmUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwt}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: {
        token: token,
        notification: {
          title,
          body,
        },
        data
      }
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`FCM Error: ${response.status} - ${errorText}`);
  }
  
  return await response.json();
}
