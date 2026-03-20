import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import AdminNav from '../AdminNav';
import './AdminLayout.css';

const AdminLayout: React.FC = () => {
  return (
    <div className="admin-layout">
      <Header />
      <AdminNav />
      <main className="admin-layout__content">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;