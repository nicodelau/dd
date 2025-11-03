import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '~/server/utils/prisma'

interface RegisterRequest {
  username: string
  email: string
  firstName?: string
  lastName?: string
  password: string
  role: 'PLAYER' | 'DM'
}

export default defineEventHandler(async (event) => {
  if (getMethod(event) !== 'POST') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method Not Allowed'
    })
  }

  try {
    const { 
      username, 
      email, 
      firstName, 
      lastName, 
      password, 
      role = 'PLAYER' 
    }: RegisterRequest = await readBody(event)

    // Validate required fields
    if (!username || !email || !password) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Username, email, and password are required'
      })
    }

    // Validate username format
    if (username.length < 3) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Username must be at least 3 characters'
      })
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Username can only contain letters, numbers, and underscores'
      })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Please enter a valid email address'
      })
    }

    // Validate password strength
    if (password.length < 6) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Password must be at least 6 characters'
      })
    }

    // Validate role
    if (!['PLAYER', 'DM'].includes(role)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid role specified'
      })
    }

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingEmail) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Email already registered',
        data: { field: 'email' }
      })
    }

    // Check if username already exists
    const existingUsername = await prisma.user.findUnique({
      where: { username }
    })

    if (existingUsername) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Username already taken',
        data: { field: 'username' }
      })
    }

    // Hash password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        email: email.toLowerCase(),
        firstName: firstName || null,
        lastName: lastName || null,
        password: hashedPassword,
        role
      }
    })

    // Create JWT token
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      throw createError({
        statusCode: 500,
        statusMessage: 'JWT secret not configured'
      })
    }

    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        role: user.role 
      },
      jwtSecret,
      { expiresIn: '24h' }
    )

    // Set HTTP-only cookie
    setCookie(event, 'auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    })

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user

    return {
      success: true,
      data: {
        user: userWithoutPassword,
        token
      }
    }

  } catch (error: any) {
    console.error('Registration error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})