
import { RSSItem } from './types.ts';

// Calculate similarity between two titles to detect duplicates
export function calculateTitleSimilarity(title1: string, title2: string): number {
  const normalize = (str: string) => str.toLowerCase().trim().replace(/[^\w\s]/g, '');
  
  const normalized1 = normalize(title1);
  const normalized2 = normalize(title2);
  
  // Exact match after normalization
  if (normalized1 === normalized2) return 1.0;
  
  // Word-based similarity
  const words1 = normalized1.split(/\s+/).filter(w => w.length > 2);
  const words2 = normalized2.split(/\s+/).filter(w => w.length > 2);
  
  if (words1.length === 0 || words2.length === 0) return 0;
  
  const commonWords = words1.filter(word => words2.includes(word));
  return commonWords.length / Math.max(words1.length, words2.length);
}

export function filterDuplicates(
  items: RSSItem[], 
  existingLinks: Set<string>, 
  existingTitles: Set<string>
): RSSItem[] {
  const processedItems: RSSItem[] = [];
  const seenTitles = new Set<string>();
  const seenLinks = new Set<string>();
  
  for (const item of items) {
    // Skip if exact link already exists
    if (existingLinks.has(item.link) || seenLinks.has(item.link)) {
      console.log(`Skipping duplicate link: "${item.link}"`);
      continue;
    }
    
    // Normalize title for comparison
    const normalizedTitle = item.title.toLowerCase().trim();
    
    // Skip if exact title already seen in this batch
    if (seenTitles.has(normalizedTitle)) {
      console.log(`Skipping duplicate title in batch: "${item.title}"`);
      continue;
    }
    
    // Check for very similar titles against existing titles
    let isDuplicate = false;
    for (const existingTitle of existingTitles) {
      const similarity = calculateTitleSimilarity(normalizedTitle, existingTitle);
      if (similarity > 0.9) { // Increased threshold for stricter filtering
        console.log(`Skipping similar title: "${item.title}" (similar to existing: "${existingTitle}", similarity: ${similarity})`);
        isDuplicate = true;
        break;
      }
    }
    
    if (isDuplicate) continue;
    
    // Check against already processed items in this batch
    for (const processedItem of processedItems) {
      const similarity = calculateTitleSimilarity(normalizedTitle, processedItem.title.toLowerCase());
      if (similarity > 0.9) {
        console.log(`Skipping similar title in batch: "${item.title}" (similar to: "${processedItem.title}", similarity: ${similarity})`);
        isDuplicate = true;
        break;
      }
    }
    
    if (!isDuplicate) {
      processedItems.push(item);
      seenTitles.add(normalizedTitle);
      seenLinks.add(item.link);
    }
  }
  
  return processedItems;
}
