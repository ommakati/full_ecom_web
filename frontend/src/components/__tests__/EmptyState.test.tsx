import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import EmptyState from '../EmptyState';

describe('EmptyState', () => {
  it('renders title and message', () => {
    render(
      <EmptyState
        title="No Items Found"
        message="There are no items to display at this time."
      />
    );

    expect(screen.getByText('No Items Found')).toBeInTheDocument();
    expect(screen.getByText('There are no items to display at this time.')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    render(
      <EmptyState
        title="No Items Found"
        message="There are no items to display at this time."
        icon={<span data-testid="custom-icon">📦</span>}
      />
    );

    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    expect(screen.getByText('📦')).toBeInTheDocument();
  });

  it('renders action button when provided', () => {
    const mockAction = vi.fn();
    
    render(
      <EmptyState
        title="No Items Found"
        message="There are no items to display at this time."
        actionText="Retry"
        onAction={mockAction}
      />
    );

    const actionButton = screen.getByText('Retry');
    expect(actionButton).toBeInTheDocument();
    
    fireEvent.click(actionButton);
    expect(mockAction).toHaveBeenCalledTimes(1);
  });

  it('does not render action button when onAction is not provided', () => {
    render(
      <EmptyState
        title="No Items Found"
        message="There are no items to display at this time."
        actionText="Retry"
      />
    );

    expect(screen.queryByText('Retry')).not.toBeInTheDocument();
  });

  it('does not render action button when actionText is not provided', () => {
    const mockAction = vi.fn();
    
    render(
      <EmptyState
        title="No Items Found"
        message="There are no items to display at this time."
        onAction={mockAction}
      />
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});