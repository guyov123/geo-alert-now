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

/**
 * Adds a new RSS source for the authenticated user
 * @param name The name of the RSS source
 * @param url The URL of the RSS feed
 * @returns The newly created RSS source
 */
export async function addRSSSource(name: string, url: string): Promise<RSSSource> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }

  // First insert the source into rss_sources if it doesn't exist
  const { data: sourceData, error: sourceError } = await supabase
    .from('rss_sources')
    .select('id')
    .eq('url', url)
    .maybeSingle();

  let sourceId: string;

  if (sourceError) {
    console.error("Error checking for existing source:", sourceError);
    throw sourceError;
  }

  if (!sourceData) {
    // Source doesn't exist, create it
    const { data: newSource, error: insertError } = await supabase
      .from('rss_sources')
      .insert({ name, url, is_default: false })
      .select('id')
      .single();

    if (insertError) {
      console.error("Error creating source:", insertError);
      throw insertError;
    }

    sourceId = newSource.id;
  } else {
    sourceId = sourceData.id;
  }

  // Now create user preference for this source
  const { error: prefError } = await supabase
    .from('user_rss_preferences')
    .insert({
      user_id: user.id,
      source_id: sourceId,
      is_active: true
    });

  if (prefError) {
    console.error("Error creating user preference:", prefError);
    throw prefError;
  }

  // Get the complete source with preference
  const { data: completeSource, error: fetchError } = await supabase
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
    .eq('id', sourceId)
    .eq('user_rss_preferences.user_id', user.id)
    .single();

  if (fetchError) {
    console.error("Error fetching complete source:", fetchError);
    throw fetchError;
  }

  // Transform to RSSSource format
  return {
    id: completeSource.id,
    name: completeSource.name,
    url: completeSource.url,
    is_active: completeSource.user_rss_preferences[0].is_active,
    is_default: completeSource.is_default,
    created_at: completeSource.created_at
  };
}
