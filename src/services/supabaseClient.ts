
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

// Ensure user profile exists
export async function ensureUserProfile(): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log("No authenticated user found when ensuring profile");
      return;
    }
    
    console.log("Checking if profile exists for user:", user.id);
    
    // Check if profile exists
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();
    
    if (error) {
      console.error("Error checking profile:", error);
      throw error;
    }
    
    // If profile doesn't exist, create it
    if (!data) {
      console.log("Profile not found, creating new profile for user:", user.id);
      
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({ id: user.id });
        
      if (insertError) {
        console.error("Error creating profile:", insertError);
        throw insertError;
      }
      
      console.log("Profile created successfully for user:", user.id);
    } else {
      console.log("Profile already exists for user:", user.id);
    }
  } catch (error) {
    console.error("Error ensuring user profile:", error);
  }
}
