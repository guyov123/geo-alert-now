
import { LocationData } from "@/types";

// In a real app, this would use the Geolocation API and a geocoding service
// like Google Maps API or Nominatim

// Sample locations in Israel for demonstration
const SAMPLE_LOCATIONS: Record<string, LocationData> = {
  "תל אביב": {
    city: "תל אביב",
    latitude: 32.0853,
    longitude: 34.7818
  },
  "ירושלים": {
    city: "ירושלים",
    latitude: 31.7683,
    longitude: 35.2137
  },
  "חיפה": {
    city: "חיפה",
    latitude: 32.7940,
    longitude: 34.9896
  },
  "באר שבע": {
    city: "באר שבע",
    latitude: 31.2518,
    longitude: 34.7913
  },
  "נהריה": {
    city: "נהריה",
    latitude: 33.0036,
    longitude: 35.0981
  }
};

export async function getCurrentLocation(): Promise<LocationData> {
  // In a real app, this would use the browser's geolocation API
  // For demo purposes, we'll return Tel Aviv
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(SAMPLE_LOCATIONS["תל אביב"]);
    }, 500);
  });
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<string> {
  // In a real app, this would call a geocoding API
  // For demo purposes, we'll use a lookup with rough approximation
  
  // Find the closest location in our sample data
  let closestCity = "לא ידוע";
  let minDistance = Number.MAX_VALUE;
  
  for (const [city, locationData] of Object.entries(SAMPLE_LOCATIONS)) {
    const distance = calculateDistance(
      latitude, 
      longitude, 
      locationData.latitude, 
      locationData.longitude
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      closestCity = city;
    }
  }
  
  return closestCity;
}

// Calculate distance between two points using the Haversine formula
function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI/180);
}
