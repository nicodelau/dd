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
            {{ t('beginJourney') }}
          </h1>
          
          <p class="text-xl text-zinc-400 leading-relaxed mb-8">
            {{ t('journeyDescription') }}
          </p>
          
          <div class="space-y-4">
            <div class="flex items-center space-x-3">
              <div class="w-2 h-2 bg-red-500 rounded-full"></div>
              <span class="text-zinc-400">{{ t('featureRole') }}</span>
            </div>
            <div class="flex items-center space-x-3">
              <div class="w-2 h-2 bg-zinc-500 rounded-full"></div>
              <span class="text-zinc-400">{{ t('featureUnlimited') }}</span>
            </div>
            <div class="flex items-center space-x-3">
              <div class="w-2 h-2 bg-zinc-500 rounded-full"></div>
              <span class="text-zinc-400">{{ t('featureJoin') }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Decorative elements -->
      <div class="absolute top-10 right-10 w-32 h-32 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-xl"></div>
      <div class="absolute bottom-10 left-10 w-40 h-40 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full blur-xl"></div>
    </div>
    
    <!-- Right side - Register form -->
    <div class="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-zinc-900 bg-zinc-900">
      <div class="mx-auto w-full max-w-sm lg:w-96">
        <!-- Mobile hero header -->
        <div class="lg:hidden mb-8 text-center">
          <div class="w-12 h-12 bg-red-700 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-white text-white">{{ t('joinAdventure') }}</h2>
        </div>
        
        <div class="hidden lg:block">
          <h2 class="text-3xl font-bold text-white text-white">
            {{ t('createAccountTitle') }}
          </h2>
          <p class="mt-2 text-sm text-zinc-400 text-zinc-400">
            {{ t('or') }}
            <NuxtLink to="/auth/login" class="font-medium text-red-500 hover:text-red-400 transition-colors">
              {{ t('signInExisting') }}
            </NuxtLink>
          </p>
        </div>

        <div class="mt-8">
          <form class="space-y-6" @submit.prevent="handleRegister">
            <div class="space-y-4">
              <div>
                <label for="username" class="block text-sm font-medium text-zinc-300 text-zinc-300 mb-2">
                  {{ t('username') }}
                </label>
                <UInput
                  id="username"
                  v-model="form.username"
                  type="text"
                  :placeholder="t('chooseUsername')"
                  size="lg"
                  :class="{ 'border-red-500': errors.username }"
                  class="transition-all duration-200"
                  required
                />
                <p v-if="errors.username" class="mt-2 text-sm text-red-600">{{ errors.username }}</p>
              </div>
              
              <div>
                <label for="email" class="block text-sm font-medium text-zinc-300 text-zinc-300 mb-2">
                  {{ t('emailAddress') }}
                </label>
                <UInput
                  id="email"
                  v-model="form.email"
                  type="email"
                  :placeholder="t('enterEmail')"
                  size="lg"
                  :class="{ 'border-red-500': errors.email }"
                  class="transition-all duration-200"
                  required
                />
                <p v-if="errors.email" class="mt-2 text-sm text-red-600">{{ errors.email }}</p>
              </div>
              
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label for="firstName" class="block text-sm font-medium text-zinc-300 text-zinc-300 mb-2">
                    {{ t('firstName') }}
                  </label>
                  <UInput
                    id="firstName"
                    v-model="form.firstName"
                    type="text"
                    :placeholder="t('firstName')"
                    size="lg"
                    :class="{ 'border-red-500': errors.firstName }"
                    class="transition-all duration-200"
                  />
                  <p v-if="errors.firstName" class="mt-2 text-sm text-red-600">{{ errors.firstName }}</p>
                </div>
                
                <div>
                  <label for="lastName" class="block text-sm font-medium text-zinc-300 text-zinc-300 mb-2">
                    {{ t('lastName') }}
                  </label>
                  <UInput
                    id="lastName"
                    v-model="form.lastName"
                    type="text"
                    :placeholder="t('lastName')"
                    size="lg"
                    :class="{ 'border-red-500': errors.lastName }"
                    class="transition-all duration-200"
                  />
                  <p v-if="errors.lastName" class="mt-2 text-sm text-red-600">{{ errors.lastName }}</p>
                </div>
              </div>
              
              <div>
                <label for="password" class="block text-sm font-medium text-zinc-300 text-zinc-300 mb-2">
                  {{ t('password') }}
                </label>
                <UInput
                  id="password"
                  v-model="form.password"
                  type="password"
                  :placeholder="t('enterPassword')"
                  size="lg"
                  :class="{ 'border-red-500': errors.password }"
                  class="transition-all duration-200"
                  required
                />
                <p v-if="errors.password" class="mt-2 text-sm text-red-600">{{ errors.password }}</p>
              </div>
              
              <div>
                <label for="confirmPassword" class="block text-sm font-medium text-zinc-300 text-zinc-300 mb-2">
                  {{ t('confirmPassword') }}
                </label>
                <UInput
                  id="confirmPassword"
                  v-model="form.confirmPassword"
                  type="password"
                  :placeholder="t('confirmPasswordPlaceholder')"
                  size="lg"
                  :class="{ 'border-red-500': errors.confirmPassword }"
                  class="transition-all duration-200"
                  required
                />
                <p v-if="errors.confirmPassword" class="mt-2 text-sm text-red-600">{{ errors.confirmPassword }}</p>
              </div>
              
              <div>
                <label for="role" class="block text-sm font-medium text-zinc-300 text-zinc-300 mb-2">
                  {{ t('iWantToBe') }}
                </label>
                <USelect
                  id="role"
                  v-model="form.role"
                  :options="roleOptions"
                  :placeholder="t('selectRole')"
                  size="lg"
                  :class="{ 'border-red-500': errors.role }"
                  class="transition-all duration-200"
                />
                <p class="mt-2 text-xs text-gray-500 text-zinc-400">
                  {{ t('roleDescription') }}
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
                <label for="agree-terms" class="text-zinc-300 text-zinc-300">
                  {{ t('agreeTo') }} 
                  <NuxtLink to="/terms" class="font-medium text-red-500 hover:text-red-400 transition-colors">
                    {{ t('termsOfService') }}
                  </NuxtLink>
                  {{ t('and') }} 
                  <NuxtLink to="/privacy" class="font-medium text-red-500 hover:text-red-400 transition-colors">
                    {{ t('privacyPolicy') }}
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
                  {{ loading ? t('creatingAccount') : t('createAccountBtn') }}
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
            <p class="text-sm text-zinc-400 text-zinc-400">
              {{ t('alreadyHaveAccount') }}
              <NuxtLink to="/auth/login" class="font-medium text-red-500 hover:text-red-400 transition-colors">
                {{ t('signInHere') }}
              </NuxtLink>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useTranslations()

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