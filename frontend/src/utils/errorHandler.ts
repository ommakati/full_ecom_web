import { Toast } from '../components/Toast';

export interface ErrorHandlerOptions {
  showToast?: boolean;
  toastTitle?: string;
  toastDuration?: number;
  logError?: boolean;
  fallbackMessage?: string;
}

export class AppError extends Error {
  public readonly code?: string;
  public readonly statusCode?: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code?: string,
    statusCode?: number,
    isOperational = true
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

export const parseApiError = (error: any): string => {
  // Handle network errors
  if (!error.response) {
    if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
      return 'Network connection failed. Please check your internet connection and try again.';
    }
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return 'Request timed out. Please try again.';
    }
    return 'Unable to connect to the server. Please try again later.';
  }

  // Handle HTTP status codes
  const status = error.response?.status;
  const data = error.response?.data;

  switch (status) {
    case 400:
      return data?.message || data?.error || 'Invalid request. Please check your input and try again.';
    case 401:
      return 'You are not authorized to perform this action. Please log in and try again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 409:
      return data?.message || 'A conflict occurred. The resource may already exist.';
    case 422:
      return data?.message || 'Invalid data provided. Please check your input.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
      return 'Server error occurred. Please try again in a few moments.';
    case 502:
    case 503:
    case 504:
      return 'Service temporarily unavailable. Please try again later.';
    default:
      return data?.message || data?.error || 'An unexpected error occurred. Please try again.';
  }
};

export const handleError = (
  error: any,
  options: ErrorHandlerOptions = {}
): { message: string; toast?: Omit<Toast, 'id'> } => {
  const {
    showToast = false,
    toastTitle,
    toastDuration,
    logError = true,
    fallbackMessage = 'An unexpected error occurred'
  } = options;

  // Log error if enabled
  if (logError) {
    console.error('Error handled:', error);
  }

  // Parse error message
  let message: string;
  if (error instanceof AppError) {
    message = error.message;
  } else if (error?.response || error?.code) {
    message = parseApiError(error);
  } else if (error instanceof Error) {
    message = error.message || fallbackMessage;
  } else if (typeof error === 'string') {
    message = error;
  } else {
    message = fallbackMessage;
  }

  const result: { message: string; toast?: Omit<Toast, 'id'> } = { message };

  // Create toast if requested
  if (showToast) {
    result.toast = {
      type: 'error',
      title: toastTitle || 'Error',
      message,
      duration: toastDuration || 6000,
    };
  }

  return result;
};

export const createSuccessToast = (
  message: string,
  title?: string,
  duration?: number
): Omit<Toast, 'id'> => ({
  type: 'success',
  title,
  message,
  duration: duration || 4000,
});

export const createWarningToast = (
  message: string,
  title?: string,
  duration?: number
): Omit<Toast, 'id'> => ({
  type: 'warning',
  title,
  message,
  duration: duration || 5000,
});

export const createInfoToast = (
  message: string,
  title?: string,
  duration?: number
): Omit<Toast, 'id'> => ({
  type: 'info',
  title,
  message,
  duration: duration || 4000,
});

// Utility function to determine if an error is a network error
export const isNetworkError = (error: any): boolean => {
  return !error.response && (
    error.code === 'NETWORK_ERROR' ||
    error.message?.includes('Network Error') ||
    error.code === 'ECONNABORTED' ||
    error.message?.includes('timeout')
  );
};

// Utility function to determine if an error is a server error
export const isServerError = (error: any): boolean => {
  const status = error.response?.status;
  return status >= 500 && status < 600;
};

// Utility function to determine if an error is a client error
export const isClientError = (error: any): boolean => {
  const status = error.response?.status;
  return status >= 400 && status < 500;
};