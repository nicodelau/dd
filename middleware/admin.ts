export default defineNuxtRouteMiddleware(async () => {
  const user = useState('user') as any

  if (!user.value) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required'
    })
  }

  // Check if user is Admin
  if (user.value.role !== 'ADMIN') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Access denied. Admin role required.'
    })
  }
})