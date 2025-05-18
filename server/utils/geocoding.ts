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
  
  const zipCoordinates: Record<string, Coordinates> = {
    "94110": { lat: 37.7489, lng: -122.4215 }, // San Francisco, Mission
    "94105": { lat: 37.7897, lng: -122.3995 }, // San Francisco, Financial District
    "94107": { lat: 37.7697, lng: -122.3933 }, // San Francisco, Potrero Hill
    "94103": { lat: 37.7726, lng: -122.4099 }, // San Francisco, SoMa
    "94102": { lat: 37.7797, lng: -122.4186 }, // San Francisco, Tenderloin
  };
  
  if (zipCode in zipCoordinates) {
    return zipCoordinates[zipCode];
  }
  
  // For any other zip code, return a default SF location
  return { lat: 37.7749, lng: -122.4194 }; // San Francisco center
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
