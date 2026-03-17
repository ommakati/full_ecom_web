import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from '../../contexts/AppContext';
import Register from '../Register';

// Mock the auth service
const mockAuthService = {
  register: vi.fn(),
  login: vi.fn(),
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

describe('Register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock getProfile to return unauthenticated state
    mockAuthService.getProfile.mockRejectedValue(new Error('Not authenticated'));
  });

  it('renders registration form', () => {
    renderWithProviders(<Register />);

    expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument();
    expect(screen.getByText('Already have an account?')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Register />);

    const submitButton = screen.getByRole('button', { name: 'Create Account' });
    await user.click(submitButton);

    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(screen.getByText('Please confirm your password')).toBeInTheDocument();
  });

  it('validates email format', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Register />);

    const emailInput = screen.getByLabelText('Email');
    const submitButton = screen.getByRole('button', { name: 'Create Account' });

    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);

    expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
  });

  it('validates password length', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Register />);

    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Create Account' });

    await user.type(passwordInput, '123');
    await user.click(submitButton);

    expect(screen.getByText('Password must be at least 6 characters long')).toBeInTheDocument();
  });

  it('validates password confirmation', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Register />);

    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: 'Create Account' });

    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'different123');
    await user.click(submitButton);

    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      isAdmin: false,
      createdAt: '2024-01-01T00:00:00Z',
    };

    mockAuthService.register.mockResolvedValue({ user: mockUser });

    renderWithProviders(<Register />);

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: 'Create Account' });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(submitButton);

    expect(mockAuthService.register).toHaveBeenCalledWith('test@example.com', 'password123');
  });

  it('displays error message when user already exists', async () => {
    const user = userEvent.setup();
    const errorResponse = {
      response: {
        data: {
          error: {
            code: 'USER_EXISTS',
            message: 'User with this email already exists',
          },
        },
      },
    };

    mockAuthService.register.mockRejectedValue(errorResponse);

    renderWithProviders(<Register />);

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: 'Create Account' });

    await user.type(emailInput, 'existing@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('An account with this email already exists')).toBeInTheDocument();
    });
  });

  it('shows password hint', () => {
    renderWithProviders(<Register />);

    expect(screen.getByText('Password must be at least 6 characters long')).toBeInTheDocument();
  });
});