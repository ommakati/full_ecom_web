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
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      
      const allowedOrigins = [
        process.env.FRONTEND_URL || "https://full-ecom-web-frontend.vercel.app",
        "http://localhost:3000",
        "http://localhost:3001",
        "https://full-ecom-web-frontend.vercel.app"
      ];
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log('CORS blocked origin:', origin);
        callback(null, true); // Allow all origins in production for now
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['Set-Cookie'],
  })
);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret",
    resave: true, // Force session save
    saveUninitialized: true, // Save uninitialized sessions
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: false, // Allow client-side access for debugging
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      domain: process.env.NODE_ENV === "production" ? undefined : undefined, // Let browser handle domain
    },
    proxy: true,
    name: 'ecommerce.sid', // Custom session name
  })
);

// Rate limit
app.use("/api", rateLimit());

// API Routes
app.use("/api", apiRoutes);

// Health check route (VERY IMPORTANT for testing)
app.get("/api/test", (req, res) => {
  res.json({ 
    message: "API working",
    session: req.session ? {
      id: req.session.id,
      userId: req.session.userId,
      isAdmin: req.session.isAdmin
    } : null,
    cookies: req.headers.cookie || 'No cookies'
  });
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
    
    // Ensure admin user exists
    console.log("👤 Ensuring admin user exists...");
    try {
      const { ensureAdminUser } = await import("./database/seed.js");
      await ensureAdminUser();
      console.log("✅ Admin user verified");
    } catch (error) {
      console.error("⚠️  Admin user error:", error.message);
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