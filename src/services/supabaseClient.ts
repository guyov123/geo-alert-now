
import { supabase } from "@/integrations/supabase/client";

// Location functions
export async function updateUserLocation(location: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log("No authenticated user found when updating location");
      throw new Error("User not authenticated");
    }
    
    console.log("Updating location for user:", user.id, "to:", location);
    
    const { error, data } = await supabase
      .from('profiles')
      .update({ location, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select();
    
    if (error) {
      console.error("Supabase error updating location:", error);
      throw error;
    }
    
    console.log("Location update successful:", data);
    return location;
  } catch (error) {
    console.error("Error updating user location:", error);
    throw error;
  }
}

export async function getUserLocation(): Promise<string> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log("No authenticated user found when getting location");
      return "לא ידוע";
    }
    
    console.log("Getting location for user:", user.id);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('location')
      .eq('id', user.id)
      .single();
    
    if (error) {
      console.error("Supabase error getting location:", error);
      throw error;
    }
    
    console.log("Location retrieved:", data?.location);
    return data?.location || "לא ידוע";
  } catch (error) {
    console.error("Error getting user location:", error);
    return "לא ידוע";
  }
}

// OpenAI API key management functions
export async function getOpenAIApiKeyFromSupabase(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return null;
    }
    
    // Using type assertion to work around TypeScript limitations
    const { data, error } = await (supabase
      .from('user_settings') as any)
      .select('openai_api_key')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (error) throw error;
    
    return data?.openai_api_key || null;
  } catch (error) {
    console.error("Error getting OpenAI API key:", error);
    return null;
  }
}

export async function saveOpenAIApiKey(key: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("User not authenticated");
    }
    
    // First check if a record already exists
    const { data, error: selectError } = await (supabase
      .from('user_settings') as any)
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (selectError) throw selectError;
    
    if (data) {
      // Update existing record
      const { error } = await (supabase
        .from('user_settings') as any)
        .update({ 
          openai_api_key: key,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);
        
      if (error) throw error;
    } else {
      // Insert new record
      const { error } = await (supabase
        .from('user_settings') as any)
        .insert({
          user_id: user.id,
          openai_api_key: key
        });
        
      if (error) throw error;
    }
  } catch (error) {
    console.error("Error saving OpenAI API key:", error);
    throw error;
  }
}

export async function hasOpenAIApiKeyInSupabase(): Promise<boolean> {
  try {
    const apiKey = await getOpenAIApiKeyFromSupabase();
    return apiKey !== null && apiKey.length > 0;
  } catch (error) {
    console.error("Error checking OpenAI API key:", error);
    return false;
  }
}
