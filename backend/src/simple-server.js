import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";

import { testConnection } from "./database/connection.js";
import simpleAuthRoutes from "./routes/simple-auth.js";
import simpleProductRoutes from "./routes/simple-products.js";
import simpleCartRoutes from "./routes/simple-cart.js";
import simpleOrderRoutes from "./routes/simple-orders.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

// Security middleware
app.use(helmet());

// CORS configuration - very permissive for production debugging
app.use(
  cors({
    origin: true, // Allow all origins for now
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
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
      message: "Simple E-Commerce API is running",
      environment: process.env.NODE_ENV || "development",
      database: dbConnected ? "connected" : "disconnected",
      timestamp: new Date().toISOString()
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
    message: "Simple API working",
    headers: req.headers,
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use("/api/auth", simpleAuthRoutes);
app.use("/api/products", simpleProductRoutes);
app.use("/api/cart", simpleCartRoutes);
app.use("/api/orders", simpleOrderRoutes);

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
    console.log("🚀 Starting simple server...");
    
    // Test database connection
    const dbConnected = await testConnection();
    
    // Run migrations
    console.log("📦 Running database migrations...");
    try {
      const { runMigrations } = await import("./database/migrate.js");
      await runMigrations();
      console.log("✅ Migrations completed");
    } catch (error) {
      console.error("⚠️  Migration error:", error.message);
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
    }

    app.listen(PORT, () => {
      console.log(`✅ Simple server running on port ${PORT}`);
      console.log(`📦 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`💾 Database: ${dbConnected ? "Connected" : "Disconnected"}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error("❌ Server failed:", error);
    process.exit(1);
  }
};

startServer();