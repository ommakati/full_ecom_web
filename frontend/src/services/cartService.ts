import api from './api';

export interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    image_url: string;
  };
}

export interface Cart {
  items: CartItem[];
  total: number;
}

export const cartService = {
  // Get current cart contents
  getCart: async (): Promise<Cart> => {
    const response = await api.get('/cart');
    return response.data;
  },

  // Add item to cart
  addToCart: async (productId: string, quantity: number = 1): Promise<CartItem> => {
    const response = await api.post('/cart/items', {
      product_id: productId,
      quantity,
    });
    return response.data;
  },

  // Update cart item quantity
  updateCartItem: async (itemId: string, quantity: number): Promise<CartItem> => {
    const response = await api.put(`/cart/items/${itemId}`, { quantity });
    return response.data;
  },

  // Remove item from cart
  removeFromCart: async (itemId: string): Promise<void> => {
    await api.delete(`/cart/items/${itemId}`);
  },

  // Clear entire cart
  clearCart: async (): Promise<void> => {
    await api.delete('/cart');
  },
};