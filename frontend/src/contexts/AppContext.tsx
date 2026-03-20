import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, authService } from '../services/authService';
import { CartItem, Cart, cartService } from '../services/cartService';
import { useToast } from './ToastContext';

// Define the application state
interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  isInitialized: boolean;
  cart: Cart;
  cartLoading: boolean;
}

// Define action types
type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_INITIALIZED'; payload: boolean }
  | { type: 'SET_CART'; payload: Cart }
  | { type: 'SET_CART_LOADING'; payload: boolean }
  | { type: 'ADD_CART_ITEM'; payload: CartItem }
  | { type: 'UPDATE_CART_ITEM'; payload: { itemId: string; quantity: number } }
  | { type: 'REMOVE_CART_ITEM'; payload: string }
  | { type: 'CLEAR_CART' }
  | { type: 'LOGOUT' };

// Initial state
const initialState: AppState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  isInitialized: false,
  cart: { items: [], total: 0 },
  cartLoading: false,
};

// Reducer function
const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        loading: false,
        error: null,
      };
    case 'SET_INITIALIZED':
      return { ...state, isInitialized: action.payload };
    case 'SET_CART':
      return { ...state, cart: action.payload, cartLoading: false };
    case 'SET_CART_LOADING':
      return { ...state, cartLoading: action.payload };
    case 'ADD_CART_ITEM':
      const existingItemIndex = state.cart.items.findIndex(
        item => item.product_id === action.payload.product_id
      );
      
      let updatedItems;
      if (existingItemIndex >= 0) {
        // Update existing item quantity
        updatedItems = state.cart.items.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + action.payload.quantity }
            : item
        );
      } else {
        // Add new item
        updatedItems = [...state.cart.items, action.payload];
      }
      
      const newTotal = updatedItems.reduce(
        (total, item) => total + (item.product.price * item.quantity),
        0
      );
      
      return {
        ...state,
        cart: { items: updatedItems, total: newTotal },
        cartLoading: false,
      };
    case 'UPDATE_CART_ITEM':
      const updatedCartItems = state.cart.items.map(item =>
        item.id === action.payload.itemId
          ? { ...item, quantity: action.payload.quantity }
          : item
      );
      
      const updatedTotal = updatedCartItems.reduce(
        (total, item) => total + (item.product.price * item.quantity),
        0
      );
      
      return {
        ...state,
        cart: { items: updatedCartItems, total: updatedTotal },
        cartLoading: false,
      };
    case 'REMOVE_CART_ITEM':
      const filteredItems = state.cart.items.filter(item => item.id !== action.payload);
      const filteredTotal = filteredItems.reduce(
        (total, item) => total + (item.product.price * item.quantity),
        0
      );
      
      return {
        ...state,
        cart: { items: filteredItems, total: filteredTotal },
        cartLoading: false,
      };
    case 'CLEAR_CART':
      return {
        ...state,
        cart: { items: [], total: 0 },
        cartLoading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null,
        cart: { items: [], total: 0 },
      };
    default:
      return state;
  }
};

// Context type
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  loadCart: () => Promise<void>;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateCartItem: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

// Create context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Session storage utilities for cart persistence
const CART_STORAGE_KEY = 'ecommerce_cart';

const saveCartToStorage = (cart: Cart) => {
  try {
    sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (error) {
    console.warn('Failed to save cart to session storage:', error);
  }
};

const loadCartFromStorage = (): Cart | null => {
  try {
    const stored = sessionStorage.getItem(CART_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.warn('Failed to load cart from session storage:', error);
    return null;
  }
};

const clearCartFromStorage = () => {
  try {
    sessionStorage.removeItem(CART_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear cart from session storage:', error);
  }
};

// Provider component
interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const toast = useToast();

  // Check authentication status and load cart on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        const response = await authService.getProfile();
        dispatch({ type: 'SET_USER', payload: response.user });
        
        // Load cart for authenticated users
        if (response.user) {
          await loadCart();
        }
      } catch (error) {
        // User is not authenticated, load cart from session storage
        const storedCart = loadCartFromStorage();
        if (storedCart) {
          dispatch({ type: 'SET_CART', payload: storedCart });
        }
        dispatch({ type: 'SET_USER', payload: null });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
        dispatch({ type: 'SET_INITIALIZED', payload: true });
      }
    };

    initializeAuth();
  }, []);

  // Save cart to session storage whenever cart changes
  useEffect(() => {
    if (state.isInitialized) {
      saveCartToStorage(state.cart);
    }
  }, [state.cart, state.isInitialized]);

  const loadCart = async (): Promise<void> => {
    if (!state.isAuthenticated) {
      // For non-authenticated users, use session storage
      const storedCart = loadCartFromStorage();
      if (storedCart) {
        dispatch({ type: 'SET_CART', payload: storedCart });
      }
      return;
    }

    try {
      dispatch({ type: 'SET_CART_LOADING', payload: true });
      const cart = await cartService.getCart();
      dispatch({ type: 'SET_CART', payload: cart });
    } catch (error) {
      console.error('Failed to load cart:', error);
      dispatch({ type: 'SET_CART_LOADING', payload: false });
    }
  };

  const addToCart = async (productId: string, quantity: number = 1): Promise<void> => {
    try {
      dispatch({ type: 'SET_CART_LOADING', payload: true });
      
      if (state.isAuthenticated) {
        // For authenticated users, use the API
        const cartItem = await cartService.addToCart(productId, quantity);
        dispatch({ type: 'ADD_CART_ITEM', payload: cartItem });
      } else {
        // For non-authenticated users, simulate cart item creation
        // We need to fetch product details to create a proper cart item
        const { productService } = await import('../services/productService');
        const product = await productService.getProductById(productId);
        
        const cartItem = {
          id: `temp-${Date.now()}-${productId}`,
          product_id: productId,
          quantity,
          product: {
            id: product.id,
            name: product.name,
            price: product.price,
            image_url: product.image_url
          }
        };
        
        dispatch({ type: 'ADD_CART_ITEM', payload: cartItem });
      }
      
      // Show success toast
      toast.showSuccess(`Added ${quantity} item${quantity > 1 ? 's' : ''} to cart`);
    } catch (error) {
      dispatch({ type: 'SET_CART_LOADING', payload: false });
      
      // Show error toast
      const errorMessage = error instanceof Error ? error.message : 'Failed to add item to cart';
      toast.showError(errorMessage, 'Cart Error');
      
      throw error;
    }
  };

  const updateCartItem = async (itemId: string, quantity: number): Promise<void> => {
    try {
      dispatch({ type: 'SET_CART_LOADING', payload: true });
      
      if (state.isAuthenticated && !itemId.startsWith('temp-')) {
        // For authenticated users with real cart items, use the API
        await cartService.updateCartItem(itemId, quantity);
      }
      // For non-authenticated users or temp items, just update locally
      dispatch({ type: 'UPDATE_CART_ITEM', payload: { itemId, quantity } });
      
      // Show success toast
      toast.showSuccess('Cart updated successfully');
    } catch (error: any) {
      dispatch({ type: 'SET_CART_LOADING', payload: false });
      
      // If item not found (404), remove it from local state
      if (error?.response?.status === 404) {
        dispatch({ type: 'REMOVE_CART_ITEM', payload: itemId });
        toast.showWarning('Item was removed from cart as it no longer exists');
        return;
      }
      
      // Show error toast
      const errorMessage = error instanceof Error ? error.message : 'Failed to update cart item';
      toast.showError(errorMessage, 'Cart Error');
      
      throw error;
    }
  };

  const removeFromCart = async (itemId: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_CART_LOADING', payload: true });
      
      if (state.isAuthenticated && !itemId.startsWith('temp-')) {
        // For authenticated users with real cart items, use the API
        await cartService.removeFromCart(itemId);
      }
      // For non-authenticated users or temp items, just remove locally
      dispatch({ type: 'REMOVE_CART_ITEM', payload: itemId });
      
      // Show success toast
      toast.showSuccess('Item removed from cart');
    } catch (error: any) {
      // If item not found (404), still remove it from local state
      if (error?.response?.status === 404) {
        dispatch({ type: 'REMOVE_CART_ITEM', payload: itemId });
        toast.showSuccess('Item removed from cart');
        return;
      }
      
      dispatch({ type: 'SET_CART_LOADING', payload: false });
      
      // Show error toast
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove item from cart';
      toast.showError(errorMessage, 'Cart Error');
      
      throw error;
    }
  };

  const clearCart = async (): Promise<void> => {
    if (!state.isAuthenticated) {
      dispatch({ type: 'CLEAR_CART' });
      clearCartFromStorage();
      toast.showSuccess('Cart cleared');
      return;
    }

    try {
      dispatch({ type: 'SET_CART_LOADING', payload: true });
      await cartService.clearCart();
      dispatch({ type: 'CLEAR_CART' });
      toast.showSuccess('Cart cleared');
    } catch (error) {
      dispatch({ type: 'SET_CART_LOADING', payload: false });
      
      // Show error toast
      const errorMessage = error instanceof Error ? error.message : 'Failed to clear cart';
      toast.showError(errorMessage, 'Cart Error');
      
      throw error;
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    
    try {
      const response = await authService.login({ email, password });
      dispatch({ type: 'SET_USER', payload: response.user });
      
      // Load cart after successful login
      await loadCart();
      
      // Show success toast
      toast.showSuccess(`Welcome back, ${response.user.email}!`, 'Login Successful');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      
      // Show error toast
      toast.showError(errorMessage, 'Login Failed');
      
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const register = async (email: string, password: string): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    
    try {
      const response = await authService.register({ email, password });
      dispatch({ type: 'SET_USER', payload: response.user });
      
      // Load cart after successful registration
      await loadCart();
      
      // Show success toast
      toast.showSuccess(`Account created successfully! Welcome, ${response.user.email}!`, 'Registration Successful');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      
      // Show error toast
      toast.showError(errorMessage, 'Registration Failed');
      
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
      
      // Show success toast
      toast.showSuccess('You have been logged out successfully', 'Logout Successful');
    } catch (error) {
      console.error('Logout error:', error);
      
      // Show warning toast for logout errors (but still proceed with logout)
      toast.showWarning('Logout completed, but there was an issue with the server', 'Logout Warning');
    } finally {
      dispatch({ type: 'LOGOUT' });
      clearCartFromStorage();
    }
  };

  const checkAuth = async (): Promise<void> => {
    try {
      const response = await authService.getProfile();
      dispatch({ type: 'SET_USER', payload: response.user });
      
      // Load cart if authenticated
      if (response.user) {
        await loadCart();
      }
    } catch (error) {
      dispatch({ type: 'SET_USER', payload: null });
    }
  };

  const contextValue: AppContextType = {
    state,
    dispatch,
    login,
    register,
    logout,
    checkAuth,
    loadCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the context
export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};