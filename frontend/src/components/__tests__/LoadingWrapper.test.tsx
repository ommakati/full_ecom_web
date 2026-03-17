import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import LoadingWrapper from '../LoadingWrapper';

describe('LoadingWrapper', () => {
  const mockOnRetry = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading spinner when loading is true', () => {
    const { container } = render(
      <LoadingWrapper loading={true} error={null}>
        <div>Content</div>
      </LoadingWrapper>
    );

    expect(container.querySelector('.loading-spinner')).toBeInTheDocument();
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('shows error display when error is provided', () => {
    render(
      <LoadingWrapper 
        loading={false} 
        error="Something went wrong" 
        onRetry={mockOnRetry}
      >
        <div>Content</div>
      </LoadingWrapper>
    );

    expect(screen.getByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument();
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('shows children when not loading and no error', () => {
    const { container } = render(
      <LoadingWrapper loading={false} error={null}>
        <div>Content</div>
      </LoadingWrapper>
    );

    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(container.querySelector('.loading-spinner')).not.toBeInTheDocument();
  });

  it('shows empty state when showEmptyWhen is true', () => {
    render(
      <LoadingWrapper 
        loading={false} 
        error={null}
        showEmptyWhen={true}
        emptyState={<div>No items found</div>}
      >
        <div>Content</div>
      </LoadingWrapper>
    );

    expect(screen.getByText('No items found')).toBeInTheDocument();
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('calls onRetry when retry button is clicked', () => {
    render(
      <LoadingWrapper 
        loading={false} 
        error="Network error" 
        onRetry={mockOnRetry}
      >
        <div>Content</div>
      </LoadingWrapper>
    );

    const retryButton = screen.getByText('Try Again');
    fireEvent.click(retryButton);

    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });

  it('shows custom retry text', () => {
    render(
      <LoadingWrapper 
        loading={false} 
        error="Network error" 
        onRetry={mockOnRetry}
        retryText="Retry Now"
      >
        <div>Content</div>
      </LoadingWrapper>
    );

    expect(screen.getByText('Retry Now')).toBeInTheDocument();
  });

  it('shows loading with custom message', () => {
    render(
      <LoadingWrapper 
        loading={true} 
        error={null}
        loadingMessage="Loading data..."
      >
        <div>Content</div>
      </LoadingWrapper>
    );

    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('shows full screen loading when specified', () => {
    const { container } = render(
      <LoadingWrapper 
        loading={true} 
        error={null}
        fullScreen={true}
      >
        <div>Content</div>
      </LoadingWrapper>
    );

    const loadingContainer = container.querySelector('.loading-spinner-container');
    expect(loadingContainer).toHaveClass('full-screen');
  });
});