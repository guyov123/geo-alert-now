
// This file will automatically set the API key on page load if it was provided by the user

// We'll use the key in the most recent message if available
export function initializeApiKey() {
  const apiKey = "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";
  
  if (apiKey && apiKey.length > 20) {
    // Only set if not already set
    if (!localStorage.getItem('openai_api_key')) {
      localStorage.setItem('openai_api_key', apiKey);
      console.log("API key initialized successfully");
    }
  }
}
