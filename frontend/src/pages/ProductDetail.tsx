import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Product, productService } from '../services/productService';
import { useApp } from '../contexts/AppContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorDisplay from '../components/ErrorDisplay';
import ErrorBoundary from '../components/ErrorBoundary';
import './ProductDetail.css';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, addToCart } = useApp();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addToCartMessage, setAddToCartMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const fetchProduct = useCallback(async (isRetry = false) => {
    if (!id) {
      setError('Product ID not provided');
      setLoading(false);
      return;
    }

    try {
      if (isRetry) {
        setIsRetrying(true);
      } else {
        setLoading(true);
      }
      
      setError(null);
      const productData = await productService.getProductById(id);
      setProduct(productData);
      setRetryCount(0);
    } catch (err) {
      console.error('Error fetching product:', err);
      
      let errorMessage = 'Failed to load product details. Please try again.';
      
      if (err instanceof Error) {
        if (err.message.includes('404')) {
          errorMessage = 'Product not found. It may have been removed or the link is incorrect.';
        } else if (err.message.includes('Network Error') || err.message.includes('timeout')) {
          errorMessage = 'Network connection failed. Please check your internet connection and try again.';
        } else if (err.message.includes('500')) {
          errorMessage = 'Server error occurred. Please try again in a few moments.';
        }
      }
      
      setError(errorMessage);
      setRetryCount(prev => prev + 1);
    } finally {
      setLoading(false);
      setIsRetrying(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const handleAddToCart = async () => {
    if (!product) return;
    
    setIsAddingToCart(true);
    try {
      await addToCart(product.id, quantity);
      setAddToCartMessage(`Added ${quantity} item(s) to cart!`);
      setTimeout(() => setAddToCartMessage(null), 3000);
    } catch (error) {
      console.error('Error adding to cart:', error);
      setAddToCartMessage('Failed to add to cart. Please try again.');
      setTimeout(() => setAddToCartMessage(null), 3000);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setQuantity(parseInt(e.target.value));
  };

  const handleRetry = () => {
    fetchProduct(true);
  };

  const handleGoBack = () => {
    navigate('/');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  if (loading && !isRetrying) {
    return (
      <div className="product-detail-container" role="main" aria-labelledby="loading-title">
        <div className="product-detail-wrapper">
          <h2 id="loading-title" className="sr-only">Loading Product Details</h2>
          <LoadingSpinner 
            size="large" 
            message="Loading product details..." 
          />
        </div>
      </div>
    );
  }

  if (error) {
    const isNotFound = error.includes('not found');
    const showAdvancedOptions = retryCount >= 2 && !isNotFound;
    
    return (
      <div className="product-detail-container" role="main" aria-labelledby="error-title">
        <div className="product-detail-wrapper">
          <h2 id="error-title" className="sr-only">Product Loading Error</h2>
          <ErrorDisplay
            title={isNotFound ? "Product Not Found" : "Unable to load product"}
            message={error}
            onRetry={isNotFound ? undefined : handleRetry}
            retryText={isRetrying ? "Retrying..." : "Try Again"}
            showRetry={!isNotFound && !isRetrying}
            type={isNotFound ? 'warning' : 'error'}
          />
          
          <div className="product-detail-actions">
            <Link 
              to="/" 
              className="back-link"
              aria-label="Go back to products page"
            >
              ← Back to Products
            </Link>
            
            {showAdvancedOptions && (
              <div className="advanced-error-options">
                <p className="error-help-text">
                  Still having trouble? Try refreshing the page or browse other products.
                </p>
                <div className="error-actions">
                  <button 
                    onClick={() => window.location.reload()} 
                    className="refresh-button"
                    aria-label="Refresh the current page"
                  >
                    Refresh Page
                  </button>
                  <button 
                    onClick={handleGoBack} 
                    className="browse-button"
                    aria-label="Browse all products"
                  >
                    Browse Products
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-detail-container" role="main" aria-labelledby="unavailable-title">
        <div className="product-detail-wrapper">
          <h2 id="unavailable-title" className="sr-only">Product Not Available</h2>
          <ErrorDisplay
            title="Product Not Available"
            message="This product is currently not available."
            showRetry={false}
            type="warning"
          />
          <Link 
            to="/" 
            className="back-link"
            aria-label="Go back to products page"
          >
            ← Back to Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="product-detail-container" role="main" aria-labelledby="product-title">
        <div className="product-detail-wrapper">
          <nav className="breadcrumb" aria-label="Breadcrumb navigation">
            <ol className="breadcrumb-list">
              <li>
                <Link to="/" className="breadcrumb-link" aria-label="Go to products page">
                  Products
                </Link>
              </li>
              <li aria-hidden="true" className="breadcrumb-separator">›</li>
              <li aria-current="page" className="breadcrumb-current">
                {product.name}
              </li>
            </ol>
          </nav>

          {isRetrying && (
            <div className="retry-indicator" role="status" aria-live="polite">
              <LoadingSpinner size="small" message="Refreshing product details..." />
            </div>
          )}

          <article className="product-detail">
            <div className="product-image-section">
              <img 
                src={product.image_url} 
                alt={`${product.name} product image`}
                className="product-detail-image"
                loading="lazy"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder-product.jpg';
                  target.alt = `${product.name} - Image not available`;
                }}
              />
            </div>

            <div className="product-info-section">
              <h1 id="product-title" className="product-title">{product.name}</h1>
              <div 
                className="product-price-large" 
                aria-label={`Price: ${formatPrice(product.price)}`}
              >
                {formatPrice(product.price)}
              </div>
              
              <div className="product-description-full">
                <h2>Description</h2>
                <p>{product.description}</p>
              </div>

              <div className="product-purchase" role="region" aria-labelledby="purchase-options">
                <h3 id="purchase-options" className="sr-only">Purchase Options</h3>
                
                <div className="quantity-selector">
                  <label htmlFor="quantity" className="quantity-label">
                    Quantity:
                  </label>
                  <select 
                    id="quantity"
                    value={quantity} 
                    onChange={handleQuantityChange}
                    className="quantity-select"
                    aria-describedby="quantity-help"
                  >
                    {[...Array(10)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                  <div id="quantity-help" className="sr-only">
                    Select quantity from 1 to 10 items
                  </div>
                </div>

                <button 
                  onClick={handleAddToCart}
                  disabled={isAddingToCart}
                  className="add-to-cart-btn-large"
                  aria-describedby="cart-status"
                  aria-label={`Add ${quantity} ${product.name} to shopping cart`}
                >
                  {isAddingToCart ? (
                    <>
                      <span className="loading-spinner" aria-hidden="true"></span>
                      <span>Adding to Cart...</span>
                    </>
                  ) : (
                    `Add ${quantity} to Cart`
                  )}
                </button>

                {addToCartMessage && (
                  <div 
                    id="cart-status"
                    className={`cart-message ${addToCartMessage.includes('Failed') || addToCartMessage.includes('log in') ? 'error' : 'success'}`}
                    role="alert"
                    aria-live="polite"
                  >
                    {addToCartMessage}
                  </div>
                )}
              </div>

              <nav className="product-actions-secondary" aria-label="Product navigation">
                <Link 
                  to="/" 
                  className="continue-shopping"
                  aria-label="Continue shopping for more products"
                >
                  ← Continue Shopping
                </Link>
                <Link 
                  to="/cart" 
                  className="view-cart"
                  aria-label="View items in your shopping cart"
                >
                  View Cart →
                </Link>
              </nav>
            </div>
          </article>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default ProductDetail;