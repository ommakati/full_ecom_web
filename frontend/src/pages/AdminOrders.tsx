import React, { useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import './AdminOrders.css';

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_image_url?: string;
  quantity: number;
  price: number;
  item_total: number;
}

interface Order {
  id: string;
  user_id: string;
  user_email: string;
  total_amount: number;
  status: string;
  created_at: string;
  items: OrderItem[];
}

const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { showSuccess, showError } = useToast();

  const statusOptions = [
    { value: 'all', label: 'All Orders' },
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, statusFilter, searchQuery]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_URL}/orders/admin/all`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      showError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Filter by search query (email or order ID)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order =>
        order.user_email.toLowerCase().includes(query) ||
        order.id.toLowerCase().includes(query)
      );
    }

    setFilteredOrders(filtered);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_URL}/orders/admin/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      // Update local state
      setOrders(orders.map(order =>
        order.id === orderId ? { ...order, status: newStatus } : order
      ));

      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }

      showSuccess('Order status updated successfully');
    } catch (error) {
      console.error('Error updating order status:', error);
      showError('Failed to update order status');
    }
  };

  const getStatusBadgeClass = (status: string) => {
    const baseClass = 'status-badge';
    return `${baseClass} ${baseClass}--${status}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="admin-orders">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="admin-orders">
      <div className="admin-orders__header">
        <h1>Order Management</h1>
        <p>View and manage customer orders</p>
      </div>

      <div className="admin-orders__filters">
        <div className="filter-group">
          <label htmlFor="status-filter">Filter by Status:</label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="search-input">Search:</label>
          <input
            id="search-input"
            type="text"
            placeholder="Search by email or order ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-stats">
          <span>{filteredOrders.length} orders found</span>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="no-orders">
          <p>No orders found matching your criteria</p>
        </div>
      ) : (
        <div className="orders-table-container">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <tr key={order.id}>
                  <td className="order-id">
                    <button
                      className="order-id-link"
                      onClick={() => setSelectedOrder(order)}
                      title="View details"
                    >
                      {order.id.substring(0, 8)}...
                    </button>
                  </td>
                  <td>{order.user_email}</td>
                  <td>{formatDate(order.created_at)}</td>
                  <td>{order.items.length} item(s)</td>
                  <td className="order-total">{formatCurrency(order.total_amount)}</td>
                  <td>
                    <span className={getStatusBadgeClass(order.status)}>
                      {order.status}
                    </span>
                  </td>
                  <td>
                    <select
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                      className="status-select"
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedOrder && (
        <div className="order-modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="order-modal" onClick={(e) => e.stopPropagation()}>
            <div className="order-modal__header">
              <h2>Order Details</h2>
              <button
                className="close-button"
                onClick={() => setSelectedOrder(null)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="order-modal__content">
              <div className="order-info">
                <div className="info-row">
                  <span className="info-label">Order ID:</span>
                  <span className="info-value">{selectedOrder.id}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Customer:</span>
                  <span className="info-value">{selectedOrder.user_email}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Date:</span>
                  <span className="info-value">{formatDate(selectedOrder.created_at)}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Status:</span>
                  <span className={getStatusBadgeClass(selectedOrder.status)}>
                    {selectedOrder.status}
                  </span>
                </div>
              </div>

              <div className="order-items">
                <h3>Order Items</h3>
                {selectedOrder.items.map(item => (
                  <div key={item.id} className="order-item">
                    {item.product_image_url && (
                      <img
                        src={item.product_image_url}
                        alt={item.product_name}
                        className="order-item__image"
                      />
                    )}
                    <div className="order-item__details">
                      <h4>{item.product_name}</h4>
                      <p>Quantity: {item.quantity}</p>
                      <p>Price: {formatCurrency(item.price)}</p>
                    </div>
                    <div className="order-item__total">
                      {formatCurrency(item.item_total)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="order-total-section">
                <span className="total-label">Total Amount:</span>
                <span className="total-amount">{formatCurrency(selectedOrder.total_amount)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;