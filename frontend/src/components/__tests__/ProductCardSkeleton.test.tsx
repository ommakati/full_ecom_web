import React from 'react';
import { render } from '@testing-library/react';
import ProductCardSkeleton from '../ProductCardSkeleton';

describe('ProductCardSkeleton', () => {
  it('renders skeleton product card structure', () => {
    render(<ProductCardSkeleton />);
    
    expect(document.querySelector('.skeleton-product-card')).toBeInTheDocument();
    expect(document.querySelector('.skeleton-image')).toBeInTheDocument();
    expect(document.querySelector('.skeleton-content')).toBeInTheDocument();
    expect(document.querySelector('.skeleton-title')).toBeInTheDocument();
    expect(document.querySelector('.skeleton-price')).toBeInTheDocument();
    expect(document.querySelector('.skeleton-button')).toBeInTheDocument();
  });

  it('renders multiple skeleton description lines', () => {
    render(<ProductCardSkeleton />);
    
    const descriptionElements = document.querySelectorAll('.skeleton-description');
    expect(descriptionElements).toHaveLength(2);
  });

  it('applies skeleton animation class', () => {
    render(<ProductCardSkeleton />);
    
    const skeletonElements = document.querySelectorAll('.skeleton');
    expect(skeletonElements.length).toBeGreaterThan(0);
    
    skeletonElements.forEach(element => {
      expect(element).toHaveClass('skeleton');
    });
  });
});