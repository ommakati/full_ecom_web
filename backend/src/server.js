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
    origin: [process.env.FRONTEND_URL || "https://full-ecom-web-frontend.vercel.app/", "http://localhost:3000"],
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
    const dbConnected = await testConnection();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Database: ${dbConnected ? "Connected" : "Disconnected"}`);
    });
  } catch (error) {
    console.error("Server failed:", error);
  }
};

startServer();