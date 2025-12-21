export default defineNuxtRouteMiddleware(async (to) => {
  // Skip auth check for auth pages
  if (to.path.startsWith('/auth/')) {
    return
  }

  // Get or initialize state
  const authLoading = useState('authLoading', () => true)
  const authLoadingMessage = useState('authLoadingMessage', () => 'Verifying authentication...')
  const redirectPath = useState('redirectPath', () => null as string | null)

  // Set loading state
  authLoading.value = true

  try {
    const response = await $fetch('/api/auth/me')
    
    // Based on API structure, response.data.user should exist
    if (!response.data?.user) {
      // Store the intended path for redirect after login
      redirectPath.value = to.fullPath
      console.log('🔀 Auth middleware: Storing redirect path:', to.fullPath)
      authLoading.value = false
      return navigateTo('/auth/login')
    }

    // Store user in app state
    useState('user', () => response.data.user)
    authLoading.value = false

    // Check if we should redirect to stored path after login
    if (redirectPath.value) {
      const path = redirectPath.value
      console.log('🔀 Auth middleware: Redirecting to stored path:', path)
      redirectPath.value = null
      return navigateTo(path)
    }

  } catch (error) {
    console.error('Auth middleware error:', error)
    
    // Store the intended path for redirect after login
    redirectPath.value = to.fullPath
    authLoading.value = false
    
    // Clear any invalid tokens
    await $fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
    
    return navigateTo('/auth/login')
  }
})