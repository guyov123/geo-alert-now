
import { RSSItem, Alert } from './types.ts';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY')!;

export async function classifyAlertWithAI(item: RSSItem): Promise<Alert> {
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
