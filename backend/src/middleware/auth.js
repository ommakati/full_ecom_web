// Authentication middleware
export const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
        timestamp: new Date().toISOString()
      }
    })
  }
  next()
}

// Admin authentication middleware
export const requireAdmin = (req, res, next) => {
  if (!req.session || !req.session.userId || !req.session.isAdmin) {
    return res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: 'Admin access required',
        timestamp: new Date().toISOString()
      }
    })
  }
  next()
}

// Optional authentication middleware (doesn't block if not authenticated)
export const optionalAuth = (req, res, next) => {
  // Just pass through - user info will be available in req.session if logged in
  next()
}