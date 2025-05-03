
// apiKeyInit.ts is no longer needed as we're using a server-side API key
// This file is kept as a placeholder for backward compatibility

export async function initializeApiKey(): Promise<void> {
  try {
    // API key is now managed via Supabase Edge Functions
    console.log(`API key initialization bypassed - using server-side key`);
  } catch (error) {
    console.error("Failed to initialize API key:", error);
  }
}
