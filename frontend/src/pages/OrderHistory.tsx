import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { orderService, Order } from '../services/orderService';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import './OrderHistory.css';

const OrderHistory: React.FC = () => {
  const { state } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!state.isAuthenticated) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await orderService.getOrders();
        setOrders(response.orders || []);
      } catch (error) {
        console.error('Error fetching orders:', error);
        setError('Failed to load order history. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [state.isAuthenticated]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getOrderItemCount = (order: Order) => {
    return order.items.reduce((total, item) => total + item.quantity, 0);
  };

  if (!state.isAuthenticated) {
    return (
      <div className="order-history">
        <div className="order-history-container">
          <EmptyState
            title="Please log in to view your orders"
            message="You need to be logged in to see your order history."
            actionText="Go to Login"
            actionLink="/login"
          />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="order-history">
        <div className="order-history-container">
          <div className="order-history-loading">
            <LoadingSpinner />
            <p>Loading your orders...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="order-history">
        <div className="order-history-container">
          <div className="order-history-error">
            <h2>Error Loading Orders</h2>
            <p>{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="retry-btn"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="order-history">
        <div className="order-history-container">
          <EmptyState
            title="No orders yet"
            message="You haven't placed any orders yet. Start shopping to see your order history here."
            actionText="Browse Products"
            actionLink="/"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="order-history">
      <div className="order-history-container">
        <div className="order-history-header">
          <h2>Order History</h2>
          <p>View all your past orders and their details</p>
        </div>

        <div className="orders-list">
          {orders.map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <div className="order-info">
                  <h3>Order #{order.id.slice(-8)}</h3>
                  <p className="order-date">{formatDate(order.created_at)}</p>
                </div>
                <div className="order-status">
                  <span className={`status-badge status-${order.status}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
              </div>

              <div className="order-summary">
                <div className="order-items-preview">
                  {order.items.slice(0, 3).map((item) => (
                    <div key={item.product_id} className="order-item-preview">
                      <img 
                        src={item.product_image_url} 
                        alt={item.product_name}
                        className="item-preview-image"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder-product.jpg';
                        }}
                      />
                      <div className="item-preview-details">
                        <span className="item-name">{item.product_name}</span>
                        <span className="item-quantity">Qty: {item.quantity}</span>
                      </div>
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <div className="more-items">
                      +{order.items.length - 3} more items
                    </div>
                  )}
                </div>

                <div className="order-totals">
                  <div className="order-total-items">
                    {getOrderItemCount(order)} items
                  </div>
                  <div className="order-total-amount">
                    {formatPrice(order.total_amount)}
                  </div>
                </div>
              </div>

              <div className="order-actions">
                <Link 
                  to={`/orders/${order.id}`} 
                  className="view-details-btn"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderHistory;