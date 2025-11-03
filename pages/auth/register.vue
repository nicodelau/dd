<template>
  <div class="min-h-screen flex">
    <!-- Left side - Hero section with D&D theme -->
    <div class="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      <!-- Background pattern -->
      <div class="absolute inset-0 opacity-10">
        <div class="absolute inset-0" style="background-image: url('data:image/svg+xml,%3Csvg width=60 height=60 viewBox=0 0 60 60 xmlns=http://www.w3.org/2000/svg%3E%3Cg fill=none fill-rule=evenodd%3E%3Cg fill=%23ffffff fill-opacity=0.1%3E%3Cpath d=M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')"></div>
      </div>
      
      <!-- Content -->
      <div class="relative z-10 flex flex-col justify-center px-12 py-12 text-white">
        <div class="mb-8">
          <!-- D&D Logo/Icon -->
          <div class="w-16 h-16 bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl flex items-center justify-center mb-6 shadow-2xl">
            <svg class="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          
          <h1 class="text-4xl font-bold leading-tight mb-4">
            Begin Your
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
              Epic Journey
            </span>
          </h1>
          
          <p class="text-xl text-slate-300 leading-relaxed mb-8">
            Create your account and join thousands of adventurers managing their D&D campaigns in the digital realm.
          </p>
          
          <div class="space-y-4">
            <div class="flex items-center space-x-3">
              <div class="w-2 h-2 bg-emerald-400 rounded-full"></div>
              <span class="text-slate-300">Choose your role: Player or DM</span>
            </div>
            <div class="flex items-center space-x-3">
              <div class="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span class="text-slate-300">Create unlimited characters</span>
            </div>
            <div class="flex items-center space-x-3">
              <div class="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span class="text-slate-300">Join campaigns and adventures</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Decorative elements -->
      <div class="absolute top-10 right-10 w-32 h-32 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-xl"></div>
      <div class="absolute bottom-10 left-10 w-40 h-40 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full blur-xl"></div>
    </div>
    
    <!-- Right side - Register form -->
    <div class="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-white dark:bg-gray-900">
      <div class="mx-auto w-full max-w-sm lg:w-96">
        <!-- Mobile hero header -->
        <div class="lg:hidden mb-8 text-center">
          <div class="w-12 h-12 bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Join the Adventure</h2>
        </div>
        
        <div class="hidden lg:block">
          <h2 class="text-3xl font-bold text-gray-900 dark:text-white">
            Create your account
          </h2>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Or
            <NuxtLink to="/auth/login" class="font-medium text-emerald-600 hover:text-emerald-500 transition-colors">
              sign in to your existing account
            </NuxtLink>
          </p>
        </div>

        <div class="mt-8">
          <form class="space-y-6" @submit.prevent="handleRegister">
            <div class="space-y-4">
              <div>
                <label for="username" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Username
                </label>
                <UInput
                  id="username"
                  v-model="form.username"
                  type="text"
                  placeholder="Choose a unique username"
                  size="lg"
                  :class="{ 'border-red-500': errors.username }"
                  class="transition-all duration-200"
                  required
                />
                <p v-if="errors.username" class="mt-2 text-sm text-red-600">{{ errors.username }}</p>
              </div>
              
              <div>
                <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email address
                </label>
                <UInput
                  id="email"
                  v-model="form.email"
                  type="email"
                  placeholder="your@email.com"
                  size="lg"
                  :class="{ 'border-red-500': errors.email }"
                  class="transition-all duration-200"
                  required
                />
                <p v-if="errors.email" class="mt-2 text-sm text-red-600">{{ errors.email }}</p>
              </div>
              
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label for="firstName" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    First name
                  </label>
                  <UInput
                    id="firstName"
                    v-model="form.firstName"
                    type="text"
                    placeholder="First name"
                    size="lg"
                    :class="{ 'border-red-500': errors.firstName }"
                    class="transition-all duration-200"
                  />
                  <p v-if="errors.firstName" class="mt-2 text-sm text-red-600">{{ errors.firstName }}</p>
                </div>
                
                <div>
                  <label for="lastName" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Last name
                  </label>
                  <UInput
                    id="lastName"
                    v-model="form.lastName"
                    type="text"
                    placeholder="Last name"
                    size="lg"
                    :class="{ 'border-red-500': errors.lastName }"
                    class="transition-all duration-200"
                  />
                  <p v-if="errors.lastName" class="mt-2 text-sm text-red-600">{{ errors.lastName }}</p>
                </div>
              </div>
              
              <div>
                <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </label>
                <UInput
                  id="password"
                  v-model="form.password"
                  type="password"
                  placeholder="Password (min. 6 characters)"
                  size="lg"
                  :class="{ 'border-red-500': errors.password }"
                  class="transition-all duration-200"
                  required
                />
                <p v-if="errors.password" class="mt-2 text-sm text-red-600">{{ errors.password }}</p>
              </div>
              
              <div>
                <label for="confirmPassword" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm password
                </label>
                <UInput
                  id="confirmPassword"
                  v-model="form.confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  size="lg"
                  :class="{ 'border-red-500': errors.confirmPassword }"
                  class="transition-all duration-200"
                  required
                />
                <p v-if="errors.confirmPassword" class="mt-2 text-sm text-red-600">{{ errors.confirmPassword }}</p>
              </div>
              
              <div>
                <label for="role" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  I want to be a...
                </label>
                <USelect
                  id="role"
                  v-model="form.role"
                  :options="roleOptions"
                  placeholder="Select your role"
                  size="lg"
                  :class="{ 'border-red-500': errors.role }"
                  class="transition-all duration-200"
                />
                <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Players can create and manage their own characters. DMs can manage all characters and create campaigns.
                </p>
                <p v-if="errors.role" class="mt-1 text-sm text-red-600">{{ errors.role }}</p>
              </div>
            </div>

            <div class="flex items-start">
              <div class="flex items-center h-5">
                <UCheckbox
                  id="agree-terms"
                  v-model="form.agreeToTerms"
                  :class="{ 'border-red-500': errors.agreeToTerms }"
                  required
                />
              </div>
              <div class="ml-3 text-sm">
                <label for="agree-terms" class="text-gray-700 dark:text-gray-300">
                  I agree to the 
                  <NuxtLink to="/terms" class="font-medium text-emerald-600 hover:text-emerald-500 transition-colors">
                    Terms of Service
                  </NuxtLink>
                  and 
                  <NuxtLink to="/privacy" class="font-medium text-emerald-600 hover:text-emerald-500 transition-colors">
                    Privacy Policy
                  </NuxtLink>
                </label>
              </div>
            </div>
            <p v-if="errors.agreeToTerms" class="text-sm text-red-600">{{ errors.agreeToTerms }}</p>

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
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
                  </svg>
                  {{ loading ? 'Creating account...' : 'Create account' }}
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

          <!-- Mobile login link -->
          <div class="lg:hidden mt-6 text-center">
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?
              <NuxtLink to="/auth/login" class="font-medium text-emerald-600 hover:text-emerald-500 transition-colors">
                Sign in here
              </NuxtLink>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface RegisterForm {
  username: string
  email: string
  firstName: string
  lastName: string
  password: string
  confirmPassword: string
  role: 'PLAYER' | 'DM'
  agreeToTerms: boolean
}

interface RegisterErrors {
  username?: string
  email?: string
  firstName?: string
  lastName?: string
  password?: string
  confirmPassword?: string
  role?: string
  agreeToTerms?: string
  general?: string
}

const form = ref<RegisterForm>({
  username: '',
  email: '',
  firstName: '',
  lastName: '',
  password: '',
  confirmPassword: '',
  role: 'PLAYER',
  agreeToTerms: false
})

const errors = ref<RegisterErrors>({})
const loading = ref(false)

const roleOptions = [
  { label: 'Player - I want to create and manage my characters', value: 'PLAYER' },
  { label: 'Dungeon Master - I want to manage campaigns and players', value: 'DM' }
]

const toast = useToast()
const router = useRouter()

const validateForm = (): boolean => {
  errors.value = {}
  
  if (!form.value.username) {
    errors.value.username = 'Username is required'
  } else if (form.value.username.length < 3) {
    errors.value.username = 'Username must be at least 3 characters'
  } else if (!/^[a-zA-Z0-9_]+$/.test(form.value.username)) {
    errors.value.username = 'Username can only contain letters, numbers, and underscores'
  }
  
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
  
  if (!form.value.confirmPassword) {
    errors.value.confirmPassword = 'Please confirm your password'
  } else if (form.value.password !== form.value.confirmPassword) {
    errors.value.confirmPassword = 'Passwords do not match'
  }
  
  if (!form.value.role) {
    errors.value.role = 'Please select your role'
  }
  
  if (!form.value.agreeToTerms) {
    errors.value.agreeToTerms = 'You must agree to the terms and conditions'
  }
  
  return Object.keys(errors.value).length === 0
}

const handleRegister = async () => {
  if (!validateForm()) {
    return
  }
  
  loading.value = true
  errors.value = {}
  
  try {
    const { data } = await $fetch('/api/auth/register', {
      method: 'POST',
      body: {
        username: form.value.username,
        email: form.value.email,
        firstName: form.value.firstName || null,
        lastName: form.value.lastName || null,
        password: form.value.password,
        role: form.value.role
      }
    })
    
    toast.add({
      title: 'Account created successfully',
      description: `Welcome to D&D Character Manager, ${data.user.firstName || data.user.username}!`,
      color: 'green'
    })
    
    // Redirect based on user role
    if (data.user.role === 'DM') {
      await router.push('/dashboard')
    } else {
      await router.push('/')
    }
    
  } catch (error: any) {
    console.error('Registration error:', error)
    
    if (error.statusCode === 409) {
      if (error.data?.field === 'email') {
        errors.value.email = 'This email address is already registered'
      } else if (error.data?.field === 'username') {
        errors.value.username = 'This username is already taken'
      } else {
        errors.value.general = 'An account with this email or username already exists'
      }
    } else if (error.statusCode === 400) {
      errors.value.general = error.data?.message || 'Please check your information and try again'
    } else {
      errors.value.general = 'An error occurred during registration. Please try again.'
    }
    
    toast.add({
      title: 'Registration failed',
      description: errors.value.general || 'Please check your information and try again',
      color: 'red'
    })
  } finally {
    loading.value = false
  }
}

// Meta for SEO
useSeoMeta({
  title: 'Create Account - D&D Character Manager',
  description: 'Create your D&D Character Manager account and start managing your characters'
})

// Redirect if already authenticated
onMounted(async () => {
  try {
    const { user } = await $fetch('/api/auth/me')
    if (user) {
      if (user.role === 'DM') {
        await router.push('/dashboard')
      } else {
        await router.push('/')
      }
    }
  } catch {
    // User not authenticated, stay on register page
  }
})
</script>