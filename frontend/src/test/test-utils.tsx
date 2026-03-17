import React, { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from '../contexts/AppContext';
import { ToastProvider } from '../contexts/ToastContext';

interface TestAppProviderProps {
  children: ReactNode;
  initialState?: {
    isAuthenticated?: boolean;
    user?: { id: string; email: string } | null;
    loading?: boolean;
    error?: string | null;
  };
}

// Test wrapper that provides both router and app context
export const TestWrapper: React.FC<TestAppProviderProps> = ({ 
  children, 
  initialState 
}) => {
  // For now, we'll use the regular AppProvider since mocking the auth service
  // will control the authentication state
  return (
    <BrowserRouter>
      <ToastProvider>
        <AppProvider>
          {children}
        </AppProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};

// Helper to render components with all necessary providers
export const renderWithProviders = (
  ui: React.ReactElement,
  options?: { initialState?: TestAppProviderProps['initialState'] }
) => {
  const Wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
    <TestWrapper initialState={options?.initialState}>
      {children}
    </TestWrapper>
  );
  
  return { Wrapper };
};