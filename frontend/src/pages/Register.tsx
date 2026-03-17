import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { isValidEmail, isValidPassword, isRequired } from '../utils/validation';
import './Register.css';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useApp();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
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
    } else if (!isValidPassword(formData.password)) {
      newErrors.password = 'Password must be at least 6 characters long';
    }

    if (!isRequired(formData.confirmPassword)) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
      await register(formData.email, formData.password);
      navigate('/');
    } catch (error: any) {
      console.error('Registration error:', error);
      
      if (error.response?.data?.error) {
        const apiError = error.response.data.error;
        if (apiError.code === 'USER_EXISTS') {
          setErrors({ email: 'An account with this email already exists' });
        } else if (apiError.details) {
          const fieldErrors: { [key: string]: string } = {};
          apiError.details.forEach((detail: any) => {
            fieldErrors[detail.field] = detail.message;
          });
          setErrors(fieldErrors);
        } else {
          setErrors({ general: apiError.message || 'Registration failed' });
        }
      } else {
        setErrors({ general: 'Network error. Please try again.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="register">
      <h2>Create Account</h2>
      <form className="register-form" onSubmit={handleSubmit}>
        {errors.general && (
          <div className="error-message general-error">
            {errors.general}
          </div>
        )}
        
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={errors.email ? 'error' : ''}
            disabled={isSubmitting}
            autoComplete="email"
          />
          {errors.email && (
            <div className="error-message">{errors.email}</div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={errors.password ? 'error' : ''}
            disabled={isSubmitting}
            autoComplete="new-password"
          />
          {errors.password && (
            <div className="error-message">{errors.password}</div>
          )}
          <div className="password-hint">
            Password must be at least 6 characters long
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className={errors.confirmPassword ? 'error' : ''}
            disabled={isSubmitting}
            autoComplete="new-password"
          />
          {errors.confirmPassword && (
            <div className="error-message">{errors.confirmPassword}</div>
          )}
        </div>

        <button 
          type="submit" 
          className="submit-button"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating Account...' : 'Create Account'}
        </button>

        <div className="form-footer">
          <p>
            Already have an account? <Link to="/login">Login here</Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default Register;