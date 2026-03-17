// Simple in-memory rate limiting (for production, use Redis or similar)
const requestCounts = new Map()

// Rate limiting middleware
export const rateLimit = (windowMs = 15 * 60 * 1000, maxRequests = 100) => {
  return (req, res, next) => {
    const clientId = req.ip || req.connection.remoteAddress
    const now = Date.now()
    const windowStart = now - windowMs
    
    // Clean up old entries
    for (const [key, data] of requestCounts.entries()) {
      if (data.timestamp < windowStart) {
        requestCounts.delete(key)
      }
    }
    
    // Get or create client data
    const clientData = requestCounts.get(clientId) || { count: 0, timestamp: now }
    
    // Reset if outside window
    if (clientData.timestamp < windowStart) {
      clientData.count = 0
      clientData.timestamp = now
    }
    
    // Check limit
    if (clientData.count >= maxRequests) {
      return res.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests, please try again later',
          retryAfter: Math.ceil((clientData.timestamp + windowMs - now) / 1000),
          timestamp: new Date().toISOString()
        }
      })
    }
    
    // Increment count
    clientData.count++
    requestCounts.set(clientId, clientData)
    
    // Add headers
    res.set({
      'X-RateLimit-Limit': maxRequests,
      'X-RateLimit-Remaining': Math.max(0, maxRequests - clientData.count),
      'X-RateLimit-Reset': new Date(clientData.timestamp + windowMs).toISOString()
    })
    
    next()
  }
}

// Stricter rate limiting for authentication endpoints
export const authRateLimit = rateLimit(15 * 60 * 1000, 5) // 5 requests per 15 minutes