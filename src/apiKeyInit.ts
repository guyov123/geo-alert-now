
import { saveOpenAIApiKey } from './services/supabaseClient';

// This file will automatically set the API key on page load if it was provided by the user

// We'll use the key in the most recent message if available
export async function initializeApiKey() {
  const apiKey = "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";
  
  if (apiKey && apiKey.length > 20) {
    try {
      // שמירה בסופהבייס וב-localStorage
      await saveOpenAIApiKey(apiKey);
      console.log("API key initialized successfully");
    } catch (error) {
      console.error("Error initializing API key:", error);
      // במקרה של שגיאה, לפחות ננסה לשמור מקומית
      localStorage.setItem('openai_api_key', apiKey);
    }
  }
}
