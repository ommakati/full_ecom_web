import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { authService } from '../services/authService';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children, requireAdmin = false }) => {
  const { state, dispatch } = useApp();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      // If we already have a user and it's not an admin check, we're good
      if (state.user && (!requireAdmin || state.user.isAdmin)) {
        setIsChecking(false);
        return;
      }

      // If we don't have a user, try to get the profile from the server
      if (!state.user) {
        try {
          dispatch({ type: 'SET_LOADING', payload: true });
          const response = await authService.getProfile();
          dispatch({ type: 'SET_USER', payload: response.user });
          
          // Check admin requirement after setting user
          if (requireAdmin && !response.user.isAdmin) {
            setIsChecking(false);
            return;
          }
        } catch (error) {
          // User is not authenticated
          dispatch({ type: 'SET_USER', payload: null });
        } finally {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      }
      
      setIsChecking(false);
    };

    checkAuth();
  }, [state.user, requireAdmin, dispatch]);

  // Show loading while checking authentication
  if (isChecking || state.loading) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner">Checking authentication...</div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!state.user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect to home if admin required but user is not admin
  if (requireAdmin && !state.user.isAdmin) {
    return <Navigate to="/" replace />;
  }

  // User is authenticated and authorized
  return <>{children}</>;
};

export default AuthGuard;