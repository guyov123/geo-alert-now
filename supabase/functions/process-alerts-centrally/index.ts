
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

// Health check function
async function performHealthCheck(): Promise<{ status: string; details: any }> {
  const health = {
    database: false,
    rss_sources: 0,
    recent_alerts: 0,
    openai_configured: false,
    errors: [] as string[]
  };

  try {
    // Test database connection
    const { data: testData, error: testError } = await supabase.from('alerts').select('count').limit(1);
    if (testError) {
      health.errors.push(`Database error: ${testError.message}`);
    } else {
      health.database = true;
    }

    // Check RSS sources
    const { data: sources, error: sourcesError } = await supabase
      .from('rss_sources')
      .select('count')
      .eq('is_default', true);
    
    if (sourcesError) {
      health.errors.push(`RSS sources error: ${sourcesError.message}`);
    } else {
      health.rss_sources = sources?.length || 0;
    }

    // Check recent alerts
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentAlerts, error: alertsError } = await supabase
      .from('alerts')
      .select('count')
      .gte('created_at', yesterday);
    
    if (alertsError) {
      health.errors.push(`Recent alerts error: ${alertsError.message}`);
    } else {
      health.recent_alerts = recentAlerts?.length || 0;
    }

    // Check OpenAI configuration
    health.openai_configured = !!Deno.env.get('OPENAI_API_KEY');

    return {
      status: health.errors.length === 0 ? 'healthy' : 'unhealthy',
      details: health
    };
  } catch (error) {
    return {
      status: 'error',
      details: { error: error.message }
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== Starting central alert processing ===");
    console.log(`Timestamp: ${new Date().toISOString()}`);
    
    // Parse request body to check for health check request
    let requestBody = {};
    try {
      const bodyText = await req.text();
      if (bodyText) {
        requestBody = JSON.parse(bodyText);
      }
    } catch (e) {
      // Ignore JSON parse errors for empty or invalid bodies
    }

    // Handle health check requests
    if ((requestBody as any)?.health_check) {
      console.log("Performing health check...");
      const healthResult = await performHealthCheck();
      return new Response(JSON.stringify(healthResult), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
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
        processed: 0,
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Fetch RSS feeds in parallel with timeout
    console.log("Starting RSS feed fetching...");
    const feedPromises = sources.map(async (source) => {
      try {
        console.log(`Fetching from: ${source.name} (${source.url})`);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 30000)
        );
        
        const fetchPromise = fetchRssFeed(source.url);
        const items = await Promise.race([fetchPromise, timeoutPromise]) as RSSItem[];
        
        console.log(`Successfully fetched ${items.length} items from ${source.name}`);
        return { source: source.name, items, error: null };
      } catch (error) {
        console.error(`Failed to fetch from ${source.name}:`, error);
        return { source: source.name, items: [], error: error.message };
      }
    });
    
    const feedResults = await Promise.all(feedPromises);
    
    // Collect all items with detailed logging
    const allItems: RSSItem[] = [];
    let successfulFeeds = 0;
    const feedSummary: any[] = [];
    
    feedResults.forEach((result) => {
      const summary = {
        source: result.source,
        items_count: result.items.length,
        success: !result.error,
        error: result.error
      };
      feedSummary.push(summary);
      
      if (result.error) {
        console.error(`Error from ${result.source}: ${result.error}`);
      } else {
        console.log(`Successfully processed ${result.items.length} items from ${result.source}`);
        allItems.push(...result.items);
        successfulFeeds++;
      }
    });
    
    console.log(`Total RSS items collected: ${allItems.length} from ${successfulFeeds}/${sources.length} successful feeds`);
    console.log("Feed summary:", JSON.stringify(feedSummary, null, 2));
    
    if (allItems.length === 0) {
      console.log("No items fetched from any RSS feed");
      return new Response(JSON.stringify({ 
        success: false, 
        message: "No items could be fetched from RSS feeds",
        processed: 0,
        feed_summary: feedSummary,
        timestamp: new Date().toISOString()
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
    
    // Filter out duplicates with enhanced algorithm
    console.log("Filtering duplicates...");
    const newItems = filterDuplicates(allItems, existingLinks, existingTitles);
    
    console.log(`Found ${newItems.length} new items to process after deduplication`);
    
    if (newItems.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: "No new alerts to process",
        processed: 0,
        total_items_fetched: allItems.length,
        feed_summary: feedSummary,
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Classify items with AI in smaller batches for better reliability
    console.log("Starting AI classification...");
    const batchSize = 2; // Smaller batches for reliability
    const classifiedAlerts: Alert[] = [];
    const classificationStats = {
      total: newItems.length,
      security_events: 0,
      ai_classifications: 0,
      keyword_fallbacks: 0,
      errors: 0
    };
    
    for (let i = 0; i < newItems.length; i += batchSize) {
      const batch = newItems.slice(i, i + batchSize);
      const batchNumber = Math.floor(i/batchSize) + 1;
      const totalBatches = Math.ceil(newItems.length/batchSize);
      
      console.log(`Processing batch ${batchNumber}/${totalBatches} (${batch.length} items)`);
      
      for (const item of batch) {
        try {
          console.log(`Classifying item ${i + batch.indexOf(item) + 1}: "${item.title.substring(0, 50)}..."`);
          const result = await classifyAlertWithAI(item);
          
          // Track classification method
          if (result.is_security_event) {
            classificationStats.security_events++;
          }
          
          classifiedAlerts.push(result);
          console.log(`Classification result: security=${result.is_security_event}, location="${result.location}"`);
          
        } catch (error) {
          console.error(`Failed to classify item "${item.title}":`, error);
          classificationStats.errors++;
        }
      }
      
      // Delay between batches to avoid rate limiting
      if (i + batchSize < newItems.length) {
        console.log("Waiting 3 seconds before next batch...");
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    console.log(`AI Classification complete: ${classifiedAlerts.length} total alerts, ${classificationStats.security_events} security alerts identified`);
    console.log("Classification stats:", JSON.stringify(classificationStats, null, 2));
    
    // Filter for security events only
    const securityAlerts = classifiedAlerts.filter(alert => alert.is_security_event);
    
    if (securityAlerts.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: "No security alerts found",
        processed: 0,
        total_items: newItems.length,
        classification_stats: classificationStats,
        feed_summary: feedSummary,
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Insert new alerts into database
    console.log(`Inserting ${securityAlerts.length} security alerts into database...`);
    const { data: insertedAlerts, error: insertError } = await supabase
      .from('alerts')
      .insert(securityAlerts.map(alert => ({
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
    
    console.log(`Successfully inserted ${insertedAlerts?.length} new security alerts`);
    
    // Send push notifications for relevant alerts
    console.log("Sending push notifications...");
    try {
      await sendPushNotifications(securityAlerts);
      console.log("Push notifications sent successfully");
    } catch (notificationError) {
      console.error("Error sending push notifications:", notificationError);
      // Don't fail the whole process if notifications fail
    }
    
    console.log("=== Alert processing completed successfully ===");
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: `Processed ${securityAlerts.length} new security alerts`,
      processed: securityAlerts.length,
      total_items_processed: newItems.length,
      total_items_fetched: allItems.length,
      successful_feeds: successfulFeeds,
      total_feeds: sources.length,
      classification_stats: classificationStats,
      feed_summary: feedSummary,
      timestamp: new Date().toISOString()
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
