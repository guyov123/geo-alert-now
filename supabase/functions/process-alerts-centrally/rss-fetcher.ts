
import { RSSItem } from './types.ts';

export async function fetchRssFeed(url: string): Promise<RSSItem[]> {
  try {
    console.log(`Fetching RSS feed from: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AlertBot/1.0)',
        'Accept': 'application/rss+xml, application/xml, text/xml'
      },
      signal: AbortSignal.timeout(25000) // 25 second timeout
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch feed: ${response.status} ${response.statusText}`);
    }
    
    const xmlText = await response.text();
    console.log(`Received XML response, length: ${xmlText.length}`);
    
    if (xmlText.length === 0) {
      console.warn(`Empty response from ${url}`);
      return [];
    }
    
    return parseRssFeedWithRegex(xmlText);
  } catch (error) {
    console.error(`Error fetching RSS feed ${url}:`, error);
    throw error;
  }
}

function parseRssFeedWithRegex(xmlText: string): RSSItem[] {
  const items: RSSItem[] = [];
  
  try {
    // Extract items using regex patterns
    const itemMatches = xmlText.match(/<item[^>]*>[\s\S]*?<\/item>/gi);
    
    if (!itemMatches) {
      console.log('No items found in RSS feed');
      return items;
    }
    
    console.log(`Found ${itemMatches.length} items in RSS feed`);
    
    for (const itemXml of itemMatches) {
      try {
        const item = parseRSSItem(itemXml);
        if (item) {
          items.push(item);
        }
      } catch (error) {
        console.error('Error parsing RSS item:', error);
        continue;
      }
    }
    
    console.log(`Successfully parsed ${items.length} items`);
    return items;
  } catch (error) {
    console.error('Error parsing RSS feed:', error);
    return items;
  }
}

function parseRSSItem(itemXml: string): RSSItem | null {
  try {
    const title = extractXmlContent(itemXml, 'title');
    const description = extractXmlContent(itemXml, 'description');
    const link = extractXmlContent(itemXml, 'link');
    const pubDate = extractXmlContent(itemXml, 'pubDate');
    const guid = extractXmlContent(itemXml, 'guid') || link || crypto.randomUUID();
    
    if (!title || !link) {
      console.log('Skipping item missing title or link');
      return null;
    }
    
    // Validate URL format
    try {
      new URL(link);
    } catch {
      console.log(`Skipping item with invalid URL: ${link}`);
      return null;
    }
    
    // Clean up HTML entities and tags
    const cleanTitle = cleanHtmlContent(title);
    const cleanDescription = cleanHtmlContent(description);
    
    // Validate date format
    let validatedDate = new Date().toISOString();
    if (pubDate) {
      try {
        const parsedDate = new Date(pubDate);
        if (!isNaN(parsedDate.getTime())) {
          validatedDate = parsedDate.toISOString();
        }
      } catch {
        console.log(`Invalid date format: ${pubDate}, using current time`);
      }
    }
    
    return {
      title: cleanTitle,
      description: cleanDescription,
      link: link,
      pubDate: validatedDate,
      guid: guid
    };
  } catch (error) {
    console.error('Error parsing RSS item:', error);
    return null;
  }
}

function extractXmlContent(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : '';
}

function cleanHtmlContent(content: string): string {
  if (!content) return '';
  
  // Remove CDATA sections
  content = content.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1');
  
  // Remove HTML tags
  content = content.replace(/<[^>]*>/g, '');
  
  // Decode HTML entities
  content = content
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
  
  return content.trim();
}
