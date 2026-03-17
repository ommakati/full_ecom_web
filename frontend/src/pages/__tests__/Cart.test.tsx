import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import Cart from '../Cart';
import { AppProvider } from '../../contexts/AppContext';

// Mock the cart service
vi.mock('../../services/cartService', () => ({
  cartService: {
    getCart: vi.fn(),
    addToCart: vi.fn(),
    updateCartItem: vi.fn(),
    removeFromCart: vi.fn(),
    clearCart: vi.fn(),
  },
}));

// Mock the auth service
vi.mock('../../services/authService', () => ({
  authService: {
    getProfile: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
}));

const renderCart = () => {
  return render(
    <BrowserRouter>
      <AppProvider>
        <Cart />
      </AppProvider>
    </BrowserRouter>
  );
};

describe('Cart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders cart heading', () => {
    renderCart();
    expect(screen.getByText('Shopping Cart')).toBeInTheDocument();
  });

  it('shows empty cart message when no items', async () => {
    renderCart();
    
    await waitFor(() => {
      expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
    });
  });

  it('shows continue shopping link in empty cart', async () => {
    renderCart();
    
    await waitFor(() => {
      expect(screen.getByText('Continue Shopping')).toBeInTheDocument();
    });
  });
});