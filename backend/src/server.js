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
const PORT = process.env.PORT || 10000;

// ✅ VERY IMPORTANT FOR RENDER (fix cookies)
app.set("trust proxy", 1);

// ================= SECURITY =================
app.use(helmet());

// ================= CORS =================
const allowedOrigins = [
  "https://full-ecom-web-frontend.vercel.app",
  "http://localhost:3000"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log("❌ Blocked by CORS:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// ================= BODY PARSER =================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================= SESSION =================
app.use(
  session({
    name: "ecommerce.sid",
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
      secure: true,         // required for HTTPS (Render)
      httpOnly: true,
      sameSite: "none",     // required for Vercel ↔ Render
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

// ================= RATE LIMIT =================
app.use("/api", rateLimit());

// ================= ROUTES =================
app.use("/api", apiRoutes);

// ================= DEBUG ROUTE =================
app.get("/api/debug-session", (req, res) => {
  res.json({
    session: req.session,
    cookies: req.headers.cookie || "No cookies",
  });
});

// ================= HEALTH CHECK =================
app.get("/api/test", (req, res) => {
  res.json({
    message: "API working",
    session: req.session,
  });
});

// ================= 404 =================
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
  });
});

// ================= START SERVER =================
const startServer = async () => {
  try {
    console.log("🚀 Starting server...");

    // Run migrations
    try {
      const { runMigrations } = await import("./database/migrate.js");
      await runMigrations();
      console.log("✅ Migrations completed");
    } catch (err) {
      console.warn("⚠️ Migration skipped:", err.message);
    }

    // Run seed
    try {
      const { seedDatabase, ensureAdminUser } = await import("./database/seed.js");
      await seedDatabase();
      await ensureAdminUser();
      console.log("✅ Seed & admin setup done");
    } catch (err) {
      console.warn("⚠️ Seed skipped:", err.message);
    }

    const dbConnected = await testConnection();

    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`📦 ENV: ${process.env.NODE_ENV || "development"}`);
      console.log(`💾 DB: ${dbConnected ? "Connected" : "Disconnected"}`);
    });

  } catch (error) {
    console.error("❌ Server failed:", error);
    process.exit(1);
  }
};

startServer();