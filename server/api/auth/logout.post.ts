export default defineEventHandler(async (event) => {
  if (getMethod(event) !== 'POST') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method Not Allowed'
    })
  }

  try {
    // Clear the auth token cookie
    deleteCookie(event, 'auth-token')

    return {
      success: true,
      message: 'Logged out successfully'
    }

  } catch (error: any) {
    console.error('Logout error:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})