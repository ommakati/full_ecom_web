import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import OrderConfirmation from '../OrderConfirmation';
import { AppProvider } from '../../contexts/AppContext';

// Mock the order service
const mockOrder = {
  id: 'order-123',
  user_id: 'user-1',
  total_amount: 59.98,
  status: 'pending',
  created_at: '2024-01-15T10:30:00Z',
  items: [
    {
      product_id: 'product-1',
      quantity: 2,
      price: 29.99,
      product: {
        name: 'Test Product',
        image_url: 'https://example.com/image.jpg',
      },
    },
  ],
};

vi.mock('../../services/orderService', () => ({
  orderService: {
    getOrderById: vi.fn().mockResolvedValue(mockOrder),
  },
}));

// Mock the useParams hook
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ orderId: 'order-123' }),
    useNavigate: () => vi.fn(),
  };
});

// Mock the AppContext
const mockAppContext = {
  state: {
    user: { id: '1', email: 'test@example.com' },
    isAuthenticated: true,
    loading: false,
    error: null,
    isInitialized: true,
    cart: { items: [], total: 0 },
    cartLoading: false,
  },
};

const renderOrderConfirmation = () => {
  return render(
    <BrowserRouter>
      <AppProvider>
        <OrderConfirmation />
      </AppProvider>
    </BrowserRouter>
  );
};

describe('OrderConfirmation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders order confirmation with success message', async () => {
    renderOrderConfirmation();

    await waitFor(() => {
      expect(screen.getByText('Order Confirmed!')).toBeInTheDocument();
      expect(screen.getByText(/Thank you for your order/)).toBeInTheDocument();
    });
  });

  it('displays order details', async () => {
    renderOrderConfirmation();

    await waitFor(() => {
      expect(screen.getByText('Order Information')).toBeInTheDocument();
      expect(screen.getByText('order-123')).toBeInTheDocument();
      expect(screen.getByText('pending')).toBeInTheDocument();
    });
  });

  it('shows order summary with items', async () => {
    renderOrderConfirmation();

    await waitFor(() => {
      expect(screen.getByText('Order Summary')).toBeInTheDocument();
      expect(screen.getByText('Test Product')).toBeInTheDocument();
      expect(screen.getByText('Quantity: 2')).toBeInTheDocument();
      expect(screen.getByText('$59.98')).toBeInTheDocument();
    });
  });

  it('shows demo application note', async () => {
    renderOrderConfirmation();

    await waitFor(() => {
      expect(screen.getByText(/This is a demo application/)).toBeInTheDocument();
      expect(screen.getByText(/no products will be shipped/)).toBeInTheDocument();
    });
  });
});