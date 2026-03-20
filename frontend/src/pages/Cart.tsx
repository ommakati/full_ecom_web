import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import LoadingSpinner from '../components/LoadingSpinner';
import './Cart.css';

const Cart: React.FC = () => {
  const { state, updateCartItem, removeFromCart, clearCart } = useApp();
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setUpdatingItems(prev => new Set(prev).add(itemId));
    setError(null);
    
    try {
      await updateCartItem(itemId, newQuantity);
    } catch (error) {
      console.error('Error updating cart item:', error);
      setError('Failed to update item quantity');
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    setUpdatingItems(prev => new Set(prev).add(itemId));
    setError(null);
    
    try {
      await removeFromCart(itemId);
    } catch (error) {
      console.error('Error removing cart item:', error);
      setError('Failed to remove item');
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const handleClearCart = async () => {
    setError(null);
    
    try {
      await clearCart();
    } catch (error) {
      console.error('Error clearing cart:', error);
      setError('Failed to clear cart');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const getTotalItems = () => {
    return state.cart.items.reduce((total, item) => total + item.quantity, 0);
  };

  if (state.cartLoading && state.cart.items.length === 0) {
    return (
      <div className="cart" role="main" aria-labelledby="cart-title">
        <div className="cart-wrapper">
          <div className="cart-loading">
            <LoadingSpinner />
            <p>Loading your cart...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart" role="main" aria-labelledby="cart-title">
      <div className="cart-wrapper">
        <div className="cart-header">
          <h2 id="cart-title">Shopping Cart</h2>
          {state.cart.items.length > 0 && (
            <button 
              onClick={handleClearCart}
              className="clear-cart-btn"
              disabled={state.cartLoading}
              aria-label="Clear all items from cart"
            >
              Clear Cart
            </button>
          )}
        </div>

        {error && (
          <div className="cart-error" role="alert" aria-live="polite">
            {error}
          </div>
        )}

        {state.cart.items.length === 0 ? (
          <div className="empty-cart">
            <h3>Your cart is empty</h3>
            <p>Add some products to get started!</p>
            <Link 
              to="/" 
              className="continue-shopping-btn"
              aria-label="Continue shopping for products"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="cart-content">
            <div className="cart-items" role="list" aria-label="Cart items">
              {state.cart.items.map((item) => (
                <article key={item.id} className="cart-item" role="listitem">
                  <div className="cart-item-image">
                    <img 
                      src={item.product.image_url} 
                      alt={`${item.product.name} product image`}
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder-product.jpg';
                        target.alt = `${item.product.name} - Image not available`;
                      }}
                    />
                  </div>
                  
                  <div className="cart-item-details">
                    <h3 className="cart-item-name">{item.product.name}</h3>
                    <p className="cart-item-price" aria-label={`Unit price: ${formatPrice(item.product.price)}`}>
                      {formatPrice(item.product.price)}
                    </p>
                  </div>
                  
                  <div className="cart-item-quantity">
                    <label htmlFor={`quantity-${item.id}`} className="quantity-label">
                      Quantity:
                    </label>
                    <div className="quantity-controls" role="group" aria-labelledby={`quantity-label-${item.id}`}>
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1 || updatingItems.has(item.id)}
                        className="quantity-btn"
                        aria-label={`Decrease quantity of ${item.product.name}`}
                      >
                        -
                      </button>
                      <input
                        id={`quantity-${item.id}`}
                        type="number"
                        min="1"
                        max="99"
                        value={item.quantity}
                        onChange={(e) => {
                          const newQuantity = parseInt(e.target.value);
                          if (newQuantity > 0 && newQuantity <= 99) {
                            handleQuantityChange(item.id, newQuantity);
                          }
                        }}
                        disabled={updatingItems.has(item.id)}
                        className="quantity-input"
                        aria-label={`Quantity of ${item.product.name}`}
                      />
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        disabled={updatingItems.has(item.id) || item.quantity >= 99}
                        className="quantity-btn"
                        aria-label={`Increase quantity of ${item.product.name}`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  
                  <div className="cart-item-total" aria-label={`Subtotal: ${formatPrice(item.product.price * item.quantity)}`}>
                    {formatPrice(item.product.price * item.quantity)}
                  </div>
                  
                  <div className="cart-item-actions">
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={updatingItems.has(item.id)}
                      className="remove-item-btn"
                      aria-label={`Remove ${item.product.name} from cart`}
                    >
                      {updatingItems.has(item.id) ? 'Removing...' : 'Remove'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
            
            <div className="cart-summary" role="complementary" aria-labelledby="cart-summary-title">
              <div className="cart-summary-content">
                <h3 id="cart-summary-title" className="sr-only">Order Summary</h3>
                <div className="cart-summary-row">
                  <span>Items ({getTotalItems()}):</span>
                  <span aria-label={`Subtotal: ${formatPrice(state.cart.total)}`}>
                    {formatPrice(state.cart.total)}
                  </span>
                </div>
                <div className="cart-summary-row cart-total">
                  <span>Total:</span>
                  <span aria-label={`Total amount: ${formatPrice(state.cart.total)}`}>
                    {formatPrice(state.cart.total)}
                  </span>
                </div>
                
                <div className="cart-actions">
                  <Link 
                    to="/" 
                    className="continue-shopping-link"
                    aria-label="Continue shopping for more products"
                  >
                    Continue Shopping
                  </Link>
                  <Link 
                    to="/checkout" 
                    className="checkout-btn"
                    aria-label={`Proceed to checkout with ${getTotalItems()} items totaling ${formatPrice(state.cart.total)}`}
                  >
                    Proceed to Checkout
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;