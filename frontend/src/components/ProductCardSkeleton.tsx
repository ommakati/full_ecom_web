import React from 'react';
import './LoadingSpinner.css';

const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="skeleton-product-card">
      <div className="skeleton-image skeleton"></div>
      <div className="skeleton-content">
        <div className="skeleton-title skeleton"></div>
        <div className="skeleton-description skeleton"></div>
        <div className="skeleton-description skeleton"></div>
        <div className="skeleton-price skeleton"></div>
      </div>
      <div className="skeleton-button skeleton"></div>
    </div>
  );
};

export default ProductCardSkeleton;