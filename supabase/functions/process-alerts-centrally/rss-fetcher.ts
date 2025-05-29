
import { RSSItem } from './types.ts';

const RSS_PROXY_API = "https://api.allorigins.win/raw?url=";

export async function fetchRssFeed(feedUrl: string): Promise<RSSItem[]> {
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
