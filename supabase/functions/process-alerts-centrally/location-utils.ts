
export function normalizeLocation(location: string): string {
  if (!location) return "";
  
  let normalized = location.trim().toLowerCase();
  normalized = normalized.replace(/[\u2010-\u2015\u2212\u23AF\uFE58\uFF0D\u002D\u05BE]/g, '-');
  normalized = normalized.replace(/\s+/g, ' ');
  
  if (normalized.includes('תל אביב') || normalized.includes('ת"א') || normalized.includes('תל-אביב')) {
    return 'תל אביב-יפו';
  }
  
  return normalized;
}

export function isLocationRelevant(alertLocation: string, userLocation: string): boolean {
  if (!alertLocation || !userLocation || alertLocation === "לא ידוע") {
    return false;
  }
  
  const normalizedAlert = normalizeLocation(alertLocation);
  const normalizedUser = normalizeLocation(userLocation);
  
  console.log(`Checking relevance: Alert location "${normalizedAlert}" vs User location "${normalizedUser}"`);
  
  // Direct match
  if (normalizedAlert === normalizedUser) {
    console.log("Direct match found");
    return true;
  }
  
  // National/regional locations that are relevant to everyone
  const nationalLocations = ["ישראל", "כל הארץ", "המרכז", "הדרום", "הצפון", "גוש דן"];
  if (nationalLocations.some(loc => normalizedAlert.includes(normalizeLocation(loc)))) {
    console.log("National location match");
    return true;
  }
  
  // Nearby locations map - more specific and restrictive
  const locationMap: Record<string, string[]> = {
    'תל אביב-יפו': ['רמת גן', 'גבעתיים', 'בני ברק', 'חולון', 'בת ים'],
    'ירושלים': ['מעלה אדומים', 'גבעת זאב'],
    'חיפה': ['קריות', 'טירת הכרמל'],
    'באר שבע': ['אופקים', 'נתיבות']
  };
  
  // Check if user's location has nearby relevant locations
  for (const [area, nearby] of Object.entries(locationMap)) {
    if (normalizedUser === normalizeLocation(area)) {
      if (nearby.some(place => normalizedAlert.includes(normalizeLocation(place)))) {
        console.log(`Nearby location match: ${area} includes ${normalizedAlert}`);
        return true;
      }
    }
  }
  
  // More restrictive substring match - only if alert location contains user location
  if (normalizedAlert.includes(normalizedUser) && normalizedUser.length > 3) {
    console.log("Substring match found");
    return true;
  }
  
  console.log("No location match found");
  return false;
}
