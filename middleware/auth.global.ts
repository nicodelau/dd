export default defineNuxtRouteMiddleware(async (to) => {
  // Skip auth check for auth pages
  if (to.path.startsWith('/auth/')) {
    return
  }

  try {
    const response = await $fetch('/api/auth/me')
    
    // Based on the API structure, response.data.user should exist
    if (!response.data?.user) {
      return navigateTo('/auth/login')
    }

    // Store user in app state
    useState('user', () => response.data.user)

  } catch (error) {
    console.error('Auth middleware error:', error)
    
    // Clear any invalid tokens
    await $fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
    
    return navigateTo('/auth/login')
  }
})