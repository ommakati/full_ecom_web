import React, { useState, useEffect } from 'react';
import { productService, Product } from '../services/productService';
import { useToast } from '../contexts/ToastContext';
import { handleError } from '../utils/errorHandler';
import LoadingSpinner from '../components/LoadingSpinner';
import LoadingWrapper from '../components/LoadingWrapper';
import ErrorDisplay from '../components/ErrorDisplay';
import './AdminProducts.css';

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  image_url: string;
}

const AdminProducts: React.FC = () => {
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: '',
    image_url: ''
  });
  const [formErrors, setFormErrors] = useState<Partial<ProductFormData>>({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await productService.getAllProducts();
      setProducts(data);
    } catch (err) {
      const { message } = handleError(err, {
        logError: true,
        fallbackMessage: 'Failed to load products. Please try again.'
      });
      setError(message);
      toast.showError(message, 'Loading Error');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<ProductFormData> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Product name is required';
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Product description is required';
    }
    
    if (!formData.price.trim()) {
      errors.price = 'Price is required';
    } else {
      const price = parseFloat(formData.price);
      if (isNaN(price) || price <= 0) {
        errors.price = 'Price must be a positive number';
      }
    }
    
    if (!formData.image_url.trim()) {
      errors.image_url = 'Image URL is required';
    } else if (!isValidUrl(formData.image_url)) {
      errors.image_url = 'Please enter a valid URL';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isValidUrl = (string: string): boolean => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field when user starts typing
    if (formErrors[name as keyof ProductFormData]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.showError('Please fix the form errors before submitting', 'Validation Error');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        image_url: formData.image_url.trim()
      };

      if (editingProduct) {
        await productService.updateProduct(editingProduct.id, productData);
        toast.showSuccess(`Product "${productData.name}" updated successfully`, 'Product Updated');
      } else {
        await productService.createProduct(productData);
        toast.showSuccess(`Product "${productData.name}" created successfully`, 'Product Created');
      }

      await loadProducts();
      resetForm();
    } catch (err) {
      const action = editingProduct ? 'update' : 'create';
      const { message } = handleError(err, {
        logError: true,
        fallbackMessage: `Failed to ${action} product. Please try again.`
      });
      
      setError(message);
      toast.showError(message, `${action === 'update' ? 'Update' : 'Create'} Failed`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      image_url: product.image_url
    });
    setShowForm(true);
    setFormErrors({});
  };

  const handleDelete = async (productId: string) => {
    if (deleteConfirm !== productId) {
      setDeleteConfirm(productId);
      setTimeout(() => setDeleteConfirm(null), 5000); // Auto-cancel after 5 seconds
      return;
    }

    try {
      setError(null);
      const productToDelete = products.find(p => p.id === productId);
      await productService.deleteProduct(productId);
      await loadProducts();
      setDeleteConfirm(null);
      
      toast.showSuccess(
        `Product "${productToDelete?.name || 'Unknown'}" deleted successfully`,
        'Product Deleted'
      );
    } catch (err) {
      const { message } = handleError(err, {
        logError: true,
        fallbackMessage: 'Failed to delete product. Please try again.'
      });
      
      setError(message);
      toast.showError(message, 'Delete Failed');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      image_url: ''
    });
    setFormErrors({});
    setEditingProduct(null);
    setShowForm(false);
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  return (
    <LoadingWrapper
      loading={loading}
      error={error}
      onRetry={loadProducts}
      loadingMessage="Loading products..."
    >
      <div className="admin-products">
        <div className="admin-products__header">
          <h1>Product Management</h1>
          <p>Manage your product catalog</p>
          <button 
            className="btn btn--primary"
            onClick={() => setShowForm(true)}
            disabled={showForm}
          >
            Add New Product
          </button>
        </div>

      {showForm && (
        <div className="product-form-overlay">
          <div className="product-form">
            <div className="product-form__header">
              <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button 
                className="btn btn--secondary"
                onClick={resetForm}
                disabled={submitting}
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Product Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={formErrors.name ? 'error' : ''}
                  disabled={submitting}
                />
                {formErrors.name && <span className="error-message">{formErrors.name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="description">Description *</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className={formErrors.description ? 'error' : ''}
                  disabled={submitting}
                />
                {formErrors.description && <span className="error-message">{formErrors.description}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="price">Price (USD) *</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className={formErrors.price ? 'error' : ''}
                  disabled={submitting}
                />
                {formErrors.price && <span className="error-message">{formErrors.price}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="image_url">Image URL *</label>
                <input
                  type="url"
                  id="image_url"
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleInputChange}
                  className={formErrors.image_url ? 'error' : ''}
                  disabled={submitting}
                />
                {formErrors.image_url && <span className="error-message">{formErrors.image_url}</span>}
              </div>

              <div className="form-actions">
                <button 
                  type="submit" 
                  className="btn btn--primary"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : (editingProduct ? 'Update Product' : 'Create Product')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="products-list">
        {products.length === 0 ? (
          <div className="empty-state">
            <h3>No products found</h3>
            <p>Start by adding your first product to the catalog.</p>
          </div>
        ) : (
          <div className="products-grid">
            {products.map(product => (
              <div key={product.id} className="product-card">
                <div className="product-card__image">
                  <img src={product.image_url} alt={product.name} />
                </div>
                <div className="product-card__content">
                  <h3>{product.name}</h3>
                  <p className="product-card__price">{formatPrice(product.price)}</p>
                  <p className="product-card__description">{product.description}</p>
                  <div className="product-card__actions">
                    <button 
                      className="btn btn--secondary btn--small"
                      onClick={() => handleEdit(product)}
                    >
                      Edit
                    </button>
                    <button 
                      className={`btn btn--small ${deleteConfirm === product.id ? 'btn--danger' : 'btn--outline'}`}
                      onClick={() => handleDelete(product.id)}
                    >
                      {deleteConfirm === product.id ? 'Confirm Delete' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </LoadingWrapper>
  );
};

export default AdminProducts;