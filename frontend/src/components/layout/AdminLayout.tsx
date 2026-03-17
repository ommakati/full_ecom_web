import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminNav from '../AdminNav';
import './AdminLayout.css';

const AdminLayout: React.FC = () => {
  return (
    <div className="admin-layout">
      <AdminNav />
      <main className="admin-layout__content">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;