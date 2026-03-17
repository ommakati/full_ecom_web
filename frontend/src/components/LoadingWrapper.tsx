import React, { ReactNode } from 'react';
import LoadingSpinner from './LoadingSpinner';
import ErrorDisplay from './ErrorDisplay';

interface LoadingWrapperProps {
  loading: boolean;
  error?: string | null;
  onRetry?: () => void;
  retryText?: string;
  loadingMessage?: string;
  loadingSize?: 'small' | 'medium' | 'large';
  fullScreen?: boolean;
  children: ReactNode;
  emptyState?: ReactNode;
  showEmptyWhen?: boolean;
}

const LoadingWrapper: React.FC<LoadingWrapperProps> = ({
  loading,
  error,
  onRetry,
  retryText = 'Try Again',
  loadingMessage,
  loadingSize = 'medium',
  fullScreen = false,
  children,
  emptyState,
  showEmptyWhen = false,
}) => {
  // Show loading state
  if (loading) {
    return (
      <LoadingSpinner
        size={loadingSize}
        message={loadingMessage}
        fullScreen={fullScreen}
      />
    );
  }

  // Show error state
  if (error) {
    return (
      <ErrorDisplay
        message={error}
        onRetry={onRetry}
        retryText={retryText}
        showRetry={!!onRetry}
      />
    );
  }

  // Show empty state if condition is met
  if (showEmptyWhen && emptyState) {
    return <>{emptyState}</>;
  }

  // Show children (success state)
  return <>{children}</>;
};

export default LoadingWrapper;