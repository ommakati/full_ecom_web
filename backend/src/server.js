import express from "express";
import cors from "cors";
import helmet from "helmet";
import session from "express-session";
import dotenv from "dotenv";
import { exec } from "child_process";
import { promisify } from "util";

import { testConnection } from "./database/connection.js";
import { rateLimit } from "./middleware/rateLimiting.js";
import apiRoutes from "./routes/index.js";

dotenv.config();

const execPromise = promisify(exec);

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
    },
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
    
    // Run migrations and seed in production
    if (process.env.NODE_ENV === "production") {
      console.log("📦 Running database migrations...");
      try {
        await execPromise("npm run migrate");
        console.log("✅ Migrations completed");
      } catch (error) {
        console.error("⚠️  Migration error:", error.message);
      }
      
      console.log("🌱 Running database seed...");
      try {
        await execPromise("npm run seed");
        console.log("✅ Seed completed");
      } catch (error) {
        console.error("⚠️  Seed error:", error.message);
      }
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