
import { RSSItem } from "@/types";
import { supabase } from "@/integrations/supabase/client";

// Real RSS feed proxy API to avoid CORS issues
const RSS_PROXY_API = "https://api.allorigins.win/raw?url=";

export async function fetchRssFeeds(): Promise<RSSItem[]> {
  try {
    // Get user's active RSS sources
    const { data: sources, error: sourcesError } = await supabase
      .from('rss_sources')
      .select('url')
      .eq('is_active', true);
    
    if (sourcesError) {
      console.error("Error fetching RSS sources:", sourcesError);
      throw sourcesError;
    }
    
    // Extract URLs
    const RSS_FEEDS = sources.map(source => source.url);
    
    if (RSS_FEEDS.length === 0) {
      console.warn("No active RSS feeds found, using mock data");
      return getMockRssItems();
    }
    
    // Fetch from all RSS feeds in parallel
    const feedPromises = RSS_FEEDS.map(feedUrl => fetchRssFeed(feedUrl));
    const feedResults = await Promise.allSettled(feedPromises);
    
    // Collect successful results
    const allItems: RSSItem[] = [];
    feedResults.forEach(result => {
      if (result.status === 'fulfilled') {
        allItems.push(...result.value);
      }
    });
    
    // Sort by publication date, newest first
    allItems.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
    
    // If we couldn't fetch real feeds, return mock data
    if (allItems.length === 0) {
      console.warn("No items fetched from real RSS feeds, using mock data instead");
      return getMockRssItems();
    }
    
    console.log("Successfully fetched RSS items:", allItems.length);
    
    // Take the most recent items
    return allItems.slice(0, 15);
  } catch (error) {
    console.error("Error fetching RSS feeds:", error);
    // Fallback to mock data
    return getMockRssItems();
  }
}

async function fetchRssFeed(feedUrl: string): Promise<RSSItem[]> {
  try {
    console.log(`Fetching RSS feed: ${feedUrl}`);
    const proxyUrl = `${RSS_PROXY_API}${encodeURIComponent(feedUrl)}`;
    const response = await fetch(proxyUrl, {
      headers: {
        'Accept': 'application/xml, text/xml, */*',
        'Accept-Language': 'he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch feed: ${response.status} ${response.statusText}`);
    }
    
    const xmlData = await response.text();
    return parseRssFeedWithDOMParser(xmlData, feedUrl);
  } catch (error) {
    console.error(`Error fetching RSS feed ${feedUrl}:`, error);
    return [];
  }
}

// Use DOMParser instead of xml2js to avoid browser compatibility issues
function parseRssFeedWithDOMParser(xmlData: string, feedUrl: string): RSSItem[] {
  try {
    // Create a new DOMParser
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlData, "text/xml");
    
    // Check for parsing errors
    const parserError = xmlDoc.querySelector("parsererror");
    if (parserError) {
      console.error(`XML parsing error for ${feedUrl}:`, parserError.textContent);
      return [];
    }
    
    // Get all item elements
    const itemElements = xmlDoc.querySelectorAll("item");
    if (!itemElements || itemElements.length === 0) {
      console.error(`No items found in feed ${feedUrl}`);
      return [];
    }
    
    // Parse each item
    const items: RSSItem[] = [];
    itemElements.forEach((item) => {
      // Helper function to safely get text content
      const getElementText = (parent: Element, tagName: string): string => {
        const element = parent.querySelector(tagName);
        return element ? element.textContent?.trim() || "" : "";
      };
      
      const title = getElementText(item, "title");
      const description = getElementText(item, "description")
        .replace(/<\/?[^>]+(>|$)/g, ""); // Remove HTML tags
      const link = getElementText(item, "link");
      const pubDate = getElementText(item, "pubDate");
      const guid = getElementText(item, "guid") || Math.random().toString(36).substr(2, 9);
      
      if (title) {
        items.push({
          title: title,
          description: description || "אין פרטים נוספים",
          link: link || feedUrl,
          pubDate: normalizeDate(pubDate),
          guid: guid
        });
      }
    });
    
    console.log(`Successfully parsed ${items.length} items from ${feedUrl}`);
    return items;
  } catch (error) {
    console.error(`Error parsing RSS feed ${feedUrl}:`, error);
    return [];
  }
}

// Helper function to normalize date formats
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

// Mock data as fallback in case real feeds fail
function getMockRssItems(): RSSItem[] {
  return [
    {
      title: "אזעקה בנהריה: חשד לחדירת כלי טיס עוין",
      description: "אזעקות נשמעו בנהריה ובסביבתה בעקבות חשד לחדירת כלי טיס עוין. תושבים דיווחו על יירוטים באזור.",
      link: "https://example.com/news/1",
      pubDate: new Date(Date.now() - 25 * 60000).toISOString(), // 25 minutes ago
      guid: "1"
    },
    {
      title: "שני חשודים נעצרו בחשד למעורבות בפיגוע בתל אביב",
      description: "המשטרה עצרה שני חשודים בחשד למעורבות בפיגוע שאירע הבוקר בתל אביב. האירוע הסתיים ללא נפגעים.",
      link: "https://example.com/news/2",
      pubDate: new Date(Date.now() - 50 * 60000).toISOString(), // 50 minutes ago
      guid: "2"
    },
    {
      title: "בעקבות התקרית בצפון: סגירת שדה התעופה ברמת דוד",
      description: "בעקבות חילופי האש בגבול הצפון, הוחלט על סגירת שדה התעופה ברמת דוד למשך מספר שעות.",
      link: "https://example.com/news/3",
      pubDate: new Date(Date.now() - 120 * 60000).toISOString(), // 2 hours ago
      guid: "3"
    },
    {
      title: "המפלגות הגדולות חתמו על הסכם קואליציוני",
      description: "לאחר שבועות של משא ומתן, המפלגות הגדולות הגיעו להסכם קואליציוני והממשלה צפויה להיות מושבעת בימים הקרובים.",
      link: "https://example.com/news/4",
      pubDate: new Date(Date.now() - 180 * 60000).toISOString(), // 3 hours ago
      guid: "4"
    },
    {
      title: "אזעקות נשמעות בירושלים וסביבתה",
      description: "אזעקות נשמעות בירושלים וביישובי הסביבה. תושבים מתבקשים להיכנס למרחבים מוגנים.",
      link: "https://example.com/news/5",
      pubDate: new Date(Date.now() - 15 * 60000).toISOString(), // 15 minutes ago
      guid: "5"
    }
  ];
}
