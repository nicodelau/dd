import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '~/server/utils/prisma'

interface LoginRequest {
  email: string
  password: string
  rememberMe?: boolean
}

export default defineEventHandler(async (event) => {
  if (event.method !== 'POST') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method Not Allowed'
    })
  }

  try {
    const { email, password, rememberMe = false }: LoginRequest = await readBody(event)

    // Validate input
    if (!email || !password) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email and password are required'
      })
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid credentials'
      })
    }

    // Check if user is active
    if (!user.isActive) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Account is deactivated'
      })
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid credentials'
      })
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    })

    // Create JWT token
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      throw createError({
        statusCode: 500,
        statusMessage: 'JWT secret not configured'
      })
    }

    const tokenExpiry = rememberMe ? '30d' : '24h'
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        role: user.role 
      },
      jwtSecret,
      { expiresIn: tokenExpiry }
    )

    // Set HTTP-only cookie
    const cookieExpiry = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000 // 30 days or 1 day
    setCookie(event, 'auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: cookieExpiry
    })

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user

    return {
      success: true,
      data: {
        user: userWithoutPassword,
        token // Also return token for client-side usage if needed
      }
    }

  } catch (error: any) {
    console.error('Login error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})