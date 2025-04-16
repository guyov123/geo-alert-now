import { RSSItem } from "@/types";
import * as xml2js from "xml2js";

// Real RSS feed proxy API to avoid CORS issues
const RSS_PROXY_API = "https://api.allorigins.win/raw?url=";

// List of Israeli news RSS feeds
const RSS_FEEDS = [
  "https://www.ynet.co.il/Integration/StoryRss2.xml",
  "https://rss.walla.co.il/feed/1",
  "https://www.maariv.co.il/Rss/RssFeedsMain",
  "https://www.inn.co.il/Rss.aspx",
  "https://www.haaretz.co.il/cmlink/1.1617535"
];

export async function fetchRssFeeds(): Promise<RSSItem[]> {
  try {
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
    
    // Take the 15 most recent items
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
    const response = await fetch(`${RSS_PROXY_API}${encodeURIComponent(feedUrl)}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch feed: ${response.status} ${response.statusText}`);
    }
    
    const xmlData = await response.text();
    return parseRssFeed(xmlData, feedUrl);
  } catch (error) {
    console.error(`Error fetching RSS feed ${feedUrl}:`, error);
    return [];
  }
}

// Function to parse XML data from RSS feeds
async function parseRssFeed(xmlData: string, feedUrl: string): Promise<RSSItem[]> {
  try {
    const parser = new xml2js.Parser({
      explicitArray: false
    });
    const result = await parser.parseStringPromise(xmlData);
    
    // Different RSS feeds have different structures
    const channel = result.rss?.channel;
    if (!channel) {
      console.error(`Invalid RSS format for ${feedUrl}`);
      return [];
    }
    
    // Handle array or single item
    let items = channel.item;
    if (!items) {
      return [];
    }
    
    // Make sure items is an array
    if (!Array.isArray(items)) {
      items = [items];
    }
    
    return items.map((item: any) => {
      // Get the domain as source
      const source = new URL(feedUrl).hostname.replace('www.', '');
      
      // Normalize date format (feeds use different formats)
      let pubDate = item.pubDate || item.date || new Date().toISOString();
      
      // Try to parse the date string into a standard format
      try {
        const date = new Date(pubDate);
        if (!isNaN(date.getTime())) {
          pubDate = date.toISOString();
        }
      } catch (e) {
        // If date parsing fails, use current time
        pubDate = new Date().toISOString();
      }
      
      return {
        title: item.title?.trim() || "ללא כותרת",
        description: 
          (item.description?.trim() || item.summary?.trim() || "אין פרטים נוספים")
            .replace(/<\/?[^>]+(>|$)/g, ""), // Remove HTML tags
        link: item.link || feedUrl,
        pubDate: pubDate,
        guid: item.guid?._?.trim() || item.guid?.trim() || item.id?.trim() || Math.random().toString(36).substr(2, 9)
      };
    });
  } catch (error) {
    console.error(`Error parsing RSS feed ${feedUrl}:`, error);
    return [];
  }
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
