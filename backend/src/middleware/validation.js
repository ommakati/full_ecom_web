// Input validation middleware
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validatePassword = (password) => {
  // At least 6 characters
  return password && password.length >= 6
}

export const validateRequired = (fields) => {
  return (req, res, next) => {
    const missing = []
    
    for (const field of fields) {
      if (!req.body[field] || req.body[field].toString().trim() === '') {
        missing.push(field)
      }
    }
    
    if (missing.length > 0) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields',
          details: missing.map(field => ({
            field,
            message: `${field} is required`
          })),
          timestamp: new Date().toISOString()
        }
      })
    }
    
    next()
  }
}

export const validateProduct = (req, res, next) => {
  const { name, price, description } = req.body
  const errors = []
  
  if (!name || name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Product name is required' })
  }
  
  if (!price || isNaN(price) || parseFloat(price) < 0) {
    errors.push({ field: 'price', message: 'Valid price is required (must be >= 0)' })
  }
  
  if (description && description.length > 1000) {
    errors.push({ field: 'description', message: 'Description must be less than 1000 characters' })
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid product data',
        details: errors,
        timestamp: new Date().toISOString()
      }
    })
  }
  
  next()
}

export const validateQuantity = (req, res, next) => {
  const quantity = parseInt(req.body.quantity)
  
  if (!quantity || quantity < 1 || quantity > 100) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Quantity must be between 1 and 100',
        timestamp: new Date().toISOString()
      }
    })
  }
  
  req.body.quantity = quantity
  next()
}