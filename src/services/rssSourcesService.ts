
import { supabase } from "@/integrations/supabase/client";

export interface RSSSource {
  id: string;
  name: string;
  url: string;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
}

export async function getRSSSources(): Promise<RSSSource[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("User not authenticated");
    }
    
    // Get all sources with their user-specific active status
    const { data, error } = await supabase
      .from('rss_sources')
      .select(`
        id,
        name,
        url,
        is_default,
        created_at,
        user_rss_preferences!inner (
          is_active,
          user_id
        )
      `)
      .eq('user_rss_preferences.user_id', user.id);
    
    if (error) {
      console.error("Error fetching RSS sources:", error);
      throw error;
    }
    
    // Transform data to RSSSource format
    const sources = data.map(item => ({
      id: item.id,
      name: item.name,
      url: item.url,
      is_active: item.user_rss_preferences[0].is_active,
      is_default: item.is_default,
      created_at: item.created_at
    }));
    
    // Sort by default first, then by name
    return sources.sort((a, b) => {
      if (a.is_default !== b.is_default) {
        return a.is_default ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  } catch (error) {
    console.error("Error getting RSS sources:", error);
    
    // If there's an error fetching, return an empty array
    return [];
  }
}

export async function toggleRSSSource(id: string, is_active: boolean): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }

  const { error } = await supabase
    .from('user_rss_preferences')
    .update({ 
      is_active, 
      updated_at: new Date().toISOString() 
    })
    .eq('source_id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error("Error toggling RSS source:", error);
    throw error;
  }
}

// Function to ensure a user has preferences set up
// This will be called if a user somehow doesn't have preferences yet
export async function ensureUserPreferences(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }
  
  // Check if user already has preferences
  const { data: existingPrefs, error: checkError } = await supabase
    .from('user_rss_preferences')
    .select('id')
    .eq('user_id', user.id)
    .limit(1);
    
  if (checkError) {
    console.error("Error checking user preferences:", checkError);
    throw checkError;
  }
  
  // If user doesn't have preferences, create default ones
  if (!existingPrefs || existingPrefs.length === 0) {
    // Get all sources
    const { data: sources, error: sourcesError } = await supabase
      .from('rss_sources')
      .select('id');
      
    if (sourcesError) {
      console.error("Error fetching sources:", sourcesError);
      throw sourcesError;
    }
    
    // Create preferences for all sources
    const prefsToInsert = sources.map(source => ({
      user_id: user.id,
      source_id: source.id,
      is_active: true
    }));
    
    const { error: insertError } = await supabase
      .from('user_rss_preferences')
      .insert(prefsToInsert);
      
    if (insertError) {
      console.error("Error creating user preferences:", insertError);
      throw insertError;
    }
  }
}

