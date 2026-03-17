import React from 'react';
import ToastComponent, { Toast } from './Toast';
import './ToastContainer.css';

interface ToastContainerProps {
  toasts: Toast[];
  onRemoveToast: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemoveToast }) => {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <ToastComponent
          key={toast.id}
          toast={toast}
          onRemove={onRemoveToast}
        />
      ))}
    </div>
  );
};

export default ToastContainer;