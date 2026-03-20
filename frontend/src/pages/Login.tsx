import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { isValidEmail, isRequired } from '../utils/validation';
import './Login.css';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useApp();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectPath = searchParams.get('redirect') || '/';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!isRequired(formData.email)) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!isRequired(formData.password)) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await login(formData.email, formData.password);
      navigate(redirectPath);
    } catch (error: any) {
      console.error('Login error:', error);
      
      if (error.response?.data?.error) {
        const apiError = error.response.data.error;
        if (apiError.code === 'INVALID_CREDENTIALS') {
          setErrors({ general: 'Invalid email or password' });
        } else if (apiError.details) {
          const fieldErrors: { [key: string]: string } = {};
          apiError.details.forEach((detail: any) => {
            fieldErrors[detail.field] = detail.message;
          });
          setErrors(fieldErrors);
        } else {
          setErrors({ general: apiError.message || 'Login failed' });
        }
      } else {
        setErrors({ general: 'Network error. Please try again.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login" role="main">
      <div className="login-container">
        <div className="login-left">
          <div className="user-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
        </div>
        
        <div className="login-right">
          <div className="login-form-wrapper">
            <h2>Hello,<br/>Welcome back</h2>
            <p className="subtitle">Sign in to continue</p>
            
            <form 
              className="login-form" 
              onSubmit={handleSubmit}
              aria-labelledby="login-title"
              noValidate
            >
              {errors.general && (
                <div 
                  className="error-message general-error" 
                  role="alert" 
                  aria-live="polite"
                >
                  {errors.general}
                </div>
              )}
              
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Username or email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className={`form-input ${errors.email ? 'error' : ''}`}
                  disabled={isSubmitting}
                  autoComplete="email"
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  aria-invalid={!!errors.email}
                  required
                />
                {errors.email && (
                  <div 
                    id="email-error" 
                    className="error-message" 
                    role="alert"
                    aria-live="polite"
                  >
                    {errors.email}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className={`form-input ${errors.password ? 'error' : ''}`}
                  disabled={isSubmitting}
                  autoComplete="current-password"
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  aria-invalid={!!errors.password}
                  required
                />
                {errors.password && (
                  <div 
                    id="password-error" 
                    className="error-message" 
                    role="alert"
                    aria-live="polite"
                  >
                    {errors.password}
                  </div>
                )}
              </div>
              <button 
                type="submit" 
                className="submit-button"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Logging in...' : 'Login'}
              </button>

              <div className="form-footer">
                <p>
                  Don't have an account? <Link to="/register">Click here</Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;