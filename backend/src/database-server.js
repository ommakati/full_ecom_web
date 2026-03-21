import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";

import { testConnection, query } from "./database/connection.js";
import databaseAuthRoutes from "./routes/database-auth.js";
import databaseProductRoutes from "./routes/database-products.js";
import databaseOrderRoutes from "./routes/database-orders.js";
import databaseCartRoutes from "./routes/database-cart.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: true, // Allow all origins for now
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Auth-Token'],
  })
);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/api/health", async (req, res) => {
  try {
    const dbConnected = await testConnection();
    res.json({ 
      status: "OK", 
      message: "Database-backed E-Commerce API is running",
      environment: process.env.NODE_ENV || "development",
      database: dbConnected ? "connected" : "disconnected",
      timestamp: new Date().toISOString(),
      version: "2.0.0"
    });
  } catch (error) {
    res.status(503).json({
      status: "ERROR",
      message: "Service unavailable",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Test endpoint
app.get("/api/test", (req, res) => {
  res.json({ 
    message: "Database-backed API working",
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use("/api/auth", databaseAuthRoutes);
app.use("/api/products", databaseProductRoutes);
app.use("/api/orders", databaseOrderRoutes);
app.use("/api/cart", databaseCartRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.path,
    method: req.method
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    error: "Internal server error",
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// Start server
const startServer = async () => {
  try {
    console.log("🚀 Starting database-backed server...");
    console.log("📦 Using database-server.js (NOT simple-server.js)");
    console.log("🔑 Token-based authentication enabled");
    
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      throw new Error("Database connection failed");
    }
    
    // Run migrations
    console.log("📦 Running database migrations...");
    try {
      const { runMigrations } = await import("./database/migrate.js");
      await runMigrations();
      console.log("✅ Migrations completed");
    } catch (error) {
      console.error("⚠️  Migration error:", error.message);
      throw error;
    }
    
    // Run seed
    console.log("🌱 Running database seed...");
    try {
      const { seedDatabase, ensureAdminUser } = await import("./database/seed.js");
      await seedDatabase();
      await ensureAdminUser();
      console.log("✅ Seed completed");
    } catch (error) {
      console.error("⚠️  Seed error:", error.message);
      // Don't throw - seed errors shouldn't stop server
    }
    
    // Verify admin user one more time
    console.log("� Final admin verification...");
    try {
      const adminCheck = await query('SELECT id, email, is_admin FROM users WHERE email = $1', ['admin@example.com']);
      if (adminCheck.rows.length > 0) {
        console.log("✅ Admin user verified:", adminCheck.rows[0]);
      } else {
        console.error("❌ Admin user not found after seed!");
      }
    } catch (error) {
      console.error("⚠️  Admin verification error:", error.message);
    }

    app.listen(PORT, () => {
      console.log(`✅ Database-backed server running on port ${PORT}`);
      console.log(`📦 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`💾 Database: ${dbConnected ? "Connected" : "Disconnected"}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
      console.log(`👤 Admin: admin@example.com / admin123`);
    });
  } catch (error) {
    console.error("❌ Server failed:", error);
    process.exit(1);
  }
};

startServer();