
import { RSSItem, Alert } from './types.ts';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

export async function classifyAlertWithAI(item: RSSItem): Promise<Alert> {
  // Check if OpenAI API key is available
  if (!openAIApiKey) {
    console.log("OpenAI API key not available, falling back to keyword classification");
    return createAlertFromKeywords(item);
  }

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

ענה רק בפורמט JSON הבא ללא כל תוכן נוסף:
{
  "is_security_event": true/false,
  "location": "שם המקום הספציפי או null"
}
`;

  try {
    console.log(`Sending classification request for: "${item.title.substring(0, 50)}..."`);
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openAIApiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ 
          role: "user", 
          content: prompt 
        }],
        temperature: 0,
        max_tokens: 100
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenAI API error (${response.status}): ${errorText}`);
      throw new Error(`OpenAI API error: ${response.status}`);
    }
    
    const data = await response.json();
    const aiResponse = data.choices[0].message.content.trim();
    console.log(`Raw AI Response for "${item.title}": ${aiResponse}`);
    
    // Clean the response - remove markdown code blocks and extra text
    let cleanResponse = aiResponse;
    if (cleanResponse.includes('```json')) {
      cleanResponse = cleanResponse.split('```json')[1].split('```')[0].trim();
    } else if (cleanResponse.includes('```')) {
      cleanResponse = cleanResponse.split('```')[1].trim();
    }
    
    // Extract JSON from response if it contains extra text
    const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanResponse = jsonMatch[0];
    }
    
    console.log(`Cleaned AI Response: ${cleanResponse}`);
    
    let result;
    try {
      result = JSON.parse(cleanResponse);
    } catch (parseError) {
      console.error(`JSON parse error for response: "${cleanResponse}". Error: ${parseError}`);
      console.log("Falling back to keyword classification due to JSON parse error");
      return createAlertFromKeywords(item);
    }
    
    // Validate the result structure
    if (typeof result.is_security_event !== 'boolean') {
      console.error(`Invalid is_security_event value: ${result.is_security_event}`);
      return createAlertFromKeywords(item);
    }
    
    const alert: Alert = {
      id: crypto.randomUUID(),
      title: item.title,
      description: item.description,
      location: result.location === "null" || !result.location ? "לא ידוע" : result.location,
      timestamp: item.pubDate,
      source: extractSourceFromLink(item.link),
      link: item.link,
      is_security_event: result.is_security_event === true
    };
    
    console.log(`Classification complete: security=${alert.is_security_event}, location="${alert.location}"`);
    return alert;
    
  } catch (error) {
    console.error("Error classifying alert with AI:", error);
    console.log("Falling back to keyword classification");
    return createAlertFromKeywords(item);
  }
}

function createAlertFromKeywords(item: RSSItem): Alert {
  console.log(`Using keyword classification for: "${item.title}"`);
  
  const fullText = `${item.title} ${item.description}`.toLowerCase();
  const securityKeywords = [
    "אזעקה", "פיגוע", "ירי", "טיל", "רקטה", "פצועים", "הרוגים", "טרור",
    "חמאס", "חיזבאללה", "ג'יהאד", "דאעש", "חדירה", "צבע אדום", "צה\"ל",
    "פיצוץ", "התקפה", "נפגעים", "מבצע", "כוחות", "צבא", "שיגור", "יירוט"
  ];
  
  const isSecurityEvent = securityKeywords.some(keyword => 
    fullText.includes(keyword.toLowerCase())
  );
  
  let location = "לא ידוע";
  const cityNames = [
    "תל אביב", "ירושלים", "חיפה", "באר שבע", "אשדוד", "אשקלון", 
    "רמת גן", "חדרה", "נתניה", "אילת", "עזה", "לבנון", "הגליל", "הנגב",
    "ראשון לציון", "פתח תקווה", "חולון", "בת ים", "בני ברק", "רמלה",
    "כפר סבא", "הרצליה", "גבעתיים", "קריית אונו"
  ];
  
  for (const city of cityNames) {
    if (fullText.includes(city.toLowerCase())) {
      location = city;
      break;
    }
  }
  
  console.log(`Keyword classification result: security=${isSecurityEvent}, location="${location}"`);
  
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
    if (hostname.includes("0404")) return "0404";
    
    return hostname.split('.')[1] || hostname;
  } catch (e) {
    return "לא ידוע";
  }
}
