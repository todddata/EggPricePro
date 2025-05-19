/**
 * Geocoding utility functions
 * 
 * In a production app, this would integrate with a real geocoding service.
 * For now, we'll use simplified implementations.
 */

type Coordinates = {
  lat: number;
  lng: number;
};

/**
 * Get the coordinates for a zip code
 */
export async function getCoordinatesForZipCode(zipCode: string): Promise<Coordinates | null> {
  // In a real app, this would call a geocoding API
  // For now, return hardcoded coordinates for a few zip codes
  console.log(`Geocoding requested for zip code: ${zipCode}`);
  
  const zipCoordinates: Record<string, Coordinates> = {
    // San Francisco area
    "94110": { lat: 37.7489, lng: -122.4215 }, // San Francisco, Mission
    "94105": { lat: 37.7897, lng: -122.3995 }, // San Francisco, Financial District
    "94107": { lat: 37.7697, lng: -122.3933 }, // San Francisco, Potrero Hill
    "94103": { lat: 37.7726, lng: -122.4099 }, // San Francisco, SoMa
    "94102": { lat: 37.7797, lng: -122.4186 }, // San Francisco, Tenderloin
    
    // Denver/Colorado area
    "80126": { lat: 39.5486, lng: -104.9719 }, // Highlands Ranch/Lone Tree, Colorado
    "80129": { lat: 39.5410, lng: -105.0210 }, // Highlands Ranch West, Colorado
    "80130": { lat: 39.5630, lng: -104.9160 }, // Highlands Ranch East, Colorado
    "80124": { lat: 39.5290, lng: -104.8871 }, // Lone Tree, Colorado
    "80125": { lat: 39.4879, lng: -105.0055 }, // Roxborough Park, Colorado
    "80202": { lat: 39.7533, lng: -104.9937 }, // Denver Downtown
    "80209": { lat: 39.7108, lng: -104.9550 }, // Denver Washington Park
    "80401": { lat: 39.7555, lng: -105.2211 }, // Golden, Colorado
    
    // Other major cities
    "10001": { lat: 40.7501, lng: -73.9950 }, // New York, Manhattan
    "60601": { lat: 41.8855, lng: -87.6221 }, // Chicago, Loop
    "90001": { lat: 33.9731, lng: -118.2479 }, // Los Angeles
    "75001": { lat: 32.9617, lng: -96.8946 }, // Dallas area
  };
  
  if (zipCode in zipCoordinates) {
    console.log(`Found coordinates for ${zipCode}:`, zipCoordinates[zipCode]);
    return zipCoordinates[zipCode];
  }
  
  // Special case: If zipCode is similar to 80126, use the 80126 coordinates with slight offset
  // This helps demonstrate stores in adjacent areas during testing
  if (zipCode.startsWith("8012") || zipCode.startsWith("8013") || zipCode.startsWith("8011")) {
    // Use 80126 as a reference but add a small offset
    const baseCoords = zipCoordinates["80126"];
    const lastDigit = parseInt(zipCode.charAt(4), 10);
    const offset = lastDigit * 0.01; // Small offset based on last digit
    
    const nearbyCoords = {
      lat: baseCoords.lat + offset,
      lng: baseCoords.lng - offset
    };
    
    console.log(`Using nearby coordinates for ${zipCode} based on 80126:`, nearbyCoords);
    return nearbyCoords;
  }
  
  // For any other zip code, generate more geographically accurate coordinates
  console.log(`No hardcoded coordinates for ${zipCode}, generating approximate location`);
  
  // Use a more sophisticated algorithm that maps zip code ranges to general US regions
  const firstDigit = parseInt(zipCode.charAt(0), 10);
  let baseLat = 39.8; // Default to center of US
  let baseLng = -98.5;
  
  // Adjust base coordinates by zip code first digit which follows geographical regions
  // 0,1: Northeast, 2,3: South Atlantic, 4,5: Midwest, 6,7: Central, 8,9: West
  switch (firstDigit) {
    case 0:
    case 1:
      // Northeast
      baseLat = 41.0;
      baseLng = -74.0;
      break;
    case 2:
    case 3:
      // South Atlantic
      baseLat = 35.0;
      baseLng = -80.0;
      break;
    case 4:
    case 5:
      // Midwest
      baseLat = 40.0;
      baseLng = -86.0;
      break;
    case 6:
    case 7:
      // Central
      baseLat = 38.0;
      baseLng = -92.0;
      break;
    case 8:
    case 9:
      // West
      baseLat = 37.0;
      baseLng = -115.0;
      break;
  }
  
  // Add variation based on the remaining digits to create diverse, but nearby coordinates
  const lastFourDigits = parseInt(zipCode.substring(1), 10);
  const latVariation = (lastFourDigits % 100) * 0.02;
  const lngVariation = (lastFourDigits % 50) * 0.03;
  
  const generatedCoords = {
    lat: baseLat + latVariation,
    lng: baseLng - lngVariation
  };
  
  console.log(`Generated coordinates for ${zipCode}:`, generatedCoords);
  return generatedCoords;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * (accurate for short distances)
 */
export function calculateDistance(
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): number {
  const R = 3958.8; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
           Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
           Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Convert degrees to radians
 */
function toRad(degrees: number): number {
  return degrees * Math.PI / 180;
}

/**
 * Check if a location is within a specified radius of a center point
 */
export function isWithinRadius(
  centerLat: number,
  centerLng: number,
  pointLat: number,
  pointLng: number,
  radiusMiles: number
): boolean {
  const distance = calculateDistance(centerLat, centerLng, pointLat, pointLng);
  return distance <= radiusMiles;
}

/**
 * Get the Google Maps URL for directions to a location
 */
export function getGoogleMapsDirectionsUrl(address: string, city: string, state: string, zipCode: string): string {
  const formattedAddress = `${address}, ${city}, ${state} ${zipCode}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(formattedAddress)}`;
}
