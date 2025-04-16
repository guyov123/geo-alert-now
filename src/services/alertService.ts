
import { Alert, RSSItem, LocationData } from "@/types";
import { v4 as uuidv4 } from "uuid";

// Keywords that indicate security incidents in Hebrew
const SECURITY_KEYWORDS = [
  "אזעקה", "התרעה", "פיגוע", "ירי", "טיל", "רקטה", "חדירה", "מחבל",
  "פצוע", "נפגע", "תקיפה", "מטח", "צבע אדום", "צבא", "צה״ל", "חיזבאללה", "חמאס"
];

// Map of locations in Israel (incomplete, would be expanded in a real app)
const LOCATION_KEYWORDS = {
  "תל אביב": ["תל אביב", "תל-אביב", "תל אביב-יפו", "יפו"],
  "ירושלים": ["ירושלים", "י-ם"],
  "חיפה": ["חיפה"],
  "באר שבע": ["באר שבע", "באר-שבע"],
  "נהריה": ["נהריה"],
  "אשדוד": ["אשדוד"],
  "אשקלון": ["אשקלון"],
  "עוטף עזה": ["עוטף עזה", "שדרות", "נתיב העשרה", "עזה", "כפר עזה"],
  "גליל עליון": ["גליל עליון", "קריית שמונה", "מטולה", "כפר גלעדי"],
  "רמת הגולן": ["רמת הגולן", "קצרין", "מג'דל שמס"]
};

export function classifyAlerts(rssItems: RSSItem[], userLocation: string): Alert[] {
  return rssItems.map(item => {
    // Check if the item contains security keywords
    const isSecurityAlert = SECURITY_KEYWORDS.some(keyword => 
      item.title.includes(keyword) || item.description.includes(keyword)
    );

    // Extract location from the item
    const detectedLocation = detectLocation(item.title, item.description);
    
    // Determine relevance - relevant if the detected location matches user location
    const isRelevant = isSecurityAlert && 
      userLocation && 
      isLocationRelevant(detectedLocation, userLocation);

    return {
      id: uuidv4(),
      title: item.title,
      description: item.description,
      location: detectedLocation || "לא ידוע",
      timestamp: item.pubDate,
      isRelevant: isRelevant,
      source: extractSourceFromLink(item.link),
      link: item.link
    };
  });
}

function detectLocation(title: string, description: string): string {
  const fullText = `${title} ${description}`;
  
  for (const [location, keywords] of Object.entries(LOCATION_KEYWORDS)) {
    if (keywords.some(keyword => fullText.includes(keyword))) {
      return location;
    }
  }
  
  return "לא ידוע";
}

function isLocationRelevant(detectedLocation: string, userLocation: string): boolean {
  if (!detectedLocation || detectedLocation === "לא ידוע") {
    return false;
  }
  
  // Direct match
  if (detectedLocation === userLocation) {
    return true;
  }
  
  // Check if the user location is one of the keywords for the detected location
  for (const [location, keywords] of Object.entries(LOCATION_KEYWORDS)) {
    if (location === detectedLocation) {
      return keywords.includes(userLocation);
    }
  }
  
  return false;
}

function extractSourceFromLink(link: string): string {
  try {
    const url = new URL(link);
    const hostname = url.hostname.replace('www.', '');
    
    // Map domains to readable source names
    const sourceMap: Record<string, string> = {
      'ynet.co.il': 'Ynet',
      'maariv.co.il': 'מעריב',
      'walla.co.il': 'וואלה',
      'example.com': 'דוגמה' // For our mock data
    };
    
    return sourceMap[hostname] || hostname;
  } catch {
    return "מקור לא ידוע";
  }
}
