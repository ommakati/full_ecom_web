import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import './Header.css';

const Header: React.FC = () => {
  const { state, logout } = useApp();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getCartItemCount = () => {
    return state.cart.items.reduce((total, item) => total + item.quantity, 0);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="header" role="banner">
      <div className="header-container">
        <Link to="/" className="logo" aria-label="E-Commerce Store - Go to homepage">
          <h1>E-Commerce Store</h1>
        </Link>
        
        <button 
          className="mobile-menu-toggle"
          onClick={toggleMobileMenu}
          aria-expanded={isMobileMenuOpen}
          aria-controls="main-navigation"
          aria-label="Toggle navigation menu"
        >
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>

        <nav 
          className={`nav ${isMobileMenuOpen ? 'nav-open' : ''}`}
          id="main-navigation"
          role="navigation"
          aria-label="Main navigation"
        >
          <Link 
            to="/" 
            className="nav-link"
            onClick={closeMobileMenu}
            aria-label="Browse products"
          >
            Products
          </Link>
          <Link 
            to="/cart" 
            className="nav-link cart-link"
            onClick={closeMobileMenu}
            aria-label={`Shopping cart with ${getCartItemCount()} items`}
          >
            <span className="cart-icon" aria-hidden="true">🛒</span>
            <span className="cart-text">Cart</span>
            {getCartItemCount() > 0 && (
              <span className="cart-badge" aria-label={`${getCartItemCount()} items in cart`}>
                {getCartItemCount()}
              </span>
            )}
          </Link>
          
          {state.isAuthenticated ? (
            <div className="auth-nav">
              <Link 
                to="/orders" 
                className="nav-link"
                onClick={closeMobileMenu}
                aria-label="View your order history"
              >
                Orders
              </Link>
              {state.user?.isAdmin && (
                <Link 
                  to="/admin" 
                  className="nav-link admin-link"
                  onClick={closeMobileMenu}
                  aria-label="Admin dashboard"
                >
                  <span className="admin-icon" aria-hidden="true">⚙️</span>
                  <span>Dashboard</span>
                </Link>
              )}
              <span className="user-email" aria-label={`Logged in as ${state.user?.email}`}>
                Welcome, {state.user?.email}
              </span>
              <button 
                onClick={() => {
                  handleLogout();
                  closeMobileMenu();
                }}
                className="nav-link logout-btn"
                disabled={state.loading}
                aria-label="Log out of your account"
              >
                {state.loading ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          ) : (
            <div className="auth-nav">
              <Link 
                to="/login" 
                className="nav-link"
                onClick={closeMobileMenu}
                aria-label="Log in to your account"
              >
                Login
              </Link>
              <Link 
                to="/register" 
                className="nav-link"
                onClick={closeMobileMenu}
                aria-label="Create a new account"
              >
                Register
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;