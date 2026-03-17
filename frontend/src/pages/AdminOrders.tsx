import React from 'react';
import './AdminOrders.css';

const AdminOrders: React.FC = () => {
  return (
    <div className="admin-orders">
      <div className="admin-orders__header">
        <h1>Order Management</h1>
        <p>View and manage customer orders</p>
      </div>
      
      <div className="admin-orders__content">
        <div className="placeholder-message">
          <h2>🚧 Coming Soon</h2>
          <p>Order management interface will be implemented in a future task.</p>
          <p>This will include:</p>
          <ul>
            <li>View all customer orders</li>
            <li>Filter orders by status</li>
            <li>Update order status</li>
            <li>View order details</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminOrders;