
import { supabase } from "@/integrations/supabase/client";

export interface RSSSource {
  id: string;
  name: string;
  url: string;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  user_id: string;
}

export async function getRSSSources(): Promise<RSSSource[]> {
  const { data, error } = await supabase
    .from('rss_sources')
    .select('*')
    .order('is_default', { ascending: false })
    .order('name');

  if (error) {
    console.error("Error fetching RSS sources:", error);
    throw error;
  }

  return data || [];
}

export async function addRSSSource(name: string, url: string): Promise<RSSSource> {
  const { data, error } = await supabase
    .from('rss_sources')
    .insert([{ name, url }])
    .select()
    .single();

  if (error) {
    console.error("Error adding RSS source:", error);
    throw error;
  }

  return data;
}

export async function toggleRSSSource(id: string, is_active: boolean): Promise<void> {
  const { error } = await supabase
    .from('rss_sources')
    .update({ is_active, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error("Error toggling RSS source:", error);
    throw error;
  }
}

export async function deleteRSSSource(id: string): Promise<void> {
  const { error } = await supabase
    .from('rss_sources')
    .delete()
    .eq('id', id);

  if (error) {
    console.error("Error deleting RSS source:", error);
    throw error;
  }
}
