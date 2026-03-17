import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminNav from '../AdminNav';

const renderAdminNav = () => {
  return render(
    <BrowserRouter>
      <AdminNav />
    </BrowserRouter>
  );
};

describe('AdminNav', () => {
  it('renders admin navigation with all links', () => {
    renderAdminNav();

    expect(screen.getByText('Admin Panel')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Products')).toBeInTheDocument();
    expect(screen.getByText('Orders')).toBeInTheDocument();
    expect(screen.getByText('Back to Store')).toBeInTheDocument();
  });

  it('has correct navigation links', () => {
    renderAdminNav();

    const dashboardLink = screen.getByText('Dashboard').closest('a');
    const productsLink = screen.getByText('Products').closest('a');
    const ordersLink = screen.getByText('Orders').closest('a');
    const backToStoreLink = screen.getByText('Back to Store').closest('a');

    expect(dashboardLink).toHaveAttribute('href', '/admin');
    expect(productsLink).toHaveAttribute('href', '/admin/products');
    expect(ordersLink).toHaveAttribute('href', '/admin/orders');
    expect(backToStoreLink).toHaveAttribute('href', '/');
  });
});