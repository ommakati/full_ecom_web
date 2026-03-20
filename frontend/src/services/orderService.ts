import api from './api';

export interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_description?: string;
  product_image_url: string;
  quantity: number;
  price: number;
  item_total: number;
  created_at?: string;
}

export interface Order {
  id: string;
  user_id: string;
  user_email: string;
  items: OrderItem[];
  total_amount: number;
  status: string;
  created_at: string;
}

export interface OrdersResponse {
  orders: Order[];
  total_orders: number;
}

export const orderService = {
  // Create new order
  createOrder: async (): Promise<Order> => {
    const response = await api.post('/orders');
    return response.data;
  },

  // Get user's orders
  getOrders: async (): Promise<OrdersResponse> => {
    const response = await api.get('/orders');
    return response.data;
  },

  // Get specific order by ID
  getOrderById: async (id: string): Promise<Order> => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  // Get all orders (admin only)
  getAllOrders: async (): Promise<OrdersResponse> => {
    const response = await api.get('/orders/admin/all');
    return response.data;
  },

  // Update order status (admin only)
  updateOrderStatus: async (orderId: string, status: string): Promise<void> => {
    await api.patch(`/orders/admin/${orderId}/status`, { status });
  },
};