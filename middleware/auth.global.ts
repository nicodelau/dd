export default defineNuxtRouteMiddleware(async (to) => {
  // Skip auth check for auth pages
  if (to.path.startsWith('/auth/')) {
    return
  }

  // Get or initialize state
  const authLoading = useState('authLoading', () => false)
  const authLoadingMessage = useState('authLoadingMessage', () => 'Verifying authentication...')
  const redirectPath = useState('redirectPath', () => null as string | null)
  const user = useState('user')

  // If we already have user data on client-side navigation, skip the API call
  if (import.meta.client && user.value) {
    return
  }

  // Set loading state only if we don't have user data yet
  authLoading.value = true

  try {
    const headers = useRequestHeaders(['cookie'])
    const response = await $fetch('/api/auth/me', {
      headers
    })

    if (!response.data?.user) {
      redirectPath.value = to.fullPath
      authLoading.value = false
      return navigateTo('/auth/login')
    }

    // Update user state
    user.value = response.data.user
    authLoading.value = false

  } catch (error) {
    console.error('Auth middleware error:', error)

    // Only redirect to login, don't destroy the session cookie
    redirectPath.value = to.fullPath
    authLoading.value = false
    user.value = null

    return navigateTo('/auth/login')
  }
})