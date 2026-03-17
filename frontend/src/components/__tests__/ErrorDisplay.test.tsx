import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import ErrorDisplay from '../ErrorDisplay';

describe('ErrorDisplay', () => {
  it('renders with default props', () => {
    render(<ErrorDisplay message="Error occurred" />);
    
    expect(screen.getByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument();
    expect(screen.getByText('Error occurred')).toBeInTheDocument(); // Message
    expect(screen.getByText('❌')).toBeInTheDocument(); // Default error icon
  });

  it('renders with custom title', () => {
    render(
      <ErrorDisplay
        title="Custom Error Title"
        message="Custom error message"
      />
    );
    
    expect(screen.getByText('Custom Error Title')).toBeInTheDocument();
    expect(screen.getByText('Custom error message')).toBeInTheDocument();
  });

  it('renders retry button and handles click', () => {
    const mockRetry = vi.fn();
    
    render(
      <ErrorDisplay
        message="Error occurred"
        onRetry={mockRetry}
        retryText="Try Again"
      />
    );
    
    const retryButton = screen.getByText('Try Again');
    expect(retryButton).toBeInTheDocument();
    
    fireEvent.click(retryButton);
    expect(mockRetry).toHaveBeenCalledTimes(1);
  });

  it('does not render retry button when showRetry is false', () => {
    const mockRetry = vi.fn();
    
    render(
      <ErrorDisplay
        message="Error occurred"
        onRetry={mockRetry}
        showRetry={false}
      />
    );
    
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders warning type with correct icon', () => {
    render(
      <ErrorDisplay
        message="Warning message"
        type="warning"
      />
    );
    
    expect(screen.getByText('⚠️')).toBeInTheDocument();
    expect(document.querySelector('.error-display.warning')).toBeInTheDocument();
  });

  it('renders info type with correct icon', () => {
    render(
      <ErrorDisplay
        message="Info message"
        type="info"
      />
    );
    
    expect(screen.getByText('ℹ️')).toBeInTheDocument();
    expect(document.querySelector('.error-display.info')).toBeInTheDocument();
  });

  it('uses default retry text when not provided', () => {
    const mockRetry = vi.fn();
    
    render(
      <ErrorDisplay
        message="Error occurred"
        onRetry={mockRetry}
      />
    );
    
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('does not render retry button when onRetry is not provided', () => {
    render(
      <ErrorDisplay
        message="Error occurred"
        showRetry={true}
      />
    );
    
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});