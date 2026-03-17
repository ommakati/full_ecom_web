import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import Checkout from '../Checkout';
import { AppProvider } from '../../contexts/AppContext';

// Mock the order service
vi.mock('../../services/orderService', () => ({
  orderService: {
    createOrder: vi.fn(),
  },
}));

// Mock the useNavigate hook
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
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
    cart: {
      items: [
        {
          id: '1',
          product_id: 'product-1',
          quantity: 2,
          product: {
            id: 'product-1',
            name: 'Test Product',
            price: 29.99,
            image_url: 'https://example.com/image.jpg',
          },
        },
      ],
      total: 59.98,
    },
    cartLoading: false,
  },
  clearCart: vi.fn(),
};

const renderCheckout = () => {
  return render(
    <BrowserRouter>
      <AppProvider>
        <Checkout />
      </AppProvider>
    </BrowserRouter>
  );
};

describe('Checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders checkout page with order summary', async () => {
    renderCheckout();

    await waitFor(() => {
      expect(screen.getByText('Checkout')).toBeInTheDocument();
      expect(screen.getByText('Order Summary')).toBeInTheDocument();
      expect(screen.getByText('Test Product')).toBeInTheDocument();
      expect(screen.getByText('Quantity: 2')).toBeInTheDocument();
      expect(screen.getByText('$59.98')).toBeInTheDocument();
    });
  });

  it('shows place order button', async () => {
    renderCheckout();

    await waitFor(() => {
      expect(screen.getByText('Place Order')).toBeInTheDocument();
    });
  });

  it('shows payment simulation note', async () => {
    renderCheckout();

    await waitFor(() => {
      expect(screen.getByText(/This is a demo application/)).toBeInTheDocument();
      expect(screen.getByText(/No actual payment will be processed/)).toBeInTheDocument();
    });
  });
});