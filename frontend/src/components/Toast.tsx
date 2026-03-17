import React, { useEffect } from 'react';
import './Toast.css';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

const ToastComponent: React.FC<ToastProps> = ({ toast, onRemove }) => {
  useEffect(() => {
    if (toast.duration !== 0) {
      const timer = setTimeout(() => {
        onRemove(toast.id);
      }, toast.duration || 5000);

      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.duration, onRemove]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return 'ℹ️';
    }
  };

  return (
    <div className={`toast toast-${toast.type}`}>
      <div className="toast-content">
        <div className="toast-icon">{getIcon()}</div>
        <div className="toast-text">
          {toast.title && <div className="toast-title">{toast.title}</div>}
          <div className="toast-message">{toast.message}</div>
        </div>
        <div className="toast-actions">
          {toast.action && (
            <button
              className="toast-action-button"
              onClick={toast.action.onClick}
            >
              {toast.action.label}
            </button>
          )}
          <button
            className="toast-close-button"
            onClick={() => onRemove(toast.id)}
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
};

export default ToastComponent;