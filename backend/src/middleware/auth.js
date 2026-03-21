// ================= REQUIRE AUTH =================
export const requireAuth = (req, res, next) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
          timestamp: new Date().toISOString(),
        },
      });
    }

    next();
  } catch (error) {
    console.error("❌ AUTH ERROR:", error);
    res.status(500).json({
      error: {
        code: "AUTH_ERROR",
        message: error.message,
      },
    });
  }
};

// ================= REQUIRE ADMIN =================
export const requireAdmin = (req, res, next) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (!req.session.isAdmin) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Admin access required",
          timestamp: new Date().toISOString(),
        },
      });
    }

    next();
  } catch (error) {
    console.error("❌ ADMIN AUTH ERROR:", error);
    res.status(500).json({
      error: {
        code: "AUTH_ERROR",
        message: error.message,
      },
    });
  }
};

// ================= OPTIONAL AUTH =================
export const optionalAuth = (req, res, next) => {
  try {
    // session will exist if logged in
    next();
  } catch (error) {
    console.error("❌ OPTIONAL AUTH ERROR:", error);
    next();
  }
};