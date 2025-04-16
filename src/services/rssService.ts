
import { RSSItem } from "@/types";

// This is a mock implementation for demonstration purposes
// In a real app, you would use a proper RSS parser library or a backend service

const RSS_PROXY_API = "https://api.allorigins.win/raw?url=";

// List of Israeli news RSS feeds
const RSS_FEEDS = [
  "https://www.ynet.co.il/Integration/StoryRss2.xml",
  "https://rss.walla.co.il/feed/1",
  "https://www.maariv.co.il/Rss/RssFeedsMain"
];

export async function fetchRssFeeds(): Promise<RSSItem[]> {
  try {
    // In a real app, we would fetch from actual RSS feeds
    // For demo purposes, we'll return mock data
    return getMockRssItems();
  } catch (error) {
    console.error("Error fetching RSS feeds:", error);
    return [];
  }
}

// This function would normally make actual fetch requests
// but for the demo we're returning mock data
async function fetchRssFeed(feedUrl: string): Promise<RSSItem[]> {
  try {
    const response = await fetch(`${RSS_PROXY_API}${encodeURIComponent(feedUrl)}`);
    const data = await response.text();
    
    // Parse XML and extract items
    // This is a placeholder and would need a proper XML parser in a real app
    
    return [];
  } catch (error) {
    console.error(`Error fetching RSS feed ${feedUrl}:`, error);
    return [];
  }
}

// Mock data for demonstration
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
