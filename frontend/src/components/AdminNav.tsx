import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './AdminNav.css';

const AdminNav: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <nav className="admin-nav">
      <div className="admin-nav__brand">
        <Link to="/admin" className="admin-nav__brand-link">
          <span className="admin-nav__icon">⚙️</span>
          Admin Panel
        </Link>
      </div>
      
      <ul className="admin-nav__menu">
        <li className="admin-nav__item">
          <Link 
            to="/admin" 
            className={`admin-nav__link ${isActive('/admin') && location.pathname === '/admin' ? 'active' : ''}`}
          >
            <span className="admin-nav__link-icon">📊</span>
            Dashboard
          </Link>
        </li>
        
        <li className="admin-nav__item">
          <Link 
            to="/admin/products" 
            className={`admin-nav__link ${isActive('/admin/products') ? 'active' : ''}`}
          >
            <span className="admin-nav__link-icon">📦</span>
            Products
          </Link>
        </li>
        
        <li className="admin-nav__item">
          <Link 
            to="/admin/orders" 
            className={`admin-nav__link ${isActive('/admin/orders') ? 'active' : ''}`}
          >
            <span className="admin-nav__link-icon">📋</span>
            Orders
          </Link>
        </li>
      </ul>

      <div className="admin-nav__actions">
        <Link to="/" className="admin-nav__back-to-store">
          <span className="admin-nav__link-icon">🏪</span>
          Back to Store
        </Link>
      </div>
    </nav>
  );
};

export default AdminNav;