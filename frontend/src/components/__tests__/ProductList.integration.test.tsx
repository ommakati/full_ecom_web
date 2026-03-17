import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { AppProvider } from '../../contexts/AppContext';
import ProductList from '../../pages/ProductList';

// Mock the auth service
vi.mock('../../services/authService', () => ({
  authService: {
    getProfile: vi.fn().mockRejectedValue(new Error('Not authenticated')),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
}));

// Mock the product service
const mockProductService = {
  getAllProducts: vi.fn(),
  getProductById: vi.fn(),
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
  deleteProduct: vi.fn(),
};

vi.mock('../../services/productService', () => ({
  productService: mockProductService,
}));

const renderProductList = () => {
  return render(
    <BrowserRouter>
      <AppProvider>
        <ProductList />
      </AppProvider>
    </BrowserRouter>
  );
};

describe('ProductList Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows skeleton loading initially', () => {
    // Mock pending promise
    mockProductService.getAllProducts.mockImplementation(() => new Promise(() => {}));

    renderProductList();
    
    // Should show skeleton cards
    expect(document.querySelectorAll('.skeleton-product-card')).toHaveLength(6);
    expect(screen.getByText('Our Products')).toBeInTheDocument();
  });

  it('shows empty state when no products', async () => {
    mockProductService.getAllProducts.mockResolvedValue([]);

    renderProductList();
    
    await waitFor(() => {
      expect(screen.getByText('No products available')).toBeInTheDocument();
      expect(screen.getByText("We're currently updating our inventory. Check back soon for exciting new products!")).toBeInTheDocument();
      expect(screen.getByText('📦')).toBeInTheDocument();
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });
  });

  it('shows error state on network failure', async () => {
    mockProductService.getAllProducts.mockRejectedValue(new Error('Network Error'));

    renderProductList();
    
    await waitFor(() => {
      expect(screen.getByText('Unable to load products')).toBeInTheDocument();
      expect(screen.getByText('Network connection failed. Please check your internet connection and try again.')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });
  });

  it('shows products when loaded successfully', async () => {
    const mockProducts = [
      {
        id: '1',
        name: 'Test Product',
        description: 'Test Description',
        price: 29.99,
        image_url: 'test.jpg',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ];

    mockProductService.getAllProducts.mockResolvedValue(mockProducts);

    renderProductList();
    
    await waitFor(() => {
      expect(screen.getByText('Our Products')).toBeInTheDocument();
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });
  });
});