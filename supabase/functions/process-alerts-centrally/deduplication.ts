
import { RSSItem } from './types.ts';

// Calculate similarity between two titles to detect duplicates
export function calculateTitleSimilarity(title1: string, title2: string): number {
  // Simple similarity check based on common words
  const words1 = title1.split(' ').filter(w => w.length > 2);
  const words2 = title2.split(' ').filter(w => w.length > 2);
  
  if (words1.length === 0 || words2.length === 0) return 0;
  
  const commonWords = words1.filter(word => words2.includes(word));
  return commonWords.length / Math.max(words1.length, words2.length);
}

export function filterDuplicates(
  items: RSSItem[], 
  existingLinks: Set<string>, 
  existingTitles: Set<string>
): RSSItem[] {
  return items.filter(item => {
    if (existingLinks.has(item.link)) {
      return false;
    }
    
    // Check for very similar titles (to avoid duplicates with slightly different links)
    const titleLower = item.title.toLowerCase();
    for (const existingTitle of existingTitles) {
      if (calculateTitleSimilarity(titleLower, existingTitle) > 0.85) {
        console.log(`Skipping similar title: "${item.title}" (similar to existing)`);
        return false;
      }
    }
    
    return true;
  });
}
