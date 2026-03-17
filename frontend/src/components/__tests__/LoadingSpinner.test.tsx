import React from 'react';
import { render, screen } from '@testing-library/react';
import LoadingSpinner from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders with default props', () => {
    render(<LoadingSpinner />);
    
    expect(document.querySelector('.loading-spinner.medium')).toBeInTheDocument();
    expect(document.querySelector('.spinner')).toBeInTheDocument();
  });

  it('renders with custom size', () => {
    render(<LoadingSpinner size="large" />);
    
    expect(document.querySelector('.loading-spinner.large')).toBeInTheDocument();
  });

  it('renders with message', () => {
    render(<LoadingSpinner message="Loading data..." />);
    
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('renders in full screen mode', () => {
    render(<LoadingSpinner fullScreen />);
    
    expect(document.querySelector('.loading-spinner-container.full-screen')).toBeInTheDocument();
  });

  it('renders small size correctly', () => {
    render(<LoadingSpinner size="small" />);
    
    expect(document.querySelector('.loading-spinner.small')).toBeInTheDocument();
  });

  it('renders with both message and custom size', () => {
    render(<LoadingSpinner size="large" message="Please wait..." />);
    
    expect(document.querySelector('.loading-spinner.large')).toBeInTheDocument();
    expect(screen.getByText('Please wait...')).toBeInTheDocument();
  });
});