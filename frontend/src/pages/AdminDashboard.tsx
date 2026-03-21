import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productService } from '../services/productService';
import { orderService } from '../services/orderService';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorDisplay from '../components/ErrorDisplay';
import './AdminDashboard.css';

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  recentOrders: any[];
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load products and orders data
        const [productsResponse, ordersResponse] = await Promise.all([
          productService.getAllProducts(),
          orderService.getAllOrders() // We'll need to create this endpoint
        ]);

        setStats({
          totalProducts: productsResponse.length,
          totalOrders: ordersResponse.orders.length,
          recentOrders: ordersResponse.orders.slice(0, 5) // Show 5 most recent orders
        });
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorDisplay message={error} />;
  }

  if (!stats) {
    return <ErrorDisplay message="No dashboard data available" />;
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__header">
        <h1>Admin Dashboard</h1>
        <p>Manage your e-commerce store</p>
      </div>

      <div className="admin-dashboard__stats">
        <div className="stat-card">
          <div className="stat-card__icon">📦</div>
          <div className="stat-card__content">
            <h3>{stats.totalProducts}</h3>
            <p>Total Products</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card__icon">🛒</div>
          <div className="stat-card__content">
            <h3>{stats.totalOrders}</h3>
            <p>Total Orders</p>
          </div>
        </div>
      </div>

      <div className="admin-dashboard__actions">
        <h2>Quick Actions</h2>
        <div className="action-cards">
          <Link to="/admin/products" className="action-card">
            <div className="action-card__icon">🏷️</div>
            <div className="action-card__content">
              <h3>Manage Products</h3>
              <p>Add, edit, or remove products from your catalog</p>
            </div>
          </Link>

          <Link to="/admin/orders" className="action-card">
            <div className="action-card__icon">📋</div>
            <div className="action-card__content">
              <h3>View Orders</h3>
              <p>Monitor and manage customer orders</p>
            </div>
          </Link>
        </div>
      </div>

      {stats.recentOrders.length > 0 && (
        <div className="admin-dashboard__recent-orders">
          <h2>Recent Orders</h2>
          <div className="recent-orders-list">
            {stats.recentOrders.map((order) => (
              <div key={order.id} className="recent-order-item">
                <div className="recent-order-item__info">
                  <span className="order-id">Order #{order.id.slice(0, 8)}</span>
                  <span className="order-total">${parseFloat(order.total_amount).toFixed(2)}</span>
                </div>
                <div className="recent-order-item__meta">
                  <span className="order-status">{order.status}</span>
                  <span className="order-date">
                    {new Date(order.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <Link to="/admin/orders" className="view-all-orders">
            View All Orders →
          </Link>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;