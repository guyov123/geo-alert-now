
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const openAIApiKey = Deno.env.get('OPENAI_API_KEY')!

// Use service role for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RSSItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  guid: string;
}

interface Alert {
  id: string;
  title: string;
  description: string;
  location: string;
  timestamp: string;
  source: string;
  link: string;
  is_security_event: boolean;
  image_url?: string;
}

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
    
    // Filter out items that already exist (by link or very similar title)
    const newItems = allItems.filter(item => {
      if (existingLinks.has(item.link)) {
        return false;
      }
      
      // Check for very similar titles (to avoid duplicates with slightly different links)
      const titleLower = item.title.toLowerCase();
      for (const existingTitle of existingTitles) {
        if (calculateTitleSimilarity(titleLower, existingTitle) > 0.85) {
          console.log(`Skipping similar title: "${item.title}" (similar to existing)`);
          return false;
        }
      }
      
      return true;
    });
    
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

// Calculate similarity between two titles to detect duplicates
function calculateTitleSimilarity(title1: string, title2: string): number {
  // Simple similarity check based on common words
  const words1 = title1.split(' ').filter(w => w.length > 2);
  const words2 = title2.split(' ').filter(w => w.length > 2);
  
  if (words1.length === 0 || words2.length === 0) return 0;
  
  const commonWords = words1.filter(word => words2.includes(word));
  return commonWords.length / Math.max(words1.length, words2.length);
}

async function fetchRssFeed(feedUrl: string): Promise<RSSItem[]> {
  const RSS_PROXY_API = "https://api.allorigins.win/raw?url=";
  
  try {
    const proxyUrl = `${RSS_PROXY_API}${encodeURIComponent(feedUrl)}`;
    const response = await fetch(proxyUrl, {
      headers: {
        'Accept': 'application/xml, text/xml, */*',
        'Accept-Language': 'he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch feed: ${response.status}`);
    }
    
    const xmlData = await response.text();
    return parseRssFeedWithDOMParser(xmlData);
  } catch (error) {
    console.error(`Error fetching RSS feed ${feedUrl}:`, error);
    return [];
  }
}

function parseRssFeedWithDOMParser(xmlData: string): RSSItem[] {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlData, "text/xml");
    
    const parserError = xmlDoc.querySelector("parsererror");
    if (parserError) {
      console.error("XML parsing error:", parserError.textContent);
      return [];
    }
    
    const itemElements = xmlDoc.querySelectorAll("item");
    const items: RSSItem[] = [];
    
    itemElements.forEach((item) => {
      const getElementText = (parent: Element, tagName: string): string => {
        const element = parent.querySelector(tagName);
        return element ? element.textContent?.trim() || "" : "";
      };
      
      const title = getElementText(item, "title");
      const description = getElementText(item, "description").replace(/<\/?[^>]+(>|$)/g, "");
      const link = getElementText(item, "link");
      const pubDate = getElementText(item, "pubDate");
      const guid = getElementText(item, "guid") || Math.random().toString(36).substr(2, 9);
      
      if (title) {
        items.push({
          title,
          description: description || "אין פרטים נוספים",
          link: link,
          pubDate: normalizeDate(pubDate),
          guid
        });
      }
    });
    
    return items;
  } catch (error) {
    console.error("Error parsing RSS feed:", error);
    return [];
  }
}

function normalizeDate(dateStr: string): string {
  if (!dateStr) {
    return new Date().toISOString();
  }
  
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
  } catch (e) {
    // Fall through to return current date
  }
  
  return new Date().toISOString();
}

async function classifyAlertWithAI(item: RSSItem): Promise<Alert> {
  const fullText = `${item.title} ${item.description}`;
  
  const prompt = `
טקסט: "${fullText}"

אנא בחן את הטקסט הזה ובצע סיווג מדויק:

1. האם מדובר באירוע ביטחוני? (פיגוע, טרור, ירי, טילים, רקטות, צבע אדום, פעילות צבאית)
2. אם מוזכר מיקום ספציפי בישראל (עיר, יישוב, אזור), כתוב את שם המקום הספציפי בלבד
3. אם המיקום לא ברור או לא קיים - כתוב null

חשוב מאוד: 
- רק אירועי ביטחון אמיתיים צריכים להיחשב כ-true
- חדשות פוליטיות, כלכליות או ספורט אינן אירועי ביטחון
- רק מיקומים ספציפיים בישראל צריכים להיזכר

ענה בדיוק בפורמט JSON הבא:
{
  "is_security_event": true/false,
  "location": "שם המקום הספציפי או null"
}
`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openAIApiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0
      })
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }
    
    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    console.log(`AI Response for "${item.title}": ${aiResponse}`);
    
    const result = JSON.parse(aiResponse);
    
    return {
      id: crypto.randomUUID(),
      title: item.title,
      description: item.description,
      location: result.location === "null" ? "לא ידוע" : result.location,
      timestamp: item.pubDate,
      source: extractSourceFromLink(item.link),
      link: item.link,
      is_security_event: result.is_security_event === true
    };
  } catch (error) {
    console.error("Error classifying alert with AI:", error);
    // Fallback to keyword classification
    return createAlertFromKeywords(item);
  }
}

function createAlertFromKeywords(item: RSSItem): Alert {
  const fullText = `${item.title} ${item.description}`.toLowerCase();
  const securityKeywords = [
    "אזעקה", "פיגוע", "ירי", "טיל", "רקטה", "פצועים", "הרוגים", "טרור",
    "חמאס", "חיזבאללה", "ג'יהאד", "דאעש", "חדירה", "צבע אדום", "צה\"ל"
  ];
  
  const isSecurityEvent = securityKeywords.some(keyword => 
    fullText.includes(keyword.toLowerCase())
  );
  
  let location = "לא ידוע";
  const cityNames = [
    "תל אביב", "ירושלים", "חיפה", "באר שבע", "אשדוד", "אשקלון", 
    "רמת גן", "חדרה", "נתניה", "אילת", "עזה", "לבנון", "הגליל", "הנגב"
  ];
  
  for (const city of cityNames) {
    if (fullText.includes(city.toLowerCase())) {
      location = city;
      break;
    }
  }
  
  return {
    id: crypto.randomUUID(),
    title: item.title,
    description: item.description,
    location,
    timestamp: item.pubDate,
    source: extractSourceFromLink(item.link),
    link: item.link,
    is_security_event: isSecurityEvent
  };
}

function extractSourceFromLink(link: string): string {
  try {
    const url = new URL(link);
    const hostname = url.hostname;
    
    if (hostname.includes("ynet")) return "ynet";
    if (hostname.includes("walla")) return "וואלה";
    if (hostname.includes("maariv")) return "מעריב";
    if (hostname.includes("israelhayom")) return "ישראל היום";
    if (hostname.includes("haaretz")) return "הארץ";
    
    return hostname.split('.')[1] || hostname;
  } catch (e) {
    return "לא ידוע";
  }
}

async function sendPushNotifications(alerts: Alert[]): Promise<void> {
  try {
    // Get all users with FCM tokens and their locations
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, fcm_token, location')
      .not('fcm_token', 'is', null);
    
    if (error || !users || users.length === 0) {
      console.log("No users with FCM tokens found");
      return;
    }
    
    console.log(`Found ${users.length} users with FCM tokens`);
    
    // For each alert, find relevant users and send notifications
    for (const alert of alerts) {
      const relevantUsers = users.filter(user => 
        isLocationRelevant(alert.location, user.location || "")
      );
      
      console.log(`Alert "${alert.title}" in "${alert.location}" relevant for ${relevantUsers.length} users`);
      
      // Send notification to each relevant user
      for (const user of relevantUsers) {
        try {
          await supabase.functions.invoke('send-notification', {
            body: {
              user_id: user.id,
              title: `התראה ב${alert.location}`,
              body: alert.title,
              data: { alert_id: alert.id }
            }
          });
        } catch (pushError) {
          console.error(`Failed to send notification to user ${user.id}:`, pushError);
        }
      }
    }
  } catch (error) {
    console.error("Error sending push notifications:", error);
  }
}

function isLocationRelevant(alertLocation: string, userLocation: string): boolean {
  if (!alertLocation || !userLocation || alertLocation === "לא ידוע") {
    return false;
  }
  
  const normalizedAlert = normalizeLocation(alertLocation);
  const normalizedUser = normalizeLocation(userLocation);
  
  console.log(`Checking relevance: Alert location "${normalizedAlert}" vs User location "${normalizedUser}"`);
  
  // Direct match
  if (normalizedAlert === normalizedUser) {
    console.log("Direct match found");
    return true;
  }
  
  // National/regional locations that are relevant to everyone
  const nationalLocations = ["ישראל", "כל הארץ", "המרכז", "הדרום", "הצפון", "גוש דן"];
  if (nationalLocations.some(loc => normalizedAlert.includes(normalizeLocation(loc)))) {
    console.log("National location match");
    return true;
  }
  
  // Nearby locations map - more specific and restrictive
  const locationMap: Record<string, string[]> = {
    'תל אביב-יפו': ['רמת גן', 'גבעתיים', 'בני ברק', 'חולון', 'בת ים'],
    'ירושלים': ['מעלה אדומים', 'גבעת זאב'],
    'חיפה': ['קריות', 'טירת הכרמל'],
    'באר שבע': ['אופקים', 'נתיבות']
  };
  
  // Check if user's location has nearby relevant locations
  for (const [area, nearby] of Object.entries(locationMap)) {
    if (normalizedUser === normalizeLocation(area)) {
      if (nearby.some(place => normalizedAlert.includes(normalizeLocation(place)))) {
        console.log(`Nearby location match: ${area} includes ${normalizedAlert}`);
        return true;
      }
    }
  }
  
  // More restrictive substring match - only if alert location contains user location
  if (normalizedAlert.includes(normalizedUser) && normalizedUser.length > 3) {
    console.log("Substring match found");
    return true;
  }
  
  console.log("No location match found");
  return false;
}

function normalizeLocation(location: string): string {
  if (!location) return "";
  
  let normalized = location.trim().toLowerCase();
  normalized = normalized.replace(/[\u2010-\u2015\u2212\u23AF\uFE58\uFF0D\u002D\u05BE]/g, '-');
  normalized = normalized.replace(/\s+/g, ' ');
  
  if (normalized.includes('תל אביב') || normalized.includes('ת"א') || normalized.includes('תל-אביב')) {
    return 'תל אביב-יפו';
  }
  
  return normalized;
}
