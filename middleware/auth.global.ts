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
  const authChecked = useState('authChecked', () => false)

  // If we already have user data on client-side navigation, skip the API call
  if (import.meta.client && user.value) {
    return
  }

  // If auth was already verified this session and user exists, skip re-check
  if (import.meta.client && authChecked.value && user.value) {
    return
  }

  // Only show loading overlay on client-side when we don't have user data
  if (import.meta.client && !user.value) {
    authLoading.value = true
  }

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
    authChecked.value = true
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