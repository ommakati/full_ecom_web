import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useToast } from '../contexts/ToastContext';
import { orderService } from '../services/orderService';
import { handleError } from '../utils/errorHandler';
import LoadingSpinner from '../components/LoadingSpinner';
import LoadingWrapper from '../components/LoadingWrapper';
import './Checkout.css';

const Checkout: React.FC = () => {
  const { state, clearCart } = useApp();
  const toast = useToast();
  const navigate = useNavigate();
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (state.isInitialized && !state.isAuthenticated) {
      navigate('/login?redirect=/checkout');
    }
  }, [state.isAuthenticated, state.isInitialized, navigate]);

  // Redirect to cart if cart is empty
  useEffect(() => {
    if (state.isInitialized && state.cart.items.length === 0) {
      navigate('/cart');
    }
  }, [state.cart.items.length, state.isInitialized, navigate]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const getTotalItems = () => {
    return state.cart.items.reduce((total, item) => total + item.quantity, 0);
  };

  const handlePlaceOrder = async () => {
    if (!state.isAuthenticated) {
      toast.showWarning('Please log in to place an order', 'Authentication Required');
      navigate('/login?redirect=/checkout');
      return;
    }

    if (state.cart.items.length === 0) {
      toast.showError('Your cart is empty', 'Cannot Place Order');
      navigate('/cart');
      return;
    }

    setIsPlacingOrder(true);
    setError(null);

    try {
      const order = await orderService.createOrder();
      
      // Clear the cart after successful order
      await clearCart();
      
      // Show success toast
      toast.showSuccess(
        `Order #${order.id.slice(0, 8)} placed successfully!`,
        'Order Confirmed',
        { duration: 6000 }
      );
      
      // Navigate to order confirmation page
      navigate(`/order-confirmation/${order.id}`);
    } catch (error) {
      console.error('Error placing order:', error);
      
      const { message } = handleError(error, {
        logError: true,
        fallbackMessage: 'Failed to place order. Please try again.'
      });
      
      setError(message);
      toast.showError(message, 'Order Failed');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Show loading while checking authentication
  if (!state.isInitialized || state.loading) {
    return (
      <LoadingWrapper
        loading={true}
        loadingMessage="Loading checkout..."
        fullScreen={false}
      >
        <div />
      </LoadingWrapper>
    );
  }

  // Don't render if not authenticated or cart is empty (redirects will handle this)
  if (!state.isAuthenticated || state.cart.items.length === 0) {
    return null;
  }

  return (
    <div className="checkout">
      <div className="checkout-container">
        <h2>Checkout</h2>
        
        {error && (
          <div className="checkout-error">
            {error}
          </div>
        )}

        <div className="checkout-content">
          <div className="order-summary">
            <h3>Order Summary</h3>
            
            <div className="order-items">
              {state.cart.items.map((item) => (
                <div key={item.id} className="order-item">
                  <div className="order-item-image">
                    <img 
                      src={item.product.image_url} 
                      alt={item.product.name}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder-product.jpg';
                      }}
                    />
                  </div>
                  
                  <div className="order-item-details">
                    <h4>{item.product.name}</h4>
                    <p className="order-item-price">{formatPrice(item.product.price)}</p>
                    <p className="order-item-quantity">Quantity: {item.quantity}</p>
                  </div>
                  
                  <div className="order-item-total">
                    {formatPrice(item.product.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            <div className="order-totals">
              <div className="order-total-row">
                <span>Items ({getTotalItems()}):</span>
                <span>{formatPrice(state.cart.total)}</span>
              </div>
              <div className="order-total-row order-final-total">
                <span>Total:</span>
                <span>{formatPrice(state.cart.total)}</span>
              </div>
            </div>
          </div>

          <div className="checkout-actions">
            <button
              onClick={() => navigate('/cart')}
              className="back-to-cart-btn"
              disabled={isPlacingOrder}
            >
              Back to Cart
            </button>
            
            <button
              onClick={handlePlaceOrder}
              className="place-order-btn"
              disabled={isPlacingOrder || state.cart.items.length === 0}
            >
              {isPlacingOrder ? (
                <>
                  <LoadingSpinner size="small" />
                  Placing Order...
                </>
              ) : (
                'Place Order'
              )}
            </button>
          </div>

          <div className="payment-info">
            <p className="payment-note">
              <strong>Note:</strong> This is a demo application. No actual payment will be processed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;