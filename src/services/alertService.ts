
import { v4 as uuidv4 } from 'uuid';
import { Alert, RSSItem } from '@/types';
import { getOpenAIApiKeyFromSupabase, saveOpenAIApiKey, hasOpenAIApiKeyInSupabase } from './supabaseClient';

// פונקציות ניהול מפתח API

/**
 * קבלת מפתח API מהאחסון המקומי
 */
export function getOpenAIApiKeyFromLocal(): string | null {
  return localStorage.getItem('openai_api_key');
}

/**
 * בדיקה אם קיים מפתח API באחסון המקומי
 */
export function hasLocalApiKey(): boolean {
  return localStorage.getItem('openai_api_key') !== null;
}

/**
 * קבלת מפתח API - מנסה קודם בסופהבייס ואז באחסון המקומי
 */
export async function getOpenAIApiKey(): Promise<string | null> {
  try {
    // ניסיון לקבל מפתח מסופהבייס תחילה
    const supabaseKey = await getOpenAIApiKeyFromSupabase();
    if (supabaseKey) return supabaseKey;
    
    // אם אין מפתח בסופהבייס, ננסה לקבל מהאחסון המקומי
    return getOpenAIApiKeyFromLocal();
  } catch (error) {
    console.error('שגיאה בקבלת מפתח ה-API:', error);
    // במקרה של שגיאה בסופהבייס, ננסה לקבל מהאחסון המקומי
    return getOpenAIApiKeyFromLocal();
  }
}

/**
 * בדיקה אם קיים מפתח API (בסופהבייס או באחסון המקומי)
 */
export async function hasOpenAIApiKey(): Promise<boolean> {
  try {
    // ניסיון לבדוק בסופהבייס תחילה
    const hasSupabaseKey = await hasOpenAIApiKeyInSupabase();
    if (hasSupabaseKey) return true;
    
    // אם אין מפתח בסופהבייס, נבדוק באחסון המקומי
    return hasLocalApiKey();
  } catch (error) {
    console.error('שגיאה בבדיקת קיום מפתח ה-API:', error);
    // במקרה של שגיאה בסופהבייס, נבדוק באחסון המקומי
    return hasLocalApiKey();
  }
}

/**
 * שמירת מפתח API בסופהבייס ובאחסון המקומי
 */
export async function setOpenAIApiKey(key: string): Promise<void> {
  try {
    // שמירה מקומית קודם
    localStorage.setItem('openai_api_key', key);
    
    // ניסיון לשמור בסופהבייס
    await saveOpenAIApiKey(key);
  } catch (error) {
    console.error('שגיאה בשמירת מפתח ה-API:', error);
    // אם יש שגיאה בסופהבייס, לפחות המפתח נשמר מקומית
  }
}

// פונקציות סיוע

function buildPrompt(text: string): string {
  return `
טקסט: "${text}"

1. האם מדובר באירוע ביטחוני? ענה true או false בלבד.
2. אם מוזכר מיקום (עיר, יישוב, אזור גאוגרפי), כתוב את שם המקום בלבד.
3. אם לא ניתן להב��ן מה המיקום – כתוב null.

ענה בדיוק בפורמט JSON הבא:
{
  "is_security_event": true/false,
  "location": "שם המקום או null"
}
`;
}

// פונקציה לבדיקה אם המיקום רלוונטי למשתמש
function isLocationRelevant(location: string, userLocation: string): boolean {
  if (!location || !userLocation) return false;
  
  // נרמול המחרוזות להשוואה טובה יותר
  const normalizedLocation = location.trim().toLowerCase();
  const normalizedUserLocation = userLocation.trim().toLowerCase();
  
  // בדיקה פשוטה - האם המיקום שווה למיקום המשתמש
  if (normalizedLocation === normalizedUserLocation) {
    return true;
  }
  
  // בדיקת וריאציות של שמות ערים
  // תל אביב ותל אביב-יפו
  if ((normalizedLocation.includes('תל אביב') && normalizedUserLocation.includes('תל אביב')) ||
      (normalizedLocation.includes('ת"א') && (normalizedUserLocation.includes('תל אביב') || normalizedUserLocation.includes('ת"א')))) {
    return true;
  }
  
  // בדיקת הכלה - אם אחד מהם מכיל את השני
  if (normalizedLocation.includes(normalizedUserLocation) || normalizedUserLocation.includes(normalizedLocation)) {
    return true;
  }
  
  // רשימת מיקומים שייחשבו כרלוונטיים לכל המשתמשים
  const nationalLocations = ["ישראל", "כל הארץ", "המרכז", "הדרום", "הצפון", "גוש דן"];
  if (nationalLocations.some(loc => normalizedLocation.includes(loc.toLowerCase()))) {
    return true;
  }
  
  // רשימת מיקומים קרובים - למשל אזורים שקרובים לתל אביב
  const locationMap = {
    'תל אביב': ['רמת גן', 'גבעתיים', 'בני ברק', 'חולון', 'בת ים', 'רמת השרון', 'הרצליה'],
    'ירושלים': ['מעלה אדומים', 'גבעת זאב', 'בית שמש'],
    'חיפה': ['קריות', 'טירת הכרמל', 'נשר'],
    'באר שבע': ['אופקים', 'נתיבות', 'רהט', 'דימונה']
  };
  
  // בדיקה אם המיקום הוא חלק מאזור קרוב למיקום המשתמש
  for (const [area, nearby] of Object.entries(locationMap)) {
    if (normalizedUserLocation.includes(area)) {
      if (nearby.some(place => normalizedLocation.includes(place.toLowerCase()))) {
        return true;
      }
    }
  }
  
  return false;
}

// פונקציה לחילוץ מקור מקישור
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

// סיווג התראה באמצעות AI
async function classifySingleAlertWithAI(item: RSSItem, userLocation: string): Promise<Alert> {
  try {
    const fullText = `${item.title} ${item.description}`;
    
    // קבלת מפתח API באמצעות הפונקציה המאוחדת
    const apiKey = await getOpenAIApiKey();
    
    if (!apiKey) {
      console.warn("No OpenAI API key found, falling back to keyword method");
      return createAlertFromKeywords(item, userLocation);
    }
    
    const prompt = buildPrompt(fullText);
    
    console.log("Sending request to OpenAI API...");
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
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
    
    let result;
    try {
      result = JSON.parse(aiResponse);
    } catch (e) {
      console.error("Error parsing AI response:", e, aiResponse);
      return createAlertFromKeywords(item, userLocation);
    }
    
    // לאחר בקשת המשתמש - סננו רק אירועים ביטחוניים
    const isSecurityEvent = result.is_security_event === true;
    
    const isRelevant = isSecurityEvent && 
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
      link: item.link,
      isSecurityEvent: isSecurityEvent
    };
  } catch (error) {
    console.error("Error classifying alert with AI:", error);
    return createAlertFromKeywords(item, userLocation);
  }
}

// סיווג התראה באמצעות מילות מפתח
function createAlertFromKeywords(item: RSSItem, userLocation: string): Alert {
  const fullText = `${item.title} ${item.description}`.toLowerCase();
  const securityKeywords = [
    "אזעקה", "פיגוע", "ירי", "טיל", "רקטה", "פצועים", "הרוגים", "טרור",
    "חמאס", "חיזבאללה", "ג'יהאד", "דאעש", "חדירה", "צבע אדום", "צה\"ל"
  ];
  
  // בדיקה אם מדובר באירוע ביטחוני
  const isSecurityEvent = securityKeywords.some(keyword => 
    fullText.includes(keyword.toLowerCase())
  );
  
  // חילוץ מיקום (פשוט - יחזיר מקום ראשון שמופיע בטקסט)
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
  
  // בדיקה אם המיקום רלוונטי למשתמש
  const isRelevant = isSecurityEvent && isLocationRelevant(location, userLocation);
  
  return {
    id: uuidv4(),
    title: item.title,
    description: item.description,
    location: location,
    timestamp: item.pubDate,
    isRelevant: isRelevant,
    source: extractSourceFromLink(item.link),
    link: item.link,
    isSecurityEvent: isSecurityEvent
  };
}

// סיווג התראות באמצעות AI
export async function classifyAlertsWithAI(items: RSSItem[], userLocation: string): Promise<Alert[]> {
  try {
    // סיווג כל התראה במקביל באמצעות AI
    const classificationPromises = items.map(item => classifySingleAlertWithAI(item, userLocation));
    const classifiedAlerts = await Promise.all(classificationPromises);
    
    // סינון ההתראות כך שיישארו רק אירועי ביטחון
    const securityAlerts = classifiedAlerts.filter(alert => alert.isSecurityEvent);
    
    return securityAlerts;
  } catch (error) {
    console.error("Error classifying alerts with AI:", error);
    // במקרה של כשלון, ננסה שיטת מילות מפתח
    return classifyAlerts(items, userLocation);
  }
}

// סיווג התראות באמצעות מילות מפתח
export function classifyAlerts(items: RSSItem[], userLocation: string): Alert[] {
  const classifiedAlerts = items.map(item => createAlertFromKeywords(item, userLocation));
  
  // סינון ההתראות כך שיישארו רק אירועי ביטחון
  const securityAlerts = classifiedAlerts.filter(alert => alert.isSecurityEvent);
  
  return securityAlerts;
}
