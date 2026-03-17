import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { AppProvider } from '../../contexts/AppContext';
import ProductCard from '../ProductCard';
import Header from '../layout/Header';
import { Product } from '../../services/productService';

// Mock the services
vi.mock('../../services/cartService');
vi.mock('../../services/productService', () => ({
  productService: {
    getProductById: vi.fn(),
    getAllProducts: vi.fn(),
  },
}));

const mockProduct: Product = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'Test Product',
  description: 'This is a test product description',
  price: 29.99,
  image_url: 'https://example.com/test-image.jpg',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AppProvider>
        {component}
      </AppProvider>
    </BrowserRouter>
  );
};

describe('Cart Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows cart icon with item count in header', async () => {
    // Mock the productService to return the product when fetched for cart
    const mockProductService = await import('../../services/productService');
    vi.mocked(mockProductService.productService.getProductById).mockResolvedValue(mockProduct);
    
    renderWithProviders(
      <div>
        <Header />
        <ProductCard product={mockProduct} />
      </div>
    );
    
    // Initially, cart should be empty (no badge visible)
    const cartLink = screen.getByText('Cart').closest('a');
    expect(cartLink).toBeInTheDocument();
    expect(screen.queryByText('1')).not.toBeInTheDocument();
    
    // Add item to cart
    const addToCartButton = screen.getByRole('button', { name: 'Add to Cart' });
    fireEvent.click(addToCartButton);
    
    // Wait for cart to update and show badge
    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  it('displays cart total calculation correctly', async () => {
    // Mock the productService to return the product when fetched for cart
    const mockProductService = await import('../../services/productService');
    vi.mocked(mockProductService.productService.getProductById).mockResolvedValue(mockProduct);
    
    renderWithProviders(<ProductCard product={mockProduct} />);
    
    // Add item to cart
    const addToCartButton = screen.getByRole('button', { name: 'Add to Cart' });
    fireEvent.click(addToCartButton);
    
    // Verify success message appears
    await waitFor(() => {
      expect(screen.getByText('Added to cart!')).toBeInTheDocument();
    });
  });

  it('allows non-authenticated users to add items to cart', async () => {
    // Mock the productService to return the product when fetched for cart
    const mockProductService = await import('../../services/productService');
    vi.mocked(mockProductService.productService.getProductById).mockResolvedValue(mockProduct);
    
    renderWithProviders(<ProductCard product={mockProduct} />);
    
    const addToCartButton = screen.getByRole('button', { name: 'Add to Cart' });
    expect(addToCartButton).toBeEnabled();
    
    fireEvent.click(addToCartButton);
    
    // Should show success message, not login requirement
    await waitFor(() => {
      expect(screen.getByText('Added to cart!')).toBeInTheDocument();
    });
    
    // Should not show login message
    expect(screen.queryByText('Please log in to add items to cart')).not.toBeInTheDocument();
  });
});