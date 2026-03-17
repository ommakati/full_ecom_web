// Utility functions for form validation

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 */
export const isValidPassword = (password: string): boolean => {
  // At least 6 characters
  return password.length >= 6;
};

/**
 * Validate required field
 */
export const isRequired = (value: string): boolean => {
  return value.trim().length > 0;
};

/**
 * Validate positive number
 */
export const isPositiveNumber = (value: number): boolean => {
  return value > 0;
};

/**
 * Validate price format
 */
export const isValidPrice = (price: string): boolean => {
  const priceRegex = /^\d+(\.\d{1,2})?$/;
  return priceRegex.test(price) && parseFloat(price) > 0;
};