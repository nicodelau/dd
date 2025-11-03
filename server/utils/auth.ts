import jwt from 'jsonwebtoken'
import prisma from './prisma'
import type { H3Event } from 'h3'

interface JWTPayload {
  userId: string
  email: string
  role: string
}

interface AuthUser {
  id: string
  username: string
  email: string
  role: 'PLAYER' | 'DM' | 'ADMIN'
  isActive: boolean
}

export async function authenticateUser(event: H3Event): Promise<AuthUser> {
  // Get token from cookie
  const token = getCookie(event, 'auth-token')
  
  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Not authenticated'
    })
  }

  // Verify JWT token
  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) {
    throw createError({
      statusCode: 500,
      statusMessage: 'JWT secret not configured'
    })
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as JWTPayload
    
    // Get fresh user data from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    })

    if (!user || !user.isActive) {
      throw createError({
        statusCode: 401,
        statusMessage: 'User not found or inactive'
      })
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive
    }

  } catch (error: any) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid or expired token'
      })
    }
    throw error
  }
}

export async function requireDMOrAdmin(event: H3Event): Promise<AuthUser> {
  const user = await authenticateUser(event)
  
  if (user.role !== 'DM' && user.role !== 'ADMIN') {
    throw createError({
      statusCode: 403,
      statusMessage: 'DM or Admin access required'
    })
  }
  
  return user
}

export async function requireAdmin(event: H3Event): Promise<AuthUser> {
  const user = await authenticateUser(event)
  
  if (user.role !== 'ADMIN') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Admin access required'
    })
  }
  
  return user
}