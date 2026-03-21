// Utility functions for formatting data

/**
 * Format a price value (number or string) as currency
 * Handles both numeric and string inputs from database
 */
export const formatPrice = (price: number | string): string => {
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  if (isNaN(numericPrice)) {
    return '$0.00';
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(numericPrice);
};

/**
 * Convert a price value to a number
 * Handles both numeric and string inputs from database
 */
export const toNumber = (value: number | string): number => {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(numericValue) ? 0 : numericValue;
};

/**
 * Calculate item total safely
 */
export const calculateItemTotal = (price: number | string, quantity: number): number => {
  return toNumber(price) * quantity;
};
