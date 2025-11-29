<template>
  <div class="min-h-screen flex">
    <!-- Left side - Hero section with D&D theme -->
    <div class="hidden lg:flex lg:w-1/2 bg-zinc-950 relative overflow-hidden">
      <!-- Background pattern -->
      <div class="absolute inset-0 opacity-10">
        <div class="absolute inset-0" style="background-image: url('data:image/svg+xml,%3Csvg width=60 height=60 viewBox=0 0 60 60 xmlns=http://www.w3.org/2000/svg%3E%3Cg fill=none fill-rule=evenodd%3E%3Cg fill=%23ffffff fill-opacity=0.1%3E%3Cpath d=M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')"></div>
      </div>
      
      <!-- Content -->
      <div class="relative z-10 flex flex-col justify-center px-12 py-12 text-white">
        <div class="mb-8">
          <!-- D&D Logo/Icon -->
          <div class="w-16 h-16 bg-red-700 rounded-xl flex items-center justify-center mb-6 shadow-2xl">
            <svg class="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          
          <h1 class="text-4xl font-bold leading-tight mb-4">
            Welcome to Your
            <span class="text-transparent bg-clip-text bg-red-700">
              D&D Adventure
            </span>
          </h1>
          
          <p class="text-xl text-zinc-400 leading-relaxed mb-8">
            Manage your characters, track your campaigns, and embark on epic quests. Your adventure awaits in the digital realm.
          </p>
          
          <div class="space-y-4">
            <div class="flex items-center space-x-3">
              <div class="w-2 h-2 bg-red-500 rounded-full"></div>
              <span class="text-zinc-400">Create and manage characters</span>
            </div>
            <div class="flex items-center space-x-3">
              <div class="w-2 h-2 bg-zinc-500 rounded-full"></div>
              <span class="text-zinc-400">Track campaigns and sessions</span>
            </div>
            <div class="flex items-center space-x-3">
              <div class="w-2 h-2 bg-zinc-500 rounded-full"></div>
              <span class="text-zinc-400">Digital dice rolling and stats</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Decorative elements -->
      <div class="absolute top-10 right-10 w-32 h-32 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-xl"></div>
      <div class="absolute bottom-10 left-10 w-40 h-40 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full blur-xl"></div>
    </div>
    
    <!-- Right side - Login form -->
    <div class="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-zinc-900 bg-zinc-900">
      <div class="mx-auto w-full max-w-sm lg:w-96">
        <!-- Mobile hero header -->
        <div class="lg:hidden mb-8 text-center">
          <div class="w-12 h-12 bg-red-700 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-white text-white">Welcome Back</h2>
        </div>
        
        <div class="hidden lg:block">
          <h2 class="text-3xl font-bold text-white text-white">
            Sign in to your account
          </h2>
          <p class="mt-2 text-sm text-zinc-400 text-zinc-400">
            Or
            <NuxtLink to="/auth/register" class="font-medium text-red-500 hover:text-red-400 transition-colors">
              create a new account
            </NuxtLink>
          </p>
        </div>

        <div class="mt-8">
          <form class="space-y-6" @submit.prevent="handleLogin">
            <div class="space-y-4">
              <div>
                <label for="email" class="block text-sm font-medium text-zinc-300 text-zinc-300 mb-2">
                  Email address
                </label>
                <UInput
                  id="email"
                  v-model="form.email"
                  type="email"
                  placeholder="Enter your email"
                  size="lg"
                  :class="{ 'border-red-500': errors.email }"
                  class="transition-all duration-200"
                  required
                />
                <p v-if="errors.email" class="mt-2 text-sm text-red-600">{{ errors.email }}</p>
              </div>

              <div>
                <label for="password" class="block text-sm font-medium text-zinc-300 text-zinc-300 mb-2">
                  Password
                </label>
                <UInput
                  id="password"
                  v-model="form.password"
                  type="password"
                  placeholder="Enter your password"
                  size="lg"
                  :class="{ 'border-red-500': errors.password }"
                  class="transition-all duration-200"
                  required
                />
                <p v-if="errors.password" class="mt-2 text-sm text-red-600">{{ errors.password }}</p>
              </div>
            </div>

            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <UCheckbox
                  id="remember-me"
                  v-model="form.rememberMe"
                  label="Remember me"
                  class="text-sm"
                />
              </div>
            </div>

            <div>
              <UButton
                type="submit"
                :loading="loading"
                :disabled="loading"
                class="w-full"
                color="primary"
                size="lg"
                :ui="{ 
                  color: { 
                    primary: { 
                      solid: 'bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all duration-200' 
                    } 
                  } 
                }"
              >
                <span class="flex items-center justify-center">
                  <svg v-if="!loading" class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/>
                  </svg>
                  {{ loading ? 'Signing in...' : 'Sign in' }}
                </span>
              </UButton>
            </div>

            <div v-if="errors.general" class="mt-4">
              <UAlert
                :title="errors.general"
                color="red"
                variant="soft"
                :ui="{ wrapper: 'rounded-lg' }"
              />
            </div>
          </form>

          <!-- Mobile register link -->
          <div class="lg:hidden mt-6 text-center">
            <p class="text-sm text-zinc-400 text-zinc-400">
              Don't have an account?
              <NuxtLink to="/auth/register" class="font-medium text-red-500 hover:text-red-400 transition-colors">
                Sign up here
              </NuxtLink>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface LoginForm {
  email: string
  password: string
  rememberMe: boolean
}

interface LoginErrors {
  email?: string
  password?: string
  general?: string
}

const form = ref<LoginForm>({
  email: '',
  password: '',
  rememberMe: false
})

const errors = ref<LoginErrors>({})
const loading = ref(false)

const toast = useToast()
const router = useRouter()

const validateForm = (): boolean => {
  errors.value = {}
  
  if (!form.value.email) {
    errors.value.email = 'Email is required'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
    errors.value.email = 'Please enter a valid email address'
  }
  
  if (!form.value.password) {
    errors.value.password = 'Password is required'
  } else if (form.value.password.length < 6) {
    errors.value.password = 'Password must be at least 6 characters'
  }
  
  return Object.keys(errors.value).length === 0
}

const handleLogin = async () => {
  if (!validateForm()) {
    return
  }
  
  loading.value = true
  errors.value = {}
  
  try {
    const response = await $fetch('/api/auth/login', {
      method: 'POST',
      body: {
        email: form.value.email,
        password: form.value.password,
        rememberMe: form.value.rememberMe
      }
    })
    
    // Handle the response structure correctly
    const userData = response.data || response
    const user = userData.user || userData
    
    // Set user state
    const userState = useState('user')
    userState.value = user
    
    toast.add({
      title: 'Login successful',
      description: `Welcome back, ${user.firstName || user.username}!`,
      color: 'green'
    })
    
    // Redirect based on user role
    if (user.role === 'ADMIN' || user.role === 'DM') {
      await router.push('/dashboard')
    } else {
      await router.push('/')
    }
    
  } catch (error: any) {
    console.error('Login error:', error)
    
    if (error.statusCode === 401) {
      errors.value.general = 'Invalid email or password'
    } else if (error.statusCode === 403) {
      errors.value.general = 'Your account has been deactivated'
    } else {
      errors.value.general = 'An error occurred during login. Please try again.'
    }
    
    toast.add({
      title: 'Login failed',
      description: errors.value.general,
      color: 'red'
    })
  } finally {
    loading.value = false
  }
}

// Meta for SEO
useSeoMeta({
  title: 'Sign In - D&D Character Manager',
  description: 'Sign in to your D&D Character Manager account'
})

// Redirect if already authenticated
onMounted(async () => {
  try {
    const response = await $fetch('/api/auth/me')
    const userData = response.data || response
    const user = userData.user || userData
    
    if (user) {
      // Set user state
      const userState = useState('user')
      userState.value = user
      
      if (user.role === 'ADMIN' || user.role === 'DM') {
        await router.push('/dashboard')
      } else {
        await router.push('/')
      }
    }
  } catch {
    // User not authenticated, stay on login page
  }
})
</script>