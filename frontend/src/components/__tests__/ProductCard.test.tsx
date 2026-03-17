import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { AppProvider } from '../../contexts/AppContext';
import ProductCard from '../ProductCard';
import { Product } from '../../services/productService';
import * as cartService from '../../services/cartService';

// Mock the cart service
vi.mock('../../services/cartService');
const mockCartService = vi.mocked(cartService);

// Mock the product service
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

const renderProductCard = (product: Product = mockProduct) => {
  return render(
    <BrowserRouter>
      <AppProvider>
        <ProductCard product={product} />
      </AppProvider>
    </BrowserRouter>
  );
};

describe('ProductCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders product information correctly', () => {
    renderProductCard();
    
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('This is a test product description')).toBeInTheDocument();
    expect(screen.getByText('$29.99')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Test Product' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add to Cart' })).toBeInTheDocument();
  });

  it('creates correct link to product detail page', () => {
    renderProductCard();
    
    const productLink = screen.getByRole('link');
    expect(productLink).toHaveAttribute('href', '/products/123e4567-e89b-12d3-a456-426614174000');
  });

  it('formats price correctly', () => {
    const productWithDifferentPrice = { ...mockProduct, price: 1234.56 };
    renderProductCard(productWithDifferentPrice);
    
    expect(screen.getByText('$1,234.56')).toBeInTheDocument();
  });

  it('handles image error by setting placeholder', () => {
    renderProductCard();
    
    const image = screen.getByRole('img', { name: 'Test Product' });
    fireEvent.error(image);
    
    expect(image).toHaveAttribute('src', '/placeholder-product.jpg');
  });

  it('allows adding items to cart for non-authenticated users', async () => {
    // Mock the productService to return the product when fetched for cart
    const mockProductService = await import('../../services/productService');
    vi.mocked(mockProductService.productService.getProductById).mockResolvedValue(mockProduct);
    
    renderProductCard();
    
    const addToCartButton = screen.getByRole('button', { name: 'Add to Cart' });
    fireEvent.click(addToCartButton);
    
    await waitFor(() => {
      expect(screen.getByText('Added to cart!')).toBeInTheDocument();
    });
  });
});