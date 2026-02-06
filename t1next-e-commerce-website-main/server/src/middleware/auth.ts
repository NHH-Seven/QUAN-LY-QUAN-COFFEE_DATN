import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { config } from '../config/index.js'
import type { JwtPayload } from '../types/index.js'

// Export AuthRequest type for routes
export interface AuthRequest extends Request {
  user?: JwtPayload
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload
    req.user = decoded
    next()
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid token' })
  }
}

export function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  // Also support token from query string for direct downloads
  const queryToken = req.query.token as string | undefined

  const token = authHeader?.startsWith('Bearer ') 
    ? authHeader.split(' ')[1] 
    : queryToken

  if (!token) {
    return res.status(401).json({ success: false, error: 'Unauthorized' })
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload
    
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Không có quyền truy cập' })
    }
    
    req.user = decoded
    next()
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid token' })
  }
}

export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload
      req.user = decoded
    } catch {
      // Token invalid, continue without user
    }
  }
  next()
}

// Middleware cho nhân viên kho (warehouse hoặc admin)
export function warehouseMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload
    
    if (decoded.role !== 'warehouse' && decoded.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Không có quyền truy cập kho' })
    }
    
    req.user = decoded
    next()
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid token' })
  }
}

// Middleware cho nhân viên bán hàng (sales hoặc admin)
export function salesMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload
    
    if (decoded.role !== 'sales' && decoded.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Không có quyền truy cập' })
    }
    
    req.user = decoded
    next()
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid token' })
  }
}

// Middleware cho staff (admin, sales, warehouse)
export function staffMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload
    
    const staffRoles = ['admin', 'sales', 'warehouse']
    if (!staffRoles.includes(decoded.role)) {
      return res.status(403).json({ success: false, error: 'Không có quyền truy cập' })
    }
    
    req.user = decoded
    next()
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid token' })
  }
}
