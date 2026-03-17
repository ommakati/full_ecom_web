import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from '../../contexts/AppContext';
import Login from '../Login';

// Mock the auth service
const mockAuthService = {
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  getProfile: vi.fn(),
};

vi.mock('../../services/authService', () => ({
  authService: mockAuthService,
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AppProvider>
        {component}
      </AppProvider>
    </BrowserRouter>
  );
};

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock getProfile to return unauthenticated state
    mockAuthService.getProfile.mockRejectedValue(new Error('Not authenticated'));
  });

  it('renders login form', () => {
    renderWithProviders(<Login />);

    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
    expect(screen.getByText("Don't have an account?")).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Login />);

    const submitButton = screen.getByRole('button', { name: 'Login' });
    await user.click(submitButton);

    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
  });

  it('validates email format', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Login />);

    const emailInput = screen.getByLabelText('Email');
    const submitButton = screen.getByRole('button', { name: 'Login' });

    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);

    expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
  });

  it('clears errors when user starts typing', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Login />);

    const emailInput = screen.getByLabelText('Email');
    const submitButton = screen.getByRole('button', { name: 'Login' });

    // Trigger validation error
    await user.click(submitButton);
    expect(screen.getByText('Email is required')).toBeInTheDocument();

    // Start typing to clear error
    await user.type(emailInput, 'test@example.com');
    expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      isAdmin: false,
      createdAt: '2024-01-01T00:00:00Z',
    };

    mockAuthService.login.mockResolvedValue({ user: mockUser });

    renderWithProviders(<Login />);

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Login' });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    expect(mockAuthService.login).toHaveBeenCalledWith('test@example.com', 'password123');
  });

  it('displays error message on login failure', async () => {
    const user = userEvent.setup();
    const errorResponse = {
      response: {
        data: {
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
          },
        },
      },
    };

    mockAuthService.login.mockRejectedValue(errorResponse);

    renderWithProviders(<Login />);

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Login' });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });
  });

  it('disables form during submission', async () => {
    const user = userEvent.setup();
    mockAuthService.login.mockImplementation(() => new Promise(() => {})); // Never resolves

    renderWithProviders(<Login />);

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Login' });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    expect(screen.getByRole('button', { name: 'Logging in...' })).toBeDisabled();
    expect(emailInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();
  });
});