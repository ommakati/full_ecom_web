import api from './api';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  created_at: string;
  updated_at: string;
}

export const productService = {
  // Get all products
  getAllProducts: async (): Promise<Product[]> => {
    const response = await api.get('/products');
    // Backend returns { products: [...], count: ... }, we need just the products array
    return response.data.products || response.data;
  },

  // Get single product by ID
  getProductById: async (id: string): Promise<Product> => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  // Create new product (admin only)
  createProduct: async (productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> => {
    const response = await api.post('/products', productData);
    return response.data;
  },

  // Update product (admin only)
  updateProduct: async (id: string, productData: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>): Promise<Product> => {
    const response = await api.put(`/products/${id}`, productData);
    return response.data;
  },

  // Delete product (admin only)
  deleteProduct: async (id: string): Promise<void> => {
    await api.delete(`/products/${id}`);
  },
};