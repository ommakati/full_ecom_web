import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import ToastComponent, { Toast } from '../Toast';

describe('ToastComponent', () => {
  const mockOnRemove = vi.fn();
  
  const defaultToast: Toast = {
    id: 'test-toast',
    type: 'info',
    message: 'Test message',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders toast with message', () => {
    render(<ToastComponent toast={defaultToast} onRemove={mockOnRemove} />);
    
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('renders toast with title and message', () => {
    const toastWithTitle: Toast = {
      ...defaultToast,
      title: 'Test Title',
    };
    
    render(<ToastComponent toast={toastWithTitle} onRemove={mockOnRemove} />);
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('renders correct icon for each toast type', () => {
    const types: Array<{ type: Toast['type']; expectedIcon: string }> = [
      { type: 'success', expectedIcon: '✅' },
      { type: 'error', expectedIcon: '❌' },
      { type: 'warning', expectedIcon: '⚠️' },
      { type: 'info', expectedIcon: 'ℹ️' },
    ];

    types.forEach(({ type, expectedIcon }) => {
      const { unmount } = render(
        <ToastComponent 
          toast={{ ...defaultToast, type }} 
          onRemove={mockOnRemove} 
        />
      );
      
      expect(screen.getByText(expectedIcon)).toBeInTheDocument();
      unmount();
    });
  });

  it('calls onRemove when close button is clicked', () => {
    render(<ToastComponent toast={defaultToast} onRemove={mockOnRemove} />);
    
    const closeButton = screen.getByLabelText('Close notification');
    fireEvent.click(closeButton);
    
    expect(mockOnRemove).toHaveBeenCalledWith('test-toast');
  });

  it('renders action button when action is provided', () => {
    const toastWithAction: Toast = {
      ...defaultToast,
      action: {
        label: 'Retry',
        onClick: vi.fn(),
      },
    };
    
    render(<ToastComponent toast={toastWithAction} onRemove={mockOnRemove} />);
    
    const actionButton = screen.getByText('Retry');
    expect(actionButton).toBeInTheDocument();
    
    fireEvent.click(actionButton);
    expect(toastWithAction.action!.onClick).toHaveBeenCalled();
  });

  it('auto-removes toast after default duration', async () => {
    render(<ToastComponent toast={defaultToast} onRemove={mockOnRemove} />);
    
    // Fast-forward time by default duration (5000ms)
    vi.advanceTimersByTime(5000);
    
    await waitFor(() => {
      expect(mockOnRemove).toHaveBeenCalledWith('test-toast');
    });
  });

  it('auto-removes toast after custom duration', async () => {
    const toastWithCustomDuration: Toast = {
      ...defaultToast,
      duration: 3000,
    };
    
    render(<ToastComponent toast={toastWithCustomDuration} onRemove={mockOnRemove} />);
    
    // Fast-forward time by custom duration
    vi.advanceTimersByTime(3000);
    
    await waitFor(() => {
      expect(mockOnRemove).toHaveBeenCalledWith('test-toast');
    });
  });

  it('does not auto-remove when duration is 0', async () => {
    const persistentToast: Toast = {
      ...defaultToast,
      duration: 0,
    };
    
    render(<ToastComponent toast={persistentToast} onRemove={mockOnRemove} />);
    
    // Fast-forward time significantly
    vi.advanceTimersByTime(10000);
    
    // Should not have been called
    expect(mockOnRemove).not.toHaveBeenCalled();
  });

  it('applies correct CSS class for toast type', () => {
    const { container } = render(
      <ToastComponent toast={{ ...defaultToast, type: 'success' }} onRemove={mockOnRemove} />
    );
    
    const toastElement = container.querySelector('.toast');
    expect(toastElement).toHaveClass('toast-success');
  });
});