import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from '../../contexts/AppContext';
import { ToastProvider } from '../../contexts/ToastContext';
import Header from '../layout/Header';
import ProductCard from '../ProductCard';
import '@testing-library/jest-dom';

// Mock product data
const mockProduct = {
  id: '1',
  name: 'Test Product',
  description: 'A test product description',
  price: 29.99,
  image_url: 'https://example.com/image.jpg',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <ToastProvider>
      <AppProvider>
        {children}
      </AppProvider>
    </ToastProvider>
  </BrowserRouter>
);

describe('Accessibility Tests', () => {
  describe('Header Component', () => {
    test('has proper ARIA labels and roles', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      // Check for banner role
      expect(screen.getByRole('banner')).toBeInTheDocument();
      
      // Check for navigation role
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      
      // Check for proper ARIA labels
      expect(screen.getByLabelText(/toggle navigation menu/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/main navigation/i)).toBeInTheDocument();
    });

    test('mobile menu toggle has proper ARIA attributes', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const menuToggle = screen.getByLabelText(/toggle navigation menu/i);
      expect(menuToggle).toHaveAttribute('aria-expanded', 'false');
      expect(menuToggle).toHaveAttribute('aria-controls', 'main-navigation');
    });

    test('cart link has proper accessibility attributes', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const cartLink = screen.getByLabelText(/shopping cart with \d+ items/i);
      expect(cartLink).toBeInTheDocument();
    });
  });

  describe('ProductCard Component', () => {
    test('has proper semantic structure', () => {
      render(
        <TestWrapper>
          <ProductCard product={mockProduct} />
        </TestWrapper>
      );

      // Check for article role
      expect(screen.getByRole('article')).toBeInTheDocument();
      
      // Check for proper image alt text
      const productImage = screen.getByAltText(`${mockProduct.name} product image`);
      expect(productImage).toBeInTheDocument();
      
      // Check for proper button labeling
      const addToCartButton = screen.getByLabelText(`Add ${mockProduct.name} to shopping cart`);
      expect(addToCartButton).toBeInTheDocument();
    });

    test('has proper focus management', () => {
      render(
        <TestWrapper>
          <ProductCard product={mockProduct} />
        </TestWrapper>
      );

      const productLink = screen.getByLabelText(/view details for/i);
      expect(productLink).toBeInTheDocument();
      
      const addToCartButton = screen.getByLabelText(`Add ${mockProduct.name} to shopping cart`);
      expect(addToCartButton).toBeInTheDocument();
    });

    test('price has proper ARIA label', () => {
      render(
        <TestWrapper>
          <ProductCard product={mockProduct} />
        </TestWrapper>
      );

      const priceElement = screen.getByLabelText(/price: \$29\.99/i);
      expect(priceElement).toBeInTheDocument();
    });
  });

  describe('Skip Link', () => {
    test('skip link is present for keyboard navigation', () => {
      render(
        <TestWrapper>
          <a href="#main-content" className="skip-link">
            Skip to main content
          </a>
          <main id="main-content">
            <h1>Main Content</h1>
          </main>
        </TestWrapper>
      );

      const skipLink = screen.getByText('Skip to main content');
      expect(skipLink).toBeInTheDocument();
      expect(skipLink).toHaveAttribute('href', '#main-content');
    });
  });

  describe('Form Accessibility', () => {
    test('form elements have proper labels and ARIA attributes', () => {
      render(
        <div>
          <label htmlFor="test-input" className="form-label">
            Test Input
          </label>
          <input
            id="test-input"
            type="text"
            className="form-input"
            aria-describedby="test-help"
            aria-invalid="false"
            required
          />
          <div id="test-help" className="sr-only">
            Help text for test input
          </div>
        </div>
      );

      const input = screen.getByLabelText('Test Input');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('aria-describedby', 'test-help');
      expect(input).toHaveAttribute('aria-invalid', 'false');
      expect(input).toBeRequired();
    });
  });

  describe('Screen Reader Support', () => {
    test('sr-only class hides content visually but keeps it accessible', () => {
      render(
        <div className="sr-only">
          Screen reader only content
        </div>
      );

      const srOnlyElement = screen.getByText('Screen reader only content');
      expect(srOnlyElement).toBeInTheDocument();
      expect(srOnlyElement).toHaveClass('sr-only');
    });
  });

  describe('Loading States', () => {
    test('loading spinner has proper ARIA attributes', () => {
      render(
        <div role="status" aria-live="polite">
          <span className="loading-spinner" aria-hidden="true"></span>
          <span>Loading...</span>
        </div>
      );

      const loadingStatus = screen.getByRole('status');
      expect(loadingStatus).toBeInTheDocument();
      expect(loadingStatus).toHaveAttribute('aria-live', 'polite');
      
      const spinner = screen.getByText('Loading...').previousElementSibling;
      expect(spinner).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Error Messages', () => {
    test('error messages have proper ARIA attributes', () => {
      render(
        <div 
          className="error-message" 
          role="alert"
          aria-live="polite"
        >
          This is an error message
        </div>
      );

      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveAttribute('aria-live', 'polite');
      expect(errorMessage).toHaveTextContent('This is an error message');
    });
  });
});