# E-Commerce Website

A full-stack e-commerce website built with React frontend, Node.js/Express backend, and PostgreSQL database.

## Features

- **Product Browsing**: Responsive product catalog with detailed product pages
- **Shopping Cart**: Add, update, and remove items with persistent cart state
- **User Authentication**: Registration, login, and session management
- **Order Processing**: Complete checkout flow with order history
- **Admin Panel**: Product management interface for administrators
- **Responsive Design**: Mobile-first design that works on all devices

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **React Router** for client-side routing
- **Axios** for API communication
- **Vitest** for testing
- **ESLint** for code linting

### Backend
- **Node.js** with Express.js
- **PostgreSQL** for database
- **bcrypt** for password hashing
- **express-session** for session management
- **Jest** with Supertest for testing
- **fast-check** for property-based testing

## Project Structure

```
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable React components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API service functions
│   │   ├── types/          # TypeScript type definitions
│   │   └── test/           # Test utilities and setup
│   ├── public/             # Static assets
│   └── package.json
├── backend/                 # Node.js backend API
│   ├── src/
│   │   ├── routes/         # Express route handlers
│   │   ├── middleware/     # Custom middleware
│   │   ├── models/         # Database models
│   │   ├── database/       # Database configuration and migrations
│   │   ├── services/       # Business logic services
│   │   └── test/           # Test utilities and setup
│   └── package.json
└── package.json            # Root workspace configuration
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm (v8 or higher)
- PostgreSQL (v12 or higher)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ecommerce-website
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   ```bash
   # Backend environment
   cp backend/.env.example backend/.env
   # Edit backend/.env with your database credentials
   
   # Frontend environment
   cp frontend/.env.example frontend/.env
   # Edit frontend/.env if needed
   ```

4. **Set up the database**
   ```bash
   # Create PostgreSQL database
   createdb ecommerce_db
   
   # Run migrations (when implemented)
   cd backend && npm run migrate
   ```

### Development

**Start both frontend and backend:**
```bash
npm run dev
```

**Start individually:**
```bash
# Frontend only (http://localhost:3000)
npm run dev:frontend

# Backend only (http://localhost:5000)
npm run dev:backend
```

### Testing

**Run all tests:**
```bash
npm test
```

**Run tests individually:**
```bash
# Frontend tests
npm run test:frontend

# Backend tests
npm run test:backend
```

### Building for Production

```bash
npm run build
```

## API Endpoints

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product (admin only)
- `PUT /api/products/:id` - Update product (admin only)
- `DELETE /api/products/:id` - Delete product (admin only)

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get current user profile

### Cart
- `GET /api/cart` - Get cart contents
- `POST /api/cart/items` - Add item to cart
- `PUT /api/cart/items/:id` - Update cart item
- `DELETE /api/cart/items/:id` - Remove cart item

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get order by ID

## Database Schema

### Tables
- **users**: User accounts and authentication
- **products**: Product catalog
- **orders**: Customer orders
- **order_items**: Items within orders
- **cart_items**: Shopping cart contents

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License.