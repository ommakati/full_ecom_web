import React, { useState, useEffect, useCallback } from 'react';
import { Product, productService } from '../services/productService';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorDisplay from '../components/ErrorDisplay';
import EmptyState from '../components/EmptyState';
import ProductCardSkeleton from '../components/ProductCardSkeleton';
import ErrorBoundary from '../components/ErrorBoundary';
import './ProductList.css';

const ProductList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const fetchProducts = useCallback(async (isRetry = false) => {
    try {
      if (isRetry) {
        setIsRetrying(true);
      } else {
        setLoading(true);
      }
      
      setError(null);
      const productsData = await productService.getAllProducts();
      setProducts(productsData);
      setRetryCount(0);
    } catch (err) {
      console.error('Error fetching products:', err);
      
      // Determine error message based on error type
      let errorMessage = 'Failed to load products. Please try again.';
      
      if (err instanceof Error) {
        if (err.message.includes('Network Error') || err.message.includes('timeout')) {
          errorMessage = 'Network connection failed. Please check your internet connection and try again.';
        } else if (err.message.includes('500')) {
          errorMessage = 'Server error occurred. Please try again in a few moments.';
        } else if (err.message.includes('404')) {
          errorMessage = 'Products service is currently unavailable. Please try again later.';
        }
      }
      
      setError(errorMessage);
      setRetryCount(prev => prev + 1);
    } finally {
      setLoading(false);
      setIsRetrying(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleRetry = () => {
    fetchProducts(true);
  };

  const handleRefresh = () => {
    setRetryCount(0);
    fetchProducts();
  };

  // Show skeleton loading on initial load
  if (loading && !isRetrying) {
    return (
      <div className="product-list">
        <h2>Our Products</h2>
        <div className="products-grid">
          {Array.from({ length: 6 }, (_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  // Show error state with retry options
  if (error) {
    const showAdvancedOptions = retryCount >= 2;
    
    return (
      <div className="product-list">
        <h2>Products</h2>
        <ErrorDisplay
          title={showAdvancedOptions ? "Still having trouble?" : "Unable to load products"}
          message={error}
          onRetry={handleRetry}
          retryText={isRetrying ? "Retrying..." : "Try Again"}
          showRetry={!isRetrying}
        />
        {showAdvancedOptions && (
          <div className="advanced-error-options">
            <p className="error-help-text">
              If the problem persists, try refreshing the entire page or check back later.
            </p>
            <div className="error-actions">
              <button onClick={handleRefresh} className="refresh-button">
                Refresh Page
              </button>
              <button 
                onClick={() => window.location.href = '/'}
                className="home-button"
              >
                Go to Home
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Show empty state when no products
  if (products.length === 0) {
    return (
      <div className="product-list">
        <h2>Products</h2>
        <EmptyState
          title="No products available"
          message="We're currently updating our inventory. Check back soon for exciting new products!"
          actionText="Refresh"
          onAction={handleRefresh}
          icon={<span>📦</span>}
        />
      </div>
    );
  }

  // Show products with retry indicator if retrying
  return (
    <ErrorBoundary>
      <div className="product-list">
        <div className="product-list-header">
          <h2>Our Products</h2>
          {isRetrying && (
            <div className="retry-indicator">
              <LoadingSpinner size="small" message="Refreshing..." />
            </div>
          )}
        </div>
        <div className="products-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default ProductList;