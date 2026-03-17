import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { orderService, Order } from '../services/orderService';
import LoadingSpinner from '../components/LoadingSpinner';
import './OrderDetail.css';

const OrderDetail: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { state } = useApp();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!state.isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!orderId) {
      navigate('/orders');
      return;
    }

    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError(null);
        const orderData = await orderService.getOrderById(orderId);
        setOrder(orderData);
      } catch (error) {
        console.error('Error fetching order:', error);
        setError('Failed to load order details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, state.isAuthenticated, navigate]);

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

  const getTotalItems = () => {
    if (!order) return 0;
    return order.items.reduce((total, item) => total + item.quantity, 0);
  };

  if (!state.isAuthenticated) {
    return null; // Will redirect to login
  }

  if (loading) {
    return (
      <div className="order-detail">
        <div className="order-detail-container">
          <div className="order-detail-loading">
            <LoadingSpinner />
            <p>Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="order-detail">
        <div className="order-detail-container">
          <div className="order-detail-error">
            <h2>Error Loading Order</h2>
            <p>{error || 'Order not found'}</p>
            <div className="error-actions">
              <Link to="/orders" className="back-to-orders-btn">
                Back to Orders
              </Link>
              <button 
                onClick={() => window.location.reload()} 
                className="retry-btn"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="order-detail">
      <div className="order-detail-container">
        <div className="order-detail-header">
          <div className="header-navigation">
            <Link to="/orders" className="back-link">
              ← Back to Orders
            </Link>
          </div>
          
          <div className="order-title">
            <h2>Order #{order.id.slice(-8)}</h2>
            <div className="order-meta">
              <span className="order-date">{formatDate(order.created_at)}</span>
              <span className={`status-badge status-${order.status}`}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>
          </div>
        </div>

        <div className="order-detail-content">
          <div className="order-items-section">
            <h3>Order Items ({getTotalItems()} items)</h3>
            
            <div className="order-items-list">
              {order.items.map((item) => (
                <div key={item.product_id} className="order-item">
                  <div className="item-image">
                    <img 
                      src={item.product_image_url} 
                      alt={item.product_name}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder-product.jpg';
                      }}
                    />
                  </div>
                  
                  <div className="item-details">
                    <h4>{item.product_name}</h4>
                    {item.product_description && (
                      <p className="item-description">{item.product_description}</p>
                    )}
                    <div className="item-price-info">
                      <span className="item-price">{formatPrice(item.price)} each</span>
                      <span className="item-quantity">Quantity: {item.quantity}</span>
                    </div>
                  </div>
                  
                  <div className="item-total">
                    {formatPrice(item.item_total)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="order-summary-section">
            <h3>Order Summary</h3>
            
            <div className="summary-details">
              <div className="summary-row">
                <span>Items ({getTotalItems()}):</span>
                <span>{formatPrice(order.total_amount)}</span>
              </div>
              <div className="summary-row">
                <span>Shipping:</span>
                <span>Free</span>
              </div>
              <div className="summary-row">
                <span>Tax:</span>
                <span>Included</span>
              </div>
              <div className="summary-row summary-total">
                <span>Total:</span>
                <span>{formatPrice(order.total_amount)}</span>
              </div>
            </div>

            <div className="payment-info">
              <h4>Payment Information</h4>
              <p className="payment-note">
                <strong>Note:</strong> This is a demo application. No actual payment was processed for this order.
              </p>
            </div>
          </div>
        </div>

        <div className="order-actions">
          <Link to="/orders" className="back-to-orders-btn">
            Back to All Orders
          </Link>
          <Link to="/" className="continue-shopping-btn">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;