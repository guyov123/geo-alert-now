
import { hasOpenAIApiKey } from './services/alertService';

export async function initializeApiKey(): Promise<void> {
  try {
    // Check if API key exists
    const hasKey = await hasOpenAIApiKey();
    console.log(`API key initialized: ${hasKey}`);
  } catch (error) {
    console.error("Failed to initialize API key:", error);
  }
}
