
async function classifySingleAlertWithAI(item: RSSItem, userLocation: string): Promise<Alert> {
  try {
    const fullText = `${item.title} ${item.description}`;
    
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
    
    let result;
    try {
      result = JSON.parse(aiResponse);
    } catch (e) {
      console.error("Error parsing AI response:", e, aiResponse);
      return createAlertFromKeywords(item, userLocation);
    }
    
    // הסרנו את הבדיקה הקפדנית לאירוע ביטחוני
    const isRelevant = result.location && 
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
