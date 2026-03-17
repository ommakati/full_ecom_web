import React from 'react';
import './EmptyState.css';

interface EmptyStateProps {
  title: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  actionText,
  onAction,
  icon
}) => {
  return (
    <div className="empty-state">
      {icon && <div className="empty-state-icon">{icon}</div>}
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-message">{message}</p>
      {actionText && onAction && (
        <button 
          onClick={onAction}
          className="empty-state-action"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;