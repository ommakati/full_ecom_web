import { useState, useCallback } from 'react';
import { useToast } from '../contexts/ToastContext';
import { handleError, ErrorHandlerOptions } from '../utils/errorHandler';

interface UseErrorHandlerReturn {
  error: string | null;
  setError: (error: string | null) => void;
  clearError: () => void;
  handleAsyncError: (
    asyncFn: () => Promise<void>,
    options?: ErrorHandlerOptions & {
      successMessage?: string;
      successTitle?: string;
    }
  ) => Promise<void>;
  isHandlingError: boolean;
}

export const useErrorHandler = (): UseErrorHandlerReturn => {
  const [error, setError] = useState<string | null>(null);
  const [isHandlingError, setIsHandlingError] = useState(false);
  const toast = useToast();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleAsyncError = useCallback(
    async (
      asyncFn: () => Promise<void>,
      options: ErrorHandlerOptions & {
        successMessage?: string;
        successTitle?: string;
      } = {}
    ) => {
      const {
        successMessage,
        successTitle,
        showToast = true,
        ...errorOptions
      } = options;

      setIsHandlingError(true);
      clearError();

      try {
        await asyncFn();
        
        // Show success message if provided
        if (successMessage) {
          toast.showSuccess(successMessage, successTitle);
        }
      } catch (err) {
        const { message } = handleError(err, {
          ...errorOptions,
          logError: true,
        });

        setError(message);

        if (showToast) {
          toast.showError(message, errorOptions.toastTitle || 'Error');
        }

        // Re-throw the error so calling code can handle it if needed
        throw err;
      } finally {
        setIsHandlingError(false);
      }
    },
    [toast, clearError]
  );

  return {
    error,
    setError,
    clearError,
    handleAsyncError,
    isHandlingError,
  };
};