export default defineNuxtRouteMiddleware(async (to) => {
  // Skip auth check for auth pages
  if (to.path.startsWith('/auth/')) {
    return
  }

  // Set loading state
  useState('authLoading', () => true)
  useState('authLoadingMessage', () => 'Verifying authentication...')

  try {
    const response = await $fetch('/api/auth/me')
    
    // Based on the API structure, response.data.user should exist
    if (!response.data?.user) {
      // Store the intended path for redirect after login
      useState('redirectPath', () => to.fullPath)
      useState('authLoading', () => false)
      return navigateTo('/auth/login')
    }

    // Store user in app state
    useState('user', () => response.data.user)
    useState('authLoading', () => false)

    // Check if we should redirect to stored path after login
    const redirectPath = useState('redirectPath')
    if (redirectPath.value && redirectPath.value !== to.fullPath) {
      const path = redirectPath.value
      redirectPath.value = null
      return navigateTo(path)
    }

  } catch (error) {
    console.error('Auth middleware error:', error)
    
    // Store the intended path for redirect after login
    useState('redirectPath', () => to.fullPath)
    useState('authLoading', () => false)
    
    // Clear any invalid tokens
    await $fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
    
    return navigateTo('/auth/login')
  }
})