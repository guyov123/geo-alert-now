import { v4 as uuidv4 } from 'uuid';
import { Alert, RSSItem } from '@/types';
import { supabase } from '@/integrations/supabase/client';

// פונקציית עזר לנירמול שמות מיקומים
function normalizeLocation(location: string): string {
  if (!location) return "";
  
  // המרה למחרוזת בסיסית
  let normalized = location.trim();
  
  // החלפת כל סוגי המקפים לאחיד (מקף רגיל)
  normalized = normalized.replace(/[\u2010-\u2015\u2212\u23AF\uFE58\uFF0D\u002D\u05BE]/g, '-');
  
  // הסרת רווחים מיותרים
  normalized = normalized.replace(/\s+/g, ' ');
  
  // המרה לאותיות קטנות לצורך השוואה
  normalized = normalized.toLowerCase();
  
  // נרמול תל אביב ותל אביב-יפו
  if (normalized.includes('תל אביב') || normalized.includes('ת"א') || normalized.includes('תל-אביב')) {
    return 'תל אביב-יפו';
  }
  
  return normalized;
}

// פונקציה לבדיקה אם המיקום רלוונטי למשתמש
function isLocationRelevant(location: string, userLocation: string): boolean {
  if (!location || !userLocation) return false;
  
  // נרמול המחרוזות להשוואה טובה יותר
  const normalizedLocation = normalizeLocation(location);
  const normalizedUserLocation = normalizeLocation(userLocation);
  
  console.log(`DEBUG: Comparing normalized locations: "${normalizedLocation}" with user location "${normalizedUserLocation}"`);
  
  // בדיקה ישירה לאחר נרמול
  if (normalizedLocation === normalizedUserLocation) {
    console.log("DEBUG: Direct match found after normalization");
    return true;
  }
  
  // רשימת מיקומים שייחשבו כרלוונטיים לכל המשתמשים
  const nationalLocations = ["ישראל", "כל הארץ", "המרכז", "הדרום", "הצפון", "גוש דן"];
  if (nationalLocations.some(loc => normalizedLocation.includes(normalizeLocation(loc)))) {
    console.log("DEBUG: National location match found");
    return true;
  }
  
  // רשימת מיקומים קרובים - למשל אזורים שקרובים לתל אביב
  const locationMap = {
    'תל אביב-יפו': ['רמת גן', 'גבעתיים', 'בני ברק', 'חולון', 'בת ים', 'רמת השרון', 'הרצליה'],
    'ירושלים': ['מעלה אדומים', 'גבעת זאב', 'בית שמש'],
    'חיפה': ['קריות', 'טירת הכרמל', 'נשר'],
    'באר שבע': ['אופקים', 'נתיבות', 'רהט', 'דימונה']
  };
  
  // בדיקה אם המיקום הוא חלק מאזור קרוב למיקום המשתמש
  for (const [area, nearby] of Object.entries(locationMap)) {
    const normalizedArea = normalizeLocation(area);
    if (normalizedUserLocation === normalizedArea) {
      if (nearby.some(place => normalizedLocation.includes(normalizeLocation(place)))) {
        console.log(`DEBUG: Nearby location match found: ${area} includes ${normalizedLocation}`);
        return true;
      }
    }
  }
  
  // בדיקת הכלה - אם אחד מהם מכיל את השני
  if (normalizedLocation.includes(normalizedUserLocation) || normalizedUserLocation.includes(normalizedLocation)) {
    console.log("DEBUG: Substring match found");
    return true;
  }
  
  console.log("DEBUG: No location match found");
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

// סיווג התראה באמצעות Edge Function ב־Supabase
async function classifySingleAlertWithAI(item: RSSItem, userLocation: string): Promise<Alert> {
  try {
    const fullText = `${item.title} ${item.description}`;
    
    console.log("Sending request to Supabase Edge Function for classification");
    const { data: result, error } = await supabase.functions.invoke('classify-alert', {
      body: JSON.stringify({
        text: fullText,
        userLocation
      })
    });
    
    if (error) {
      console.error("Edge Function error:", error);
      return createAlertFromKeywords(item, userLocation);
    }
    
    if (!result) {
      console.error("No result from Edge Function");
      return createAlertFromKeywords(item, userLocation);
    }
    
    console.log("Received response from Edge Function:", result);
    
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

// בדיקה אם AI סיווג פעיל עבור משתמש - הפונקציה מוחזרת לצורכי תאימות עם קוד קיים
export function hasLocalApiKey(): boolean {
  // All users now have access to AI classification through the Edge Function
  return true;
}

// Added for compatibility with existing code
export function hasOpenAIApiKey(): Promise<boolean> {
  return Promise.resolve(true);
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

// Added for compatibility with existing code
export function setOpenAIApiKey(): Promise<void> {
  return Promise.resolve();
}

// סיווג התראות באמצעות מילות מפתח
export function classifyAlerts(items: RSSItem[], userLocation: string): Alert[] {
  const classifiedAlerts = items.map(item => createAlertFromKeywords(item, userLocation));
  
  // סינון ההתראות כך שיישארו רק אירועי ביטחון
  const securityAlerts = classifiedAlerts.filter(alert => alert.isSecurityEvent);
  
  return securityAlerts;
}
