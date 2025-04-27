
import { supabase } from "@/integrations/supabase/client";

export async function updateUserLocation(location: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("User not authenticated");
    }
    
    const { error } = await supabase
      .from('profiles')
      .update({ location, updated_at: new Date().toISOString() })
      .eq('id', user.id);
    
    if (error) throw error;
    
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
      return "לא ידוע";
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .select('location')
      .eq('id', user.id)
      .single();
    
    if (error) throw error;
    
    return data?.location || "לא ידוע";
  } catch (error) {
    console.error("Error getting user location:", error);
    return "לא ידוע";
  }
}
