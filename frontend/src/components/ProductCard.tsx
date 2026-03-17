import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../services/productService';
import { useApp } from '../contexts/AppContext';
import { useErrorHandler } from '../hooks/useErrorHandler';
import './ProductCard.css';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { state, addToCart } = useApp();
  const { handleAsyncError, isHandlingError } = useErrorHandler();
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation when clicking the button
    
    setIsAddingToCart(true);
    
    try {
      await handleAsyncError(
        () => addToCart(product.id, 1),
        {
          successMessage: `${product.name} added to cart!`,
          toastTitle: 'Cart Updated',
          showToast: true,
        }
      );
    } catch (error) {
      // Error is already handled by handleAsyncError
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleAddToCart(e as any);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  return (
    <article className="product-card" role="article">
      <Link 
        to={`/products/${product.id}`} 
        className="product-link"
        aria-label={`View details for ${product.name}, priced at ${formatPrice(product.price)}`}
      >
        <div className="product-image-container">
          <img 
            src={product.image_url} 
            alt={`${product.name} product image`}
            className="product-image"
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/placeholder-product.jpg';
              target.alt = `${product.name} - Image not available`;
            }}
          />
        </div>
        <div className="product-info">
          <h3 className="product-name">{product.name}</h3>
          <p className="product-description">{product.description}</p>
          <div className="product-price" aria-label={`Price: ${formatPrice(product.price)}`}>
            {formatPrice(product.price)}
          </div>
        </div>
      </Link>
      <div className="product-actions">
        <button 
          onClick={handleAddToCart}
          onKeyDown={handleKeyDown}
          disabled={isAddingToCart || isHandlingError}
          className="add-to-cart-btn"
          aria-label={`Add ${product.name} to shopping cart`}
          aria-describedby={`price-${product.id}`}
        >
          {isAddingToCart ? (
            <>
              <span className="loading-spinner" aria-hidden="true"></span>
              <span>Adding...</span>
            </>
          ) : (
            'Add to Cart'
          )}
        </button>
        <div id={`price-${product.id}`} className="sr-only">
          {formatPrice(product.price)}
        </div>
      </div>
    </article>
  );
};

export default ProductCard;