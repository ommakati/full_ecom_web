import React from 'react';
import './ErrorDisplay.css';

interface ErrorDisplayProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryText?: string;
  showRetry?: boolean;
  type?: 'error' | 'warning' | 'info';
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
  retryText = 'Try Again',
  showRetry = true,
  type = 'error'
}) => {
  const getIcon = () => {
    switch (type) {
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '❌';
    }
  };

  return (
    <div className={`error-display ${type}`}>
      <div className="error-display-content">
        <div className="error-display-icon">{getIcon()}</div>
        <h3 className="error-display-title">{title}</h3>
        <p className="error-display-message">{message}</p>
        {showRetry && onRetry && (
          <button 
            onClick={onRetry}
            className="error-display-retry"
          >
            {retryText}
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorDisplay;