import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { AppProvider } from '../../contexts/AppContext';
import ProductList from '../ProductList';
import { productService } from '../../services/productService';

// Mock the auth service to avoid network calls
vi.mock('../../services/authService', () => ({
  authService: {
    getProfile: vi.fn().mockRejectedValue(new Error('Not authenticated')),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
}));

// Mock the product service
vi.mock('../../services/productService', () => ({
  productService: {
    getAllProducts: vi.fn(),
    getProductById: vi.fn(),
    createProduct: vi.fn(),
    updateProduct: vi.fn(),
    deleteProduct: vi.fn(),
  },
}));

const mockProducts = [
  {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test Product 1',
    description: 'This is test product 1',
    price: 29.99,
    image_url: 'https://example.com/test-image-1.jpg',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174001',
    name: 'Test Product 2',
    description: 'This is test product 2',
    price: 49.99,
    image_url: 'https://example.com/test-image-2.jpg',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

const renderProductList = () => {
  return render(
    <BrowserRouter>
      <AppProvider>
        <ProductList />
      </AppProvider>
    </BrowserRouter>
  );
};

describe('ProductList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the product list heading', async () => {
    const mockGetAllProducts = vi.mocked(productService.getAllProducts);
    mockGetAllProducts.mockResolvedValue(mockProducts);

    renderProductList();
    
    await waitFor(() => {
      expect(screen.getByText('Our Products')).toBeInTheDocument();
    });
  });

  it('shows skeleton loading state initially', () => {
    const mockGetAllProducts = vi.mocked(productService.getAllProducts);
    mockGetAllProducts.mockImplementation(() => new Promise(() => {}));

    renderProductList();
    
    expect(screen.getByText('Our Products')).toBeInTheDocument();
    // Check for skeleton loading cards
    expect(document.querySelectorAll('.skeleton-product-card')).toHaveLength(6);
  });

  it('displays products when loaded successfully', async () => {
    const mockGetAllProducts = vi.mocked(productService.getAllProducts);
    mockGetAllProducts.mockResolvedValue(mockProducts);

    renderProductList();
    
    await waitFor(() => {
      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
      expect(screen.getByText('Test Product 2')).toBeInTheDocument();
    });
  });

  it('shows empty state when no products are available', async () => {
    const mockGetAllProducts = vi.mocked(productService.getAllProducts);
    mockGetAllProducts.mockResolvedValue([]);

    renderProductList();
    
    await waitFor(() => {
      expect(screen.getByText('No products available')).toBeInTheDocument();
      expect(screen.getByText("We're currently updating our inventory. Check back soon for exciting new products!")).toBeInTheDocument();
      expect(screen.getByText('📦')).toBeInTheDocument();
    });
  });

  it('shows error state when fetch fails', async () => {
    const mockGetAllProducts = vi.mocked(productService.getAllProducts);
    mockGetAllProducts.mockRejectedValue(new Error('Network Error'));

    renderProductList();
    
    await waitFor(() => {
      expect(screen.getByText('Unable to load products')).toBeInTheDocument();
      expect(screen.getByText('Network connection failed. Please check your internet connection and try again.')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });
  });

  it('allows retry when fetch fails', async () => {
    const mockGetAllProducts = vi.mocked(productService.getAllProducts);
    mockGetAllProducts
      .mockRejectedValueOnce(new Error('Network Error'))
      .mockResolvedValueOnce(mockProducts);

    renderProductList();
    
    await waitFor(() => {
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Try Again'));

    await waitFor(() => {
      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    });
  });

  it('shows advanced error options after multiple retries', async () => {
    const mockGetAllProducts = vi.mocked(productService.getAllProducts);
    mockGetAllProducts.mockRejectedValue(new Error('Server Error'));

    renderProductList();
    
    // First failure
    await waitFor(() => {
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    // Retry and fail again
    fireEvent.click(screen.getByText('Try Again'));
    
    await waitFor(() => {
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    // Retry and fail a third time
    fireEvent.click(screen.getByText('Try Again'));
    
    await waitFor(() => {
      expect(screen.getByText('Still having trouble?')).toBeInTheDocument();
      expect(screen.getByText('Refresh Page')).toBeInTheDocument();
      expect(screen.getByText('Go to Home')).toBeInTheDocument();
    });
  });

  it('handles different error types with appropriate messages', async () => {
    const mockGetAllProducts = vi.mocked(productService.getAllProducts);
    
    // Test 404 error
    mockGetAllProducts.mockRejectedValue(new Error('404'));
    renderProductList();
    
    await waitFor(() => {
      expect(screen.getByText('Products service is currently unavailable. Please try again later.')).toBeInTheDocument();
    });
  });

  it('shows refresh indicator when retrying', async () => {
    const mockGetAllProducts = vi.mocked(productService.getAllProducts);
    mockGetAllProducts
      .mockRejectedValueOnce(new Error('Network Error'))
      .mockImplementation(() => new Promise(() => {})); // Keep pending

    renderProductList();
    
    await waitFor(() => {
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Try Again'));

    await waitFor(() => {
      expect(screen.getByText('Retrying...')).toBeInTheDocument();
    });
  });
});