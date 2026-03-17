import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import AdminDashboard from '../AdminDashboard';
import { productService } from '../../services/productService';
import { orderService } from '../../services/orderService';

// Mock the services
vi.mock('../../services/productService');
vi.mock('../../services/orderService');

const mockProductService = vi.mocked(productService);
const mockOrderService = vi.mocked(orderService);

const renderAdminDashboard = () => {
  return render(
    <BrowserRouter>
      <AdminDashboard />
    </BrowserRouter>
  );
};

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders admin dashboard with loading state initially', () => {
    // Mock services to return pending promises
    mockProductService.getProducts = vi.fn().mockImplementation(() => new Promise(() => {}));
    mockOrderService.getAllOrders = vi.fn().mockImplementation(() => new Promise(() => {}));

    renderAdminDashboard();

    // LoadingSpinner component doesn't show "Loading..." text, it shows a spinner
    expect(document.querySelector('.loading-spinner')).toBeInTheDocument();
  });

  it('renders admin dashboard with stats when data loads successfully', async () => {
    // Mock successful responses
    mockProductService.getProducts = vi.fn().mockResolvedValue({
      products: [
        { id: '1', name: 'Product 1', price: 10.99 },
        { id: '2', name: 'Product 2', price: 20.99 }
      ]
    });

    mockOrderService.getAllOrders = vi.fn().mockResolvedValue({
      orders: [
        { id: '1', total_amount: 30.99, status: 'pending', created_at: '2024-01-01' },
        { id: '2', total_amount: 45.99, status: 'completed', created_at: '2024-01-02' }
      ]
    });

    renderAdminDashboard();

    await waitFor(() => {
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Total Products')).toBeInTheDocument();
      expect(screen.getByText('Total Orders')).toBeInTheDocument();
    });

    // Check quick actions
    expect(screen.getByText('Manage Products')).toBeInTheDocument();
    expect(screen.getByText('View Orders')).toBeInTheDocument();
  });

  it('renders error state when data loading fails', async () => {
    // Mock failed responses
    mockProductService.getProducts = vi.fn().mockRejectedValue(new Error('Failed to load'));
    mockOrderService.getAllOrders = vi.fn().mockRejectedValue(new Error('Failed to load'));

    renderAdminDashboard();

    await waitFor(() => {
      expect(screen.getByText('Failed to load dashboard data')).toBeInTheDocument();
    });
  });
});