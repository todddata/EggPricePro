/**
 * Format an address for Google Maps directions URL
 */
export function getGoogleMapsDirectionsUrl(
  address: string,
  city: string,
  state: string,
  zipCode: string
): string {
  const formattedAddress = `${address}, ${city}, ${state} ${zipCode}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(formattedAddress)}`;
}

/**
 * Calculate the distance between two coordinates in miles
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
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
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
 * Format a zip code (adds leading zeros if needed)
 */
export function formatZipCode(zipCode: string): string {
  // Ensure it's exactly 5 digits
  return zipCode.padStart(5, '0');
}
