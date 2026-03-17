import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import AdminProducts from '../AdminProducts';

// Create simple mock functions
const mockGetAllProducts = vi.fn();
const mockCreateProduct = vi.fn();
const mockUpdateProduct = vi.fn();
const mockDeleteProduct = vi.fn();

// Mock the product service module
vi.mock('../../services/productService', () => ({
  productService: {
    getAllProducts: mockGetAllProducts,
    createProduct: mockCreateProduct,
    updateProduct: mockUpdateProduct,
    deleteProduct: mockDeleteProduct,
  },
}));

// Mock the components
vi.mock('../../components/LoadingSpinner', () => ({
  default: () => <div data-testid="loading-spinner">Loading...</div>,
}));

vi.mock('../../components/ErrorDisplay', () => ({
  default: ({ message, onDismiss }: { message: string; onDismiss: () => void }) => (
    <div data-testid="error-display">
      <span>{message}</span>
      <button onClick={onDismiss}>Dismiss</button>
    </div>
  ),
}));

const mockProducts = [
  {
    id: '1',
    name: 'Test Product 1',
    description: 'Test description 1',
    price: 29.99,
    image_url: 'https://example.com/image1.jpg',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Test Product 2',
    description: 'Test description 2',
    price: 49.99,
    image_url: 'https://example.com/image2.jpg',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

describe('AdminProducts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    mockGetAllProducts.mockImplementation(() => new Promise(() => {}));
    
    render(<AdminProducts />);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('renders product list after loading', async () => {
    mockGetAllProducts.mockResolvedValue(mockProducts);
    
    render(<AdminProducts />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
      expect(screen.getByText('Test Product 2')).toBeInTheDocument();
      expect(screen.getByText('$29.99')).toBeInTheDocument();
      expect(screen.getByText('$49.99')).toBeInTheDocument();
    });
  });

  it('renders empty state when no products', async () => {
    mockGetAllProducts.mockResolvedValue([]);
    
    render(<AdminProducts />);
    
    await waitFor(() => {
      expect(screen.getByText('No products found')).toBeInTheDocument();
      expect(screen.getByText('Start by adding your first product to the catalog.')).toBeInTheDocument();
    });
  });

  it('shows error message when loading fails', async () => {
    mockGetAllProducts.mockRejectedValue(new Error('Network error'));
    
    render(<AdminProducts />);
    
    await waitFor(() => {
      expect(screen.getByTestId('error-display')).toBeInTheDocument();
      expect(screen.getByText('Failed to load products. Please try again.')).toBeInTheDocument();
    });
  });

  it('opens add product form when clicking Add New Product', async () => {
    mockGetAllProducts.mockResolvedValue(mockProducts);
    
    render(<AdminProducts />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    });
    
    const addButton = screen.getByText('Add New Product');
    fireEvent.click(addButton);
    
    expect(screen.getByText('Add New Product')).toBeInTheDocument();
    expect(screen.getByLabelText('Product Name *')).toBeInTheDocument();
    expect(screen.getByLabelText('Description *')).toBeInTheDocument();
    expect(screen.getByLabelText('Price (USD) *')).toBeInTheDocument();
    expect(screen.getByLabelText('Image URL *')).toBeInTheDocument();
  });

  it('validates form fields when submitting', async () => {
    mockGetAllProducts.mockResolvedValue([]);
    
    render(<AdminProducts />);
    
    await waitFor(() => {
      expect(screen.getByText('Add New Product')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Add New Product'));
    
    const submitButton = screen.getByText('Create Product');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Product name is required')).toBeInTheDocument();
      expect(screen.getByText('Product description is required')).toBeInTheDocument();
      expect(screen.getByText('Price is required')).toBeInTheDocument();
      expect(screen.getByText('Image URL is required')).toBeInTheDocument();
    });
  });

  it('creates new product successfully', async () => {
    const user = userEvent.setup();
    mockGetAllProducts.mockResolvedValue([]);
    mockCreateProduct.mockResolvedValue(mockProducts[0]);
    
    render(<AdminProducts />);
    
    await waitFor(() => {
      expect(screen.getByText('Add New Product')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Add New Product'));
    
    // Fill out the form
    await user.type(screen.getByLabelText('Product Name *'), 'New Product');
    await user.type(screen.getByLabelText('Description *'), 'New product description');
    await user.type(screen.getByLabelText('Price (USD) *'), '19.99');
    await user.type(screen.getByLabelText('Image URL *'), 'https://example.com/new-image.jpg');
    
    // Submit the form
    fireEvent.click(screen.getByText('Create Product'));
    
    await waitFor(() => {
      expect(mockCreateProduct).toHaveBeenCalledWith({
        name: 'New Product',
        description: 'New product description',
        price: 19.99,
        image_url: 'https://example.com/new-image.jpg',
      });
    });
  });

  it('opens edit form when clicking Edit button', async () => {
    mockGetAllProducts.mockResolvedValue(mockProducts);
    
    render(<AdminProducts />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    });
    
    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);
    
    expect(screen.getByText('Edit Product')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Product 1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test description 1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('29.99')).toBeInTheDocument();
    expect(screen.getByDisplayValue('https://example.com/image1.jpg')).toBeInTheDocument();
  });

  it('shows delete confirmation and deletes product', async () => {
    mockGetAllProducts.mockResolvedValue(mockProducts);
    mockDeleteProduct.mockResolvedValue();
    
    render(<AdminProducts />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    });
    
    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);
    
    // Should show confirmation button
    expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
    
    // Click confirm
    fireEvent.click(screen.getByText('Confirm Delete'));
    
    await waitFor(() => {
      expect(mockDeleteProduct).toHaveBeenCalledWith('1');
    });
  });

  it('cancels form and resets state', async () => {
    mockGetAllProducts.mockResolvedValue(mockProducts);
    
    render(<AdminProducts />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Add New Product'));
    
    // Form should be visible
    expect(screen.getByText('Add New Product')).toBeInTheDocument();
    
    // Click cancel
    fireEvent.click(screen.getByText('Cancel'));
    
    // Form should be hidden
    expect(screen.queryByText('Product Name *')).not.toBeInTheDocument();
  });

  it('validates price input correctly', async () => {
    const user = userEvent.setup();
    mockGetAllProducts.mockResolvedValue([]);
    
    render(<AdminProducts />);
    
    await waitFor(() => {
      expect(screen.getByText('Add New Product')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Add New Product'));
    
    // Enter invalid price
    await user.type(screen.getByLabelText('Price (USD) *'), '-5');
    
    fireEvent.click(screen.getByText('Create Product'));
    
    await waitFor(() => {
      expect(screen.getByText('Price must be a positive number')).toBeInTheDocument();
    });
  });

  it('validates URL format correctly', async () => {
    const user = userEvent.setup();
    mockGetAllProducts.mockResolvedValue([]);
    
    render(<AdminProducts />);
    
    await waitFor(() => {
      expect(screen.getByText('Add New Product')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Add New Product'));
    
    // Enter invalid URL
    await user.type(screen.getByLabelText('Image URL *'), 'not-a-url');
    
    fireEvent.click(screen.getByText('Create Product'));
    
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid URL')).toBeInTheDocument();
    });
  });
});