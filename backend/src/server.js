import express from "express";
import cors from "cors";
import helmet from "helmet";
import session from "express-session";
import dotenv from "dotenv";

import { testConnection } from "./database/connection.js";
import { rateLimit } from "./middleware/rateLimiting.js";
import apiRoutes from "./routes/index.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000; // Render uses dynamic port

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: [process.env.FRONTEND_URL || "https://full-ecom-web-frontend.vercel.app", "http://localhost:3000", "http://localhost:3001"],
    credentials: true,
  })
);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // Important for cross-origin
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
    proxy: true, // Trust proxy for production (Render, Heroku, etc.)
  })
);

// Rate limit
app.use("/api", rateLimit());

// API Routes
app.use("/api", apiRoutes);

// Health check route (VERY IMPORTANT for testing)
app.get("/api/test", (req, res) => {
  res.json({ message: "API working" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
  });
});

// Start server
const startServer = async () => {
  try {
    console.log("🚀 Starting server...");
    
    // Run migrations automatically
    console.log("📦 Running database migrations...");
    try {
      const { runMigrations } = await import("./database/migrate.js");
      await runMigrations();
      console.log("✅ Migrations completed");
    } catch (error) {
      console.error("⚠️  Migration error:", error.message);
      // Continue even if migration fails - tables might already exist
    }
    
    // Run seed automatically (will skip if data already exists)
    console.log("🌱 Running database seed...");
    try {
      const { seedDatabase } = await import("./database/seed.js");
      await seedDatabase();
      console.log("✅ Seed completed");
    } catch (error) {
      console.error("⚠️  Seed error:", error.message);
    }
    
    const dbConnected = await testConnection();

    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`📦 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`💾 Database: ${dbConnected ? "Connected" : "Disconnected"}`);
    });
  } catch (error) {
    console.error("❌ Server failed:", error);
    process.exit(1);
  }
};

startServer();