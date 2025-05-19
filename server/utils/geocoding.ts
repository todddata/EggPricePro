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
    
    // Florida area
    "33426": { lat: 26.6765, lng: -80.1256 }, // Boynton Beach, FL
    "33433": { lat: 26.3749, lng: -80.1489 }, // Boca Raton, FL
    "33444": { lat: 26.4665, lng: -80.0720 }, // Delray Beach, FL
    "33458": { lat: 26.9256, lng: -80.1145 }, // Jupiter, FL
    "33409": { lat: 26.7070, lng: -80.0894 }, // West Palm Beach, FL
    
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
  
  // For any other zip code, generate geographically appropriate coordinates
  console.log(`No hardcoded coordinates for ${zipCode}, generating approximate location`);
  
  // Default to center of US
  let baseLat = 39.8; 
  let baseLng = -98.5;
  let regionName = "United States";
  
  // Determine region based on first digit
  const firstDigit = parseInt(zipCode.charAt(0), 10);
  
  // Florida special handling
  if (zipCode.startsWith("33") || zipCode.startsWith("34")) {
    regionName = "Florida";
    
    if (zipCode.startsWith("33")) {
      // South Florida (Miami, Fort Lauderdale, Palm Beach)
      baseLat = 26.2;
      baseLng = -80.3;
      regionName = "South Florida";
    } else {
      // Central/West Florida (Tampa, Orlando)
      baseLat = 28.1;
      baseLng = -82.4;
      regionName = "Central Florida";
    }
    
    // Add slight variation based on last digits
    const lastDigits = parseInt(zipCode.substring(3, 5), 10);
    const latOffset = (lastDigits % 10) * 0.02;
    const lngOffset = (lastDigits % 7) * 0.03;
    
    console.log(`Florida zip code detected (${zipCode}), using ${regionName} coordinates`);
    return {
      lat: baseLat + latOffset,
      lng: baseLng - lngOffset
    };
  }
  
  // Map first digit to appropriate US region
  switch (firstDigit) {
    case 0:
      // New England: CT, MA, ME, NH, RI, VT
      baseLat = 42.5;
      baseLng = -71.5;
      regionName = "New England";
      break;
    case 1:
      // Northeast: DE, NY, PA
      baseLat = 40.8;
      baseLng = -74.0;
      regionName = "Northeast";
      break;
    case 2:
      // Mid-Atlantic: DC, MD, NC, SC, VA, WV
      baseLat = 37.5;
      baseLng = -77.5;
      regionName = "Mid-Atlantic";
      break;
    case 3:
      // Southeast: AL, GA, MS, TN (Florida handled separately)
      baseLat = 34.0;
      baseLng = -85.0;
      regionName = "Southeast";
      break;
    case 4:
      // Midwest: IN, KY, MI, OH
      baseLat = 40.0;
      baseLng = -84.0;
      regionName = "Midwest (Great Lakes)";
      break;
    case 5:
      // Midwest: IA, MN, MT, ND, SD, WI
      baseLat = 43.5;
      baseLng = -93.0;
      regionName = "Midwest (Northern)";
      break;
    case 6:
      // Central: IL, KS, MO, NE
      baseLat = 39.0;
      baseLng = -92.0;
      regionName = "Central";
      break;
    case 7:
      // South Central: AR, LA, OK, TX
      baseLat = 32.0;
      baseLng = -97.0;
      regionName = "South Central";
      break;
    case 8:
      // Mountain: AZ, CO, ID, NM, NV, UT, WY
      baseLat = 39.0;
      baseLng = -106.0;
      regionName = "Mountain";
      break;
    case 9:
      // Handle specific California/West Coast regions
      if (zipCode.startsWith("90") || zipCode.startsWith("91")) {
        // Los Angeles area
        baseLat = 34.0;
        baseLng = -118.2;
        regionName = "Southern California";
      } else if (zipCode.startsWith("94") || zipCode.startsWith("95")) {
        // San Francisco/Northern CA
        baseLat = 37.7;
        baseLng = -122.4;
        regionName = "Northern California";
      } else if (zipCode.startsWith("98") || zipCode.startsWith("99")) {
        // Seattle/Pacific Northwest
        baseLat = 47.6;
        baseLng = -122.3;
        regionName = "Pacific Northwest";
      } else if (zipCode.startsWith("96") || zipCode.startsWith("97")) {
        // Hawaii & Oregon
        baseLat = 45.5;
        baseLng = -122.6;
        regionName = "Hawaii/Oregon";
      } else {
        // Other Western areas
        baseLat = 36.0;
        baseLng = -119.0;
        regionName = "Western US";
      }
      break;
  }
  
  // Add variation based on the remaining digits to create realistic, but nearby coordinates
  const lastDigits = parseInt(zipCode.substring(3, 5), 10);
  const latOffset = (lastDigits % 10) * 0.02;
  const lngOffset = (lastDigits % 7) * 0.015;
  
  console.log(`Generated coordinates for ${zipCode}: { lat: ${baseLat + latOffset}, lng: ${baseLng - lngOffset} }`);
  
  return {
    lat: baseLat + latOffset,
    lng: baseLng - lngOffset
  };
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
