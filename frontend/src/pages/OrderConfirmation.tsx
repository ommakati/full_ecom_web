import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { orderService, Order } from '../services/orderService';
import LoadingSpinner from '../components/LoadingSpinner';
import './OrderConfirmation.css';

const OrderConfirmation: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { state } = useApp();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (state.isInitialized && !state.isAuthenticated) {
      navigate('/login');
    }
  }, [state.isAuthenticated, state.isInitialized, navigate]);

  // Fetch order details
  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId || !state.isAuthenticated) {
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const orderData = await orderService.getOrderById(orderId);
        setOrder(orderData);
      } catch (error) {
        console.error('Error fetching order:', error);
        setError('Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    if (state.isInitialized) {
      fetchOrder();
    }
  }, [orderId, state.isAuthenticated, state.isInitialized]);

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

  // Show loading while checking authentication or fetching order
  if (!state.isInitialized || loading) {
    return (
      <div className="order-confirmation">
        <div className="order-confirmation-loading">
          <LoadingSpinner />
          <p>Loading order details...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (redirect will handle this)
  if (!state.isAuthenticated) {
    return null;
  }

  // Show error state
  if (error) {
    return (
      <div className="order-confirmation">
        <div className="order-confirmation-error">
          <h2>Order Not Found</h2>
          <p>{error}</p>
          <div className="error-actions">
            <Link to="/" className="continue-shopping-btn">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Show order not found if no order data
  if (!order) {
    return (
      <div className="order-confirmation">
        <div className="order-confirmation-error">
          <h2>Order Not Found</h2>
          <p>The requested order could not be found.</p>
          <div className="error-actions">
            <Link to="/" className="continue-shopping-btn">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="order-confirmation">
      <div className="order-confirmation-container">
        <div className="order-success-header">
          <div className="success-icon">✓</div>
          <h2>Order Confirmed!</h2>
          <p className="success-message">
            Thank you for your order. Your order has been successfully placed and is being processed.
          </p>
        </div>

        <div className="order-details">
          <div className="order-info">
            <h3>Order Information</h3>
            <div className="order-meta">
              <div className="order-meta-item">
                <span className="label">Order ID:</span>
                <span className="value">{order.id}</span>
              </div>
              <div className="order-meta-item">
                <span className="label">Order Date:</span>
                <span className="value">{formatDate(order.created_at)}</span>
              </div>
              <div className="order-meta-item">
                <span className="label">Status:</span>
                <span className="value status">{order.status}</span>
              </div>
            </div>
          </div>

          <div className="order-summary">
            <h3>Order Summary</h3>
            
            <div className="order-items">
              {order.items.map((item) => (
                <div key={item.product_id} className="order-item">
                  <div className="order-item-image">
                    <img 
                      src={item.product_image_url} 
                      alt={item.product_name}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder-product.jpg';
                      }}
                    />
                  </div>
                  
                  <div className="order-item-details">
                    <h4>{item.product_name}</h4>
                    <p className="order-item-price">{formatPrice(item.price)}</p>
                    <p className="order-item-quantity">Quantity: {item.quantity}</p>
                  </div>
                  
                  <div className="order-item-total">
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            <div className="order-totals">
              <div className="order-total-row">
                <span>Items ({getTotalItems()}):</span>
                <span>{formatPrice(order.total_amount)}</span>
              </div>
              <div className="order-total-row order-final-total">
                <span>Total:</span>
                <span>{formatPrice(order.total_amount)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="order-actions">
          <Link to="/" className="continue-shopping-btn">
            Continue Shopping
          </Link>
        </div>

        <div className="order-note">
          <p>
            <strong>Note:</strong> This is a demo application. No actual payment was processed and no products will be shipped.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;