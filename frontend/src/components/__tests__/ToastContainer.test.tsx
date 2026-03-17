import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import ToastContainer from '../ToastContainer';
import { Toast } from '../Toast';

describe('ToastContainer', () => {
  const mockOnRemoveToast = vi.fn();

  const mockToasts: Toast[] = [
    {
      id: 'toast-1',
      type: 'success',
      message: 'Success message',
    },
    {
      id: 'toast-2',
      type: 'error',
      message: 'Error message',
      title: 'Error Title',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when no toasts are provided', () => {
    const { container } = render(
      <ToastContainer toasts={[]} onRemoveToast={mockOnRemoveToast} />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('renders all provided toasts', () => {
    render(<ToastContainer toasts={mockToasts} onRemoveToast={mockOnRemoveToast} />);
    
    expect(screen.getByText('Success message')).toBeInTheDocument();
    expect(screen.getByText('Error message')).toBeInTheDocument();
    expect(screen.getByText('Error Title')).toBeInTheDocument();
  });

  it('renders toasts with correct container class', () => {
    const { container } = render(
      <ToastContainer toasts={mockToasts} onRemoveToast={mockOnRemoveToast} />
    );
    
    const containerElement = container.querySelector('.toast-container');
    expect(containerElement).toBeInTheDocument();
  });

  it('renders correct number of toast components', () => {
    render(<ToastContainer toasts={mockToasts} onRemoveToast={mockOnRemoveToast} />);
    
    const toastElements = document.querySelectorAll('.toast');
    expect(toastElements).toHaveLength(2);
  });
});