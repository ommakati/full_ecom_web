import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from '../../contexts/AppContext';
import AuthGuard from '../AuthGuard';

// Mock the auth service
const mockAuthService = {
  getProfile: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
};

vi.mock('../../services/authService', () => ({
  authService: mockAuthService,
}));

const TestComponent = () => <div>Protected Content</div>;

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AppProvider>
        {component}
      </AppProvider>
    </BrowserRouter>
  );
};

describe('AuthGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    mockAuthService.getProfile.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    renderWithProviders(
      <AuthGuard>
        <TestComponent />
      </AuthGuard>
    );

    expect(screen.getByText('Checking authentication...')).toBeInTheDocument();
  });

  it('renders children when user is authenticated', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      isAdmin: false,
      createdAt: '2024-01-01T00:00:00Z',
    };

    mockAuthService.getProfile.mockResolvedValue({ user: mockUser });

    renderWithProviders(
      <AuthGuard>
        <TestComponent />
      </AuthGuard>
    );

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  it('redirects to login when user is not authenticated', async () => {
    mockAuthService.getProfile.mockRejectedValue(new Error('Not authenticated'));

    renderWithProviders(
      <AuthGuard>
        <TestComponent />
      </AuthGuard>
    );

    await waitFor(() => {
      // Should redirect to login, so protected content should not be visible
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  it('redirects to home when admin required but user is not admin', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      isAdmin: false,
      createdAt: '2024-01-01T00:00:00Z',
    };

    mockAuthService.getProfile.mockResolvedValue({ user: mockUser });

    renderWithProviders(
      <AuthGuard requireAdmin={true}>
        <TestComponent />
      </AuthGuard>
    );

    await waitFor(() => {
      // Should redirect to home, so protected content should not be visible
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  it('renders children when user is admin and admin required', async () => {
    const mockUser = {
      id: '1',
      email: 'admin@example.com',
      isAdmin: true,
      createdAt: '2024-01-01T00:00:00Z',
    };

    mockAuthService.getProfile.mockResolvedValue({ user: mockUser });

    renderWithProviders(
      <AuthGuard requireAdmin={true}>
        <TestComponent />
      </AuthGuard>
    );

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });
});