import { requireDMOrAdmin } from '~/server/utils/auth'
import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    // Verify DM/ADMIN authentication using cookie
    await requireDMOrAdmin(event)

    // Get query parameters
    const query = getQuery(event)
    const roleFilter = query.role as string

    // Build where clause
    const whereClause: any = {}
    if (roleFilter) {
      whereClause.role = roleFilter
    }

    // Fetch users
    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        username: 'asc'
      }
    })

    return {
      success: true,
      data: users
    }
  } catch (error: any) {
    console.error('Error in users API:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})