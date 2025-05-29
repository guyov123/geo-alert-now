
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { RSSItem, Alert } from './types.ts';
import { fetchRssFeed } from './rss-fetcher.ts';
import { classifyAlertWithAI } from './ai-classifier.ts';
import { sendPushNotifications } from './push-notifications.ts';
import { filterDuplicates } from './deduplication.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Use service role for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting central alert processing...");
    
    // Fetch all active RSS sources
    const { data: sources, error: sourcesError } = await supabase
      .from('rss_sources')
      .select('url, name')
      .eq('is_default', true);
    
    if (sourcesError) {
      console.error("Error fetching RSS sources:", sourcesError);
      throw sourcesError;
    }
    
    console.log(`Found ${sources.length} RSS sources to process`);
    
    // Fetch RSS feeds in parallel
    const feedPromises = sources.map(source => fetchRssFeed(source.url));
    const feedResults = await Promise.allSettled(feedPromises);
    
    // Collect all items
    const allItems: RSSItem[] = [];
    feedResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`Successfully fetched ${result.value.length} items from ${sources[index].name}`);
        allItems.push(...result.value);
      } else {
        console.error(`Failed to fetch from ${sources[index].name}:`, result.reason);
      }
    });
    
    console.log(`Total RSS items fetched: ${allItems.length}`);
    
    // Get existing alert links and titles to avoid duplicates
    const { data: existingAlerts } = await supabase
      .from('alerts')
      .select('link, title')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
    
    const existingLinks = new Set(existingAlerts?.map(alert => alert.link) || []);
    const existingTitles = new Set(existingAlerts?.map(alert => alert.title.toLowerCase()) || []);
    
    // Filter out duplicates
    const newItems = filterDuplicates(allItems, existingLinks, existingTitles);
    
    console.log(`Found ${newItems.length} new items to process after deduplication`);
    
    if (newItems.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: "No new alerts to process",
        processed: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Classify items with AI in batches
    const batchSize = 5;
    const classifiedAlerts: Alert[] = [];
    
    for (let i = 0; i < newItems.length; i += batchSize) {
      const batch = newItems.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(newItems.length/batchSize)}`);
      
      const batchPromises = batch.map(item => classifyAlertWithAI(item));
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, idx) => {
        if (result.status === 'fulfilled' && result.value.is_security_event) {
          classifiedAlerts.push(result.value);
        } else if (result.status === 'rejected') {
          console.error(`Failed to classify item ${batch[idx].title}:`, result.reason);
        }
      });
      
      // Small delay between batches to avoid rate limiting
      if (i + batchSize < newItems.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`Classified ${classifiedAlerts.length} security alerts`);
    
    if (classifiedAlerts.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: "No security alerts found",
        processed: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Insert new alerts into database
    const { data: insertedAlerts, error: insertError } = await supabase
      .from('alerts')
      .insert(classifiedAlerts.map(alert => ({
        id: alert.id,
        title: alert.title,
        description: alert.description,
        location: alert.location,
        timestamp: alert.timestamp,
        source: alert.source,
        link: alert.link,
        is_security_event: alert.is_security_event,
        image_url: alert.image_url
      })))
      .select();
    
    if (insertError) {
      console.error("Error inserting alerts:", insertError);
      throw insertError;
    }
    
    console.log(`Successfully inserted ${insertedAlerts?.length} new alerts`);
    
    // Send push notifications for relevant alerts
    await sendPushNotifications(classifiedAlerts);
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: `Processed ${classifiedAlerts.length} new security alerts`,
      processed: classifiedAlerts.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error("Error in central alert processing:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
