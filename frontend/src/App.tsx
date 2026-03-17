import { Routes, Route, BrowserRouter as Router } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import { ToastProvider } from './contexts/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';
import ToastContainer from './components/ToastContainer';
import AuthGuard from './components/AuthGuard';
import Layout from './components/layout/Layout';
import AdminLayout from './components/layout/AdminLayout';
import ProductList from './pages/ProductList';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import OrderHistory from './pages/OrderHistory';
import OrderDetail from './pages/OrderDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import AdminProducts from './pages/AdminProducts';
import AdminOrders from './pages/AdminOrders';
import { useToast } from './contexts/ToastContext';
import './App.css';

// Component to render toasts within the app context
const AppWithToasts: React.FC = () => {
  const { toasts, removeToast } = useToast();

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <AppProvider>
        <Router>
          <ErrorBoundary>
            <Routes>
              {/* Customer routes */}
              <Route path="/" element={<Layout />}>
                <Route index element={<ProductList />} />
                <Route path="products/:id" element={<ProductDetail />} />
                <Route path="cart" element={<Cart />} />
                <Route path="checkout" element={<Checkout />} />
                <Route path="order-confirmation/:orderId" element={<OrderConfirmation />} />
                <Route path="orders" element={<AuthGuard><OrderHistory /></AuthGuard>} />
                <Route path="orders/:orderId" element={<AuthGuard><OrderDetail /></AuthGuard>} />
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />
              </Route>

              {/* Admin routes */}
              <Route path="/admin" element={<AuthGuard requireAdmin={true}><AdminLayout /></AuthGuard>}>
                <Route index element={<AdminDashboard />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="orders" element={<AdminOrders />} />
              </Route>
            </Routes>
          </ErrorBoundary>
        </Router>
      </AppProvider>
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </>
  );
};

function App() {
  return (
    <ToastProvider>
      <AppWithToasts />
    </ToastProvider>
  );
}

export default App;