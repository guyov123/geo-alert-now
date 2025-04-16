
import { Alert, RSSItem, LocationData } from "@/types";
import { v4 as uuidv4 } from "uuid";

// Keywords that indicate security incidents in Hebrew (as backup for when AI is not available)
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
  "רמת הגולן": ["רמת הגולן", "קצרין", "מג'דל שמס"],
  "חווארה": ["חווארה", "חוארה", "מחסום חווארה"],
  "שומרון": ["שומרון"]
};

// Function to securely store the API key in localStorage
export function setOpenAIApiKey(apiKey: string) {
  localStorage.setItem('openai_api_key', apiKey);
  return true;
}

// Function to get the stored API key
export function getOpenAIApiKey(): string | null {
  return localStorage.getItem('openai_api_key');
}

// Function to check if API key is already set
export function hasOpenAIApiKey(): boolean {
  const key = getOpenAIApiKey();
  return !!key && key.length > 20; // Basic validation that the key looks legitimate
}

export async function classifyAlertsWithAI(rssItems: RSSItem[], userLocation: string): Promise<Alert[]> {
  try {
    // Process items in small batches to avoid overwhelming the OpenAI API
    const batchSize = 5;
    const batches = [];
    
    for (let i = 0; i < rssItems.length; i += batchSize) {
      batches.push(rssItems.slice(i, i + batchSize));
    }
    
    let classifiedAlerts: Alert[] = [];
    
    for (const batch of batches) {
      // Process each batch in parallel
      const promises = batch.map(item => classifySingleAlertWithAI(item, userLocation));
      const batchResults = await Promise.all(promises);
      classifiedAlerts = [...classifiedAlerts, ...batchResults];
    }
    
    return classifiedAlerts;
  } catch (error) {
    console.error("Error using AI classification, falling back to keyword method:", error);
    // Fallback to the keyword-based method
    return classifyAlerts(rssItems, userLocation);
  }
}

async function classifySingleAlertWithAI(item: RSSItem, userLocation: string): Promise<Alert> {
  try {
    // Combine title and description for analysis
    const fullText = `${item.title} ${item.description}`;
    
    // Get API key from localStorage instead of environment variables
    const OPENAI_API_KEY = getOpenAIApiKey();
    
    if (!OPENAI_API_KEY) {
      console.warn("No OpenAI API key found in localStorage, falling back to keyword method");
      return createAlertFromKeywords(item, userLocation);
    }
    
    const prompt = buildPrompt(fullText);
    
    console.log("Sending request to OpenAI API...");
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", errorText);
      return createAlertFromKeywords(item, userLocation);
    }
    
    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    console.log("Received response from OpenAI:", aiResponse);
    
    // Parse the JSON response
    let result;
    try {
      result = JSON.parse(aiResponse);
    } catch (e) {
      console.error("Error parsing AI response:", e, aiResponse);
      return createAlertFromKeywords(item, userLocation);
    }
    
    // Check if the location is relevant to the user
    const isRelevant = result.is_security_event && 
      result.location && 
      result.location !== "null" && 
      isLocationRelevant(result.location, userLocation);
    
    return {
      id: uuidv4(),
      title: item.title,
      description: item.description,
      location: result.location === "null" ? "לא ידוע" : result.location,
      timestamp: item.pubDate,
      isRelevant: isRelevant,
      source: extractSourceFromLink(item.link),
      link: item.link
    };
  } catch (error) {
    console.error("Error classifying alert with AI:", error);
    return createAlertFromKeywords(item, userLocation);
  }
}

function buildPrompt(text: string): string {
  return `
טקסט: "${text}"

1. האם מדובר באירוע ביטחוני? ענה true או false בלבד.
2. אם מוזכר מיקום (עיר, יישוב, אזור גאוגרפי), כתוב את שם המקום בלבד.
3. אם לא ניתן להבין מה המיקום – כתוב null.

ענה בדיוק בפורמט JSON הבא:
{
  "is_security_event": true/false,
  "location": "שם המקום או null"
}
`;
}

function createAlertFromKeywords(item: RSSItem, userLocation: string): Alert {
  // If AI classification fails, use the existing keyword method
  const isSecurityAlert = SECURITY_KEYWORDS.some(keyword => 
    item.title.includes(keyword) || item.description.includes(keyword)
  );

  const detectedLocation = detectLocation(item.title, item.description);
  
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
}

// The existing keyword-based classification method
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
      'example.com': 'דוגמה', // For our mock data
      'inn.co.il': 'ערוץ 7',
      'haaretz.co.il': 'הארץ'
    };
    
    return sourceMap[hostname] || hostname;
  } catch {
    return "מקור לא ידוע";
  }
}
