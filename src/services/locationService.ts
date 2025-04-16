
import { LocationData } from "@/types";

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

/**
 * Gets the current location using the device's GPS
 */
export async function getCurrentLocation(): Promise<LocationData> {
  // First try to use the browser's geolocation API
  if (navigator.geolocation) {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const { latitude, longitude } = position.coords;
      
      // Use reverse geocoding to get the city name
      const city = await reverseGeocode(latitude, longitude);
      
      return {
        city,
        latitude,
        longitude
      };
    } catch (error) {
      console.error("Error getting location:", error);
      // Fall back to default location if there's an error
      return SAMPLE_LOCATIONS["תל אביב"];
    }
  } else {
    console.warn("Geolocation is not supported by this browser");
    // Fall back to default location if geolocation is not supported
    return SAMPLE_LOCATIONS["תל אביב"];
  }
}

/**
 * Performs reverse geocoding using Nominatim API (OpenStreetMap)
 * Convert coordinates to a city name
 */
export async function reverseGeocode(latitude: number, longitude: number): Promise<string> {
  try {
    // In a real production app, you should host your own instance of Nominatim or use a commercial service
    // Nominatim usage policy requires a valid user agent: https://operations.osmfoundation.org/policies/nominatim/
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SafeSpotApp/1.0', // Required by Nominatim's usage policy
        'Accept-Language': 'he' // Prefer Hebrew results
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Extract city from the response
    // Nominatim might return different address structures
    let city = "";
    
    if (data.address) {
      // Try different fields that might contain the city name
      city = data.address.city || 
             data.address.town || 
             data.address.village || 
             data.address.municipality ||
             data.address.suburb;
    }
    
    if (!city && data.display_name) {
      // If we couldn't extract a specific city field, use the first part of display_name
      city = data.display_name.split(',')[0];
    }
    
    // If we still don't have a city, fall back to finding the closest known location
    if (!city) {
      city = findClosestKnownLocation(latitude, longitude);
    }
    
    return city;
  } catch (error) {
    console.error("Error in reverse geocoding:", error);
    // Fall back to calculating the closest known location
    return findClosestKnownLocation(latitude, longitude);
  }
}

/**
 * Finds the closest known location in our sample data
 */
function findClosestKnownLocation(latitude: number, longitude: number): string {
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
