import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { AppProvider } from '../../contexts/AppContext';
import { ToastProvider } from '../../contexts/ToastContext';
import ProductCard from '../ProductCard';
import { Product } from '../../services/productService';

// Mock the cart service
vi.mock('../../services/cartService');

// Mock the product service
vi.mock('../../services/productService', () => ({
  productService: {
    getProductById: vi.fn(),
    getAllProducts: vi.fn(),
  },
}));

/**
 * Property-Based Test for Product Display Completeness
 * Feature: basic-ecommerce-website
 * **Validates: Requirements 1.3**
 * 
 * Property 1: Product Display Completeness
 * For any product in the system, when rendered in the product catalog,
 * the display should include product name, price, description, and image URL.
 */

// Generator for valid product data
const productArbitrary = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.string({ minLength: 1, maxLength: 500 }),
  price: fc.double({ min: 0.01, max: 10000, noNaN: true }),
  image_url: fc.webUrl(),
  created_at: fc.date().map(d => d.toISOString()),
  updated_at: fc.date().map(d => d.toISOString()),
});

const renderProductCard = (product: Product) => {
  return render(
    <BrowserRouter>
      <ToastProvider>
        <AppProvider>
          <ProductCard product={product} />
        </AppProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};

describe('ProductCard - Property-Based Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Property 1: Product Display Completeness - displays all required fields for any product', () => {
    fc.assert(
      fc.property(productArbitrary, (product) => {
        // Render the product card with generated product data
        const { container } = renderProductCard(product);

        // Verify product name is displayed
        const nameElement = container.querySelector('.product-name');
        expect(nameElement).toBeInTheDocument();
        expect(nameElement?.textContent).toBe(product.name);

        // Verify product description is displayed
        const descriptionElement = container.querySelector('.product-description');
        expect(descriptionElement).toBeInTheDocument();
        expect(descriptionElement?.textContent).toBe(product.description);

        // Verify product price is displayed (formatted as currency)
        const formattedPrice = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(product.price);
        const priceElement = container.querySelector('.product-price');
        expect(priceElement).toBeInTheDocument();
        expect(priceElement?.textContent).toBe(formattedPrice);

        // Verify product image is displayed with correct URL
        const imageElement = container.querySelector('.product-image') as HTMLImageElement;
        expect(imageElement).toBeInTheDocument();
        // Browser normalizes URLs by adding trailing slash, so we need to handle that
        const normalizedSrc = imageElement?.src.replace(/\/$/, '');
        const normalizedImageUrl = product.image_url.replace(/\/$/, '');
        expect(normalizedSrc).toBe(normalizedImageUrl);
        expect(imageElement?.alt).toContain(product.name);

        // Clean up after each iteration
        container.remove();
      }),
      { numRuns: 100 }
    );
  });
});
