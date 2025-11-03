export default defineNuxtRouteMiddleware(async () => {
  const user = useState('user') as any

  if (!user.value) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required'
    })
  }

  // Check if user is DM or Admin
  if (!['DM', 'ADMIN'].includes(user.value.role)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Access denied. DM or Admin role required.'
    })
  }
})