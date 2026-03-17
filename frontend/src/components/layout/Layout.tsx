import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import './Layout.css';

const Layout: React.FC = () => {
  return (
    <div className="layout">
      <Header />
      <main id="main-content" className="main-content" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;