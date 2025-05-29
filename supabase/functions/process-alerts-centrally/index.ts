
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
    console.log("=== Starting central alert processing ===");
    console.log(`Timestamp: ${new Date().toISOString()}`);
    
    // Check if required environment variables are set
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing required environment variables");
    }
    
    console.log("Environment variables checked successfully");
    
    // Fetch all active RSS sources
    console.log("Fetching RSS sources from database...");
    const { data: sources, error: sourcesError } = await supabase
      .from('rss_sources')
      .select('url, name')
      .eq('is_default', true);
    
    if (sourcesError) {
      console.error("Error fetching RSS sources:", sourcesError);
      throw sourcesError;
    }
    
    console.log(`Found ${sources?.length || 0} RSS sources to process`);
    
    if (!sources || sources.length === 0) {
      console.log("No RSS sources found, ending processing");
      return new Response(JSON.stringify({ 
        success: true, 
        message: "No RSS sources configured",
        processed: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Fetch RSS feeds in parallel
    console.log("Starting RSS feed fetching...");
    const feedPromises = sources.map(async (source) => {
      try {
        console.log(`Fetching from: ${source.name} (${source.url})`);
        const items = await fetchRssFeed(source.url);
        console.log(`Successfully fetched ${items.length} items from ${source.name}`);
        return { source: source.name, items, error: null };
      } catch (error) {
        console.error(`Failed to fetch from ${source.name}:`, error);
        return { source: source.name, items: [], error: error.message };
      }
    });
    
    const feedResults = await Promise.all(feedPromises);
    
    // Collect all items
    const allItems: RSSItem[] = [];
    let successfulFeeds = 0;
    
    feedResults.forEach((result) => {
      if (result.error) {
        console.error(`Error from ${result.source}: ${result.error}`);
      } else {
        console.log(`Successfully processed ${result.items.length} items from ${result.source}`);
        allItems.push(...result.items);
        successfulFeeds++;
      }
    });
    
    console.log(`Total RSS items collected: ${allItems.length} from ${successfulFeeds}/${sources.length} successful feeds`);
    
    if (allItems.length === 0) {
      console.log("No items fetched from any RSS feed");
      return new Response(JSON.stringify({ 
        success: false, 
        message: "No items could be fetched from RSS feeds",
        processed: 0,
        details: feedResults.map(r => ({ source: r.source, error: r.error }))
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Get existing alert links and titles to avoid duplicates
    console.log("Checking for existing alerts...");
    const { data: existingAlerts } = await supabase
      .from('alerts')
      .select('link, title')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
    
    const existingLinks = new Set(existingAlerts?.map(alert => alert.link) || []);
    const existingTitles = new Set(existingAlerts?.map(alert => alert.title.toLowerCase()) || []);
    
    console.log(`Found ${existingLinks.size} existing links and ${existingTitles.size} existing titles`);
    
    // Filter out duplicates
    console.log("Filtering duplicates...");
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
    console.log("Starting AI classification...");
    const batchSize = 3; // Reduced batch size
    const classifiedAlerts: Alert[] = [];
    
    for (let i = 0; i < newItems.length; i += batchSize) {
      const batch = newItems.slice(i, i + batchSize);
      const batchNumber = Math.floor(i/batchSize) + 1;
      const totalBatches = Math.ceil(newItems.length/batchSize);
      
      console.log(`Processing batch ${batchNumber}/${totalBatches} (${batch.length} items)`);
      
      const batchPromises = batch.map(async (item, idx) => {
        try {
          console.log(`Classifying item ${i + idx + 1}: "${item.title.substring(0, 50)}..."`);
          const result = await classifyAlertWithAI(item);
          console.log(`Classification result: security=${result.is_security_event}, location="${result.location}"`);
          return { status: 'fulfilled', value: result };
        } catch (error) {
          console.error(`Failed to classify item "${item.title}":`, error);
          return { status: 'rejected', reason: error };
        }
      });
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, idx) => {
        if (result.status === 'fulfilled' && result.value.is_security_event) {
          classifiedAlerts.push(result.value);
          console.log(`Added security alert: "${result.value.title}"`);
        } else if (result.status === 'rejected') {
          console.error(`Failed to classify item ${batch[idx].title}:`, result.reason);
        } else {
          console.log(`Item "${batch[idx].title}" classified as non-security event`);
        }
      });
      
      // Small delay between batches to avoid rate limiting
      if (i + batchSize < newItems.length) {
        console.log("Waiting 2 seconds before next batch...");
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log(`AI Classification complete: ${classifiedAlerts.length} security alerts identified`);
    
    if (classifiedAlerts.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: "No security alerts found",
        processed: 0,
        total_items: newItems.length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Insert new alerts into database
    console.log(`Inserting ${classifiedAlerts.length} alerts into database...`);
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
    console.log("Sending push notifications...");
    try {
      await sendPushNotifications(classifiedAlerts);
      console.log("Push notifications sent successfully");
    } catch (notificationError) {
      console.error("Error sending push notifications:", notificationError);
      // Don't fail the whole process if notifications fail
    }
    
    console.log("=== Alert processing completed successfully ===");
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: `Processed ${classifiedAlerts.length} new security alerts`,
      processed: classifiedAlerts.length,
      total_items_processed: newItems.length,
      successful_feeds: successfulFeeds,
      total_feeds: sources.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error("=== Error in central alert processing ===", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
