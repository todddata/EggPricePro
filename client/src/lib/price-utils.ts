/**
 * Get a color value for a price point between min and max prices
 */
export function getPriceColor(price: number, minPrice: number, maxPrice: number): string {
  // If all prices are the same
  if (minPrice === maxPrice) {
    return '#10B981'; // Default to green
  }
  
  // Calculate where this price falls in the range (0 to 1)
  const ratio = (price - minPrice) / (maxPrice - minPrice);
  
  // Green to yellow to red gradient based on price ratio
  if (ratio <= 0.5) {
    // Green to yellow (lower half of range)
    const r = Math.round(255 * (ratio * 2));
    const g = 185;
    return `rgb(${r}, ${g}, 35)`;
  } else {
    // Yellow to red (upper half of range)
    const adjustedRatio = (ratio - 0.5) * 2;
    const g = Math.round(185 * (1 - adjustedRatio));
    return `rgb(255, ${g}, 35)`;
  }
}

/**
 * Format a date for display
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Format a price for display
 */
export function formatPrice(price: number | null | undefined): string {
  if (price === null || price === undefined) {
    return 'N/A';
  }
  
  return `$${price.toFixed(2)}`;
}

/**
 * Calculate percent change between two prices
 */
export function calculatePercentChange(oldPrice: number, newPrice: number): number {
  return ((newPrice - oldPrice) / oldPrice) * 100;
}

/**
 * Format a percent change for display, with + or - sign
 */
export function formatPercentChange(percentChange: number): string {
  const sign = percentChange >= 0 ? '+' : '';
  return `${sign}${percentChange.toFixed(1)}%`;
}
