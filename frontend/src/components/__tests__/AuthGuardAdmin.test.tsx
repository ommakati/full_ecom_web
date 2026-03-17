import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import AuthGuard from '../AuthGuard';
import { useApp } from '../../contexts/AppContext';
import { authService } from '../../services/authService';

// Mock the context and auth service
vi.mock('../../contexts/AppContext');
vi.mock('../../services/authService');

const mockUseApp = vi.mocked(useApp);
const mockAuthService = vi.mocked(authService);

const TestComponent = () => <div>Admin Content</div>;

const renderAuthGuardWithAdmin = (requireAdmin = true) => {
  return render(
    <BrowserRouter>
      <AuthGuard requireAdmin={requireAdmin}>
        <TestComponent />
      </AuthGuard>
    </BrowserRouter>
  );
};

describe('AuthGuard with Admin Requirements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows access for admin users', async () => {
    mockUseApp.mockReturnValue({
      state: {
        user: { id: '1', email: 'admin@test.com', isAdmin: true },
        loading: false,
        isAuthenticated: true,
        error: null,
        isInitialized: true,
        cart: { items: [], total: 0 },
        cartLoading: false
      },
      dispatch: vi.fn(),
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      checkAuth: vi.fn(),
      loadCart: vi.fn(),
      addToCart: vi.fn(),
      updateCartItem: vi.fn(),
      removeFromCart: vi.fn(),
      clearCart: vi.fn()
    });

    renderAuthGuardWithAdmin(true);

    await waitFor(() => {
      expect(screen.getByText('Admin Content')).toBeInTheDocument();
    });
  });

  it('redirects non-admin users to home page', async () => {
    mockUseApp.mockReturnValue({
      state: {
        user: { id: '1', email: 'user@test.com', isAdmin: false },
        loading: false,
        isAuthenticated: true,
        error: null,
        isInitialized: true,
        cart: { items: [], total: 0 },
        cartLoading: false
      },
      dispatch: vi.fn(),
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      checkAuth: vi.fn(),
      loadCart: vi.fn(),
      addToCart: vi.fn(),
      updateCartItem: vi.fn(),
      removeFromCart: vi.fn(),
      clearCart: vi.fn()
    });

    renderAuthGuardWithAdmin(true);

    // Should not show admin content for non-admin users
    await waitFor(() => {
      expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
    });
  });

  it('redirects unauthenticated users to login', async () => {
    mockUseApp.mockReturnValue({
      state: {
        user: null,
        loading: false,
        isAuthenticated: false,
        error: null,
        isInitialized: true,
        cart: { items: [], total: 0 },
        cartLoading: false
      },
      dispatch: vi.fn(),
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      checkAuth: vi.fn(),
      loadCart: vi.fn(),
      addToCart: vi.fn(),
      updateCartItem: vi.fn(),
      removeFromCart: vi.fn(),
      clearCart: vi.fn()
    });

    renderAuthGuardWithAdmin(true);

    // Should not show admin content for unauthenticated users
    await waitFor(() => {
      expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
    });
  });
});