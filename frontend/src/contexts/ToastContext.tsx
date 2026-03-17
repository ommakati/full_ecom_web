import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Toast } from '../components/Toast';

interface ToastState {
  toasts: Toast[];
}

type ToastAction =
  | { type: 'ADD_TOAST'; payload: Toast }
  | { type: 'REMOVE_TOAST'; payload: string }
  | { type: 'CLEAR_TOASTS' };

const initialState: ToastState = {
  toasts: [],
};

const toastReducer = (state: ToastState, action: ToastAction): ToastState => {
  switch (action.type) {
    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [...state.toasts, action.payload],
      };
    case 'REMOVE_TOAST':
      return {
        ...state,
        toasts: state.toasts.filter(toast => toast.id !== action.payload),
      };
    case 'CLEAR_TOASTS':
      return {
        ...state,
        toasts: [],
      };
    default:
      return state;
  }
};

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  showSuccess: (message: string, title?: string, options?: Partial<Toast>) => void;
  showError: (message: string, title?: string, options?: Partial<Toast>) => void;
  showWarning: (message: string, title?: string, options?: Partial<Toast>) => void;
  showInfo: (message: string, title?: string, options?: Partial<Toast>) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(toastReducer, initialState);

  const generateId = () => `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const newToast: Toast = {
      ...toast,
      id: generateId(),
    };
    dispatch({ type: 'ADD_TOAST', payload: newToast });
  };

  const removeToast = (id: string) => {
    dispatch({ type: 'REMOVE_TOAST', payload: id });
  };

  const clearToasts = () => {
    dispatch({ type: 'CLEAR_TOASTS' });
  };

  const showSuccess = (message: string, title?: string, options?: Partial<Toast>) => {
    addToast({
      type: 'success',
      message,
      title,
      duration: 4000,
      ...options,
    });
  };

  const showError = (message: string, title?: string, options?: Partial<Toast>) => {
    addToast({
      type: 'error',
      message,
      title,
      duration: 6000,
      ...options,
    });
  };

  const showWarning = (message: string, title?: string, options?: Partial<Toast>) => {
    addToast({
      type: 'warning',
      message,
      title,
      duration: 5000,
      ...options,
    });
  };

  const showInfo = (message: string, title?: string, options?: Partial<Toast>) => {
    addToast({
      type: 'info',
      message,
      title,
      duration: 4000,
      ...options,
    });
  };

  const contextValue: ToastContextType = {
    toasts: state.toasts,
    addToast,
    removeToast,
    clearToasts,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};