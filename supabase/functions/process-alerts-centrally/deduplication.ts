
import { RSSItem } from './types.ts';

// Enhanced similarity calculation
export function calculateTitleSimilarity(title1: string, title2: string): number {
  const normalize = (str: string) => str.toLowerCase().trim()
    .replace(/[^\w\s\u0590-\u05FF]/g, '') // Keep Hebrew characters
    .replace(/\s+/g, ' ');
  
  const normalized1 = normalize(title1);
  const normalized2 = normalize(title2);
  
  // Exact match after normalization
  if (normalized1 === normalized2) return 1.0;
  
  // Word-based similarity with Hebrew support
  const words1 = normalized1.split(/\s+/).filter(w => w.length > 1);
  const words2 = normalized2.split(/\s+/).filter(w => w.length > 1);
  
  if (words1.length === 0 || words2.length === 0) return 0;
  
  // Calculate Jaccard similarity
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}

// Enhanced content similarity for descriptions
function calculateContentSimilarity(desc1: string, desc2: string): number {
  if (!desc1 || !desc2) return 0;
  
  const normalize = (str: string) => str.toLowerCase().trim()
    .replace(/[^\w\s\u0590-\u05FF]/g, '')
    .replace(/\s+/g, ' ');
  
  const normalized1 = normalize(desc1);
  const normalized2 = normalize(desc2);
  
  if (normalized1 === normalized2) return 1.0;
  
  // Check for substantial overlap in content
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
  console.log(`Starting deduplication process with ${items.length} items`);
  
  const processedItems: RSSItem[] = [];
  const seenTitles = new Set<string>();
  const seenLinks = new Set<string>();
  const processedTitles: string[] = [];
  
  for (const item of items) {
    // Skip if exact link already exists
    if (existingLinks.has(item.link) || seenLinks.has(item.link)) {
      console.log(`Skipping duplicate link: "${item.link}"`);
      continue;
    }
    
    // Normalize title for comparison
    const normalizedTitle = item.title.toLowerCase().trim()
      .replace(/[^\w\s\u0590-\u05FF]/g, '')
      .replace(/\s+/g, ' ');
    
    // Skip if exact title already seen in this batch
    if (seenTitles.has(normalizedTitle)) {
      console.log(`Skipping duplicate title in batch: "${item.title}"`);
      continue;
    }
    
    // Check for very similar titles against existing titles
    let isDuplicate = false;
    for (const existingTitle of existingTitles) {
      const similarity = calculateTitleSimilarity(normalizedTitle, existingTitle);
      if (similarity > 0.85) {
        console.log(`Skipping similar title: "${item.title}" (similar to existing: "${existingTitle}", similarity: ${similarity.toFixed(2)})`);
        isDuplicate = true;
        break;
      }
    }
    
    if (isDuplicate) continue;
    
    // Check against already processed items in this batch
    for (let i = 0; i < processedItems.length; i++) {
      const processedItem = processedItems[i];
      const titleSimilarity = calculateTitleSimilarity(normalizedTitle, processedTitles[i]);
      const contentSimilarity = calculateContentSimilarity(item.description, processedItem.description);
      
      // Consider it a duplicate if either title similarity is very high or both title and content are moderately similar
      if (titleSimilarity > 0.85 || (titleSimilarity > 0.6 && contentSimilarity > 0.6)) {
        console.log(`Skipping similar item: "${item.title}" (similar to: "${processedItem.title}", title_sim: ${titleSimilarity.toFixed(2)}, content_sim: ${contentSimilarity.toFixed(2)})`);
        isDuplicate = true;
        break;
      }
    }
    
    if (!isDuplicate) {
      processedItems.push(item);
      seenTitles.add(normalizedTitle);
      seenLinks.add(item.link);
      processedTitles.push(normalizedTitle);
      console.log(`Added item: "${item.title}"`);
    }
  }
  
  console.log(`Deduplication complete: ${items.length} -> ${processedItems.length} items`);
  return processedItems;
}
