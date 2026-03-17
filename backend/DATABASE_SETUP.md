# Database Setup Guide

This guide explains how to set up and configure the PostgreSQL database for the e-commerce backend.

## Quick Start

1. **Run the database setup utility**:
   ```bash
   npm run setup:db
   ```
   This will test your connection and provide setup instructions if needed.

2. **If you have PostgreSQL running locally**:
   ```bash
   # Create the development database
   createdb ecommerce_dev
   
   # Run migrations and seed data
   npm run setup
   ```

3. **Check database health**:
   ```bash
   npm run health
   ```

## Prerequisites

- PostgreSQL 12+ installed and running
- Node.js 16+ installed
- npm or yarn package manager

## Installation Options

### Option 1: Local PostgreSQL

#### Windows
1. Download and install from [postgresql.org](https://www.postgresql.org/download/windows/)
2. During installation, remember the password for the `postgres` user
3. Add PostgreSQL to your PATH if not done automatically

#### macOS
```bash
# Using Homebrew
brew install postgresql@15
brew services start postgresql@15

# Create databases
createdb ecommerce_dev
createdb ecommerce_test
```

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Switch to postgres user and create databases
sudo -u postgres createdb ecommerce_dev
sudo -u postgres createdb ecommerce_test
```

### Option 2: Docker (Recommended for Development)

```bash
# Start PostgreSQL container
docker run --name postgres-ecommerce \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=ecommerce_dev \
  -p 5432:5432 \
  -d postgres:15

# Create test database
docker exec postgres-ecommerce createdb -U postgres ecommerce_test

# Verify container is running
docker ps
```

### Option 3: Cloud Database (Recommended for Production)

#### Supabase (Free tier available)
1. Sign up at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → Database
4. Copy the connection string
5. Update your `.env` file with the connection string

#### Railway (Free tier available)
1. Sign up at [railway.app](https://railway.app)
2. Create a new PostgreSQL service
3. Copy the connection string from the service variables
4. Update your `.env` file

#### Render (Free tier available)
1. Sign up at [render.com](https://render.com)
2. Create a new PostgreSQL database
3. Copy the connection string from the database info
4. Update your `.env` file

## Environment Configuration

### 1. Copy Environment Template
```bash
cp .env.example .env.development
```

### 2. Update Database URL
Edit `.env.development` with your database credentials:

```env
# Local PostgreSQL (default password)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ecommerce_dev

# Local PostgreSQL (custom password)
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/ecommerce_dev

# Cloud database
DATABASE_URL=postgresql://username:password@host:port/database
```

### 3. Environment Files

The system supports multiple environment configurations:

- `.env.development` - Development settings
- `.env.test` - Test environment settings  
- `.env.production` - Production settings
- `.env.local` - Local overrides (not tracked in git)
- `.env` - Default fallback

## Database Setup

### Automated Setup
```bash
# Complete setup (migrations + seeding)
npm run setup

# Or run steps individually:
npm run migrate  # Create tables
npm run seed     # Add sample data
```

### Manual Setup

1. **Run migrations**:
   ```bash
   npm run migrate
   ```

2. **Seed database**:
   ```bash
   npm run seed
   ```

3. **Verify setup**:
   ```bash
   npm run health
   ```

## Database Schema

The database includes the following tables with proper relationships and constraints:

### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Products Table
```sql
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Orders Table
```sql
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Order Items Table
```sql
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Cart Items Table
```sql
CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) NOT NULL,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, product_id)
);
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run setup` | Complete database setup (migrations + seeding) |
| `npm run setup:db` | Database setup utility with instructions |
| `npm run migrate` | Run database migrations only |
| `npm run seed` | Seed database with sample data only |
| `npm run health` | Run comprehensive database health check |
| `npm run db:reset` | Reset database (migrate + seed) |

## Database Features

### Security
- UUID primary keys for all tables
- Password hashing with bcrypt
- Input validation and constraints
- SQL injection protection via parameterized queries

### Performance
- Optimized indexes on frequently queried columns
- Connection pooling with configurable limits
- Query logging in development mode
- Efficient foreign key relationships

### Data Integrity
- Foreign key constraints with cascade deletes
- Check constraints for data validation
- Unique constraints where appropriate
- Automatic timestamp updates

## Troubleshooting

### Connection Issues

1. **Check if PostgreSQL is running**:
   ```bash
   # Check service status
   pg_isready
   
   # Or check with specific host/port
   pg_isready -h localhost -p 5432
   ```

2. **Verify database exists**:
   ```bash
   psql -U postgres -l
   ```

3. **Test connection manually**:
   ```bash
   psql -U postgres -d ecommerce_dev
   ```

### Common Error Solutions

#### "password authentication failed"
- Check your username/password in the DATABASE_URL
- Verify PostgreSQL user exists and has correct password
- Try connecting with `psql` directly to test credentials

#### "database does not exist"
- Create the database: `createdb ecommerce_dev`
- Or via SQL: `CREATE DATABASE ecommerce_dev;`

#### "relation does not exist"
- Run migrations: `npm run migrate`
- Check migration files in `src/database/migrations/`

#### "permission denied"
- Ensure database user has proper permissions
- Grant permissions: `GRANT ALL PRIVILEGES ON DATABASE ecommerce_dev TO your_user;`

### Health Check

Run the comprehensive health check to diagnose issues:

```bash
npm run health
```

This will check:
- Database connection
- Table existence
- Data counts
- Admin user setup
- Database constraints
- Migration status

## Production Deployment

### Environment Variables

Required for production:
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:port/db
SESSION_SECRET=your-super-secure-secret
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=secure-admin-password
```

### Security Checklist

- [ ] Use strong, unique SESSION_SECRET
- [ ] Change default admin credentials
- [ ] Enable SSL for database connections
- [ ] Use environment-specific database URLs
- [ ] Enable database backups
- [ ] Monitor database performance
- [ ] Set up database connection limits
- [ ] Configure proper user permissions

### Cloud Deployment Tips

1. **Database SSL**: Most cloud providers require SSL connections
2. **Connection Limits**: Configure appropriate pool sizes for your plan
3. **Backups**: Enable automated backups on your cloud provider
4. **Monitoring**: Set up alerts for connection issues and performance
5. **Scaling**: Consider read replicas for high-traffic applications

## Migration System

The migration system tracks applied migrations and ensures database schema consistency:

### Creating Migrations

1. Create a new `.sql` file in `src/database/migrations/`
2. Use sequential numbering: `002_add_user_profiles.sql`
3. Include both forward and rollback operations if needed

### Migration Best Practices

- Always test migrations on a copy of production data
- Use transactions for complex migrations
- Include proper error handling
- Document breaking changes
- Keep migrations idempotent when possible

## Sample Data

The seed script creates:
- Admin user with configurable credentials
- 5 sample products with realistic data
- Proper relationships between entities

Customize sample data by editing `src/database/seed.js`.