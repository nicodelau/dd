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
            Recover Your
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
              Adventure Access
            </span>
          </h1>
          
          <p class="text-xl text-slate-300 leading-relaxed mb-8">
            Don't worry! It happens to the best adventurers. We'll help you get back to your characters and campaigns.
          </p>
          
          <div class="space-y-4">
            <div class="flex items-center space-x-3">
              <div class="w-2 h-2 bg-emerald-400 rounded-full"></div>
              <span class="text-slate-300">Enter your email address</span>
            </div>
            <div class="flex items-center space-x-3">
              <div class="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span class="text-slate-300">Check your email for reset link</span>
            </div>
            <div class="flex items-center space-x-3">
              <div class="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span class="text-slate-300">Create a new secure password</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Decorative elements -->
      <div class="absolute top-10 right-10 w-32 h-32 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-xl"></div>
      <div class="absolute bottom-10 left-10 w-40 h-40 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full blur-xl"></div>
    </div>
    
    <!-- Right side - Reset form -->
    <div class="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-white dark:bg-gray-900">
      <div class="mx-auto w-full max-w-sm lg:w-96">
        <!-- Mobile hero header -->
        <div class="lg:hidden mb-8 text-center">
          <div class="w-12 h-12 bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Reset Password</h2>
        </div>
        
        <div class="hidden lg:block">
          <h2 class="text-3xl font-bold text-gray-900 dark:text-white">
            Forgot your password?
          </h2>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            No problem! Enter your email and we'll send you a reset link.
          </p>
        </div>

        <div class="mt-8">
          <div v-if="!submitted">
            <form class="space-y-6" @submit.prevent="handleForgotPassword">
              <div>
                <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email address
                </label>
                <UInput
                  id="email"
                  v-model="form.email"
                  type="email"
                  placeholder="Enter your email address"
                  size="lg"
                  :class="{ 'border-red-500': errors.email }"
                  class="transition-all duration-200"
                  required
                />
                <p v-if="errors.email" class="mt-2 text-sm text-red-600">{{ errors.email }}</p>
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
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                    </svg>
                    {{ loading ? 'Sending...' : 'Send reset link' }}
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
          </div>

          <!-- Success message -->
          <div v-else class="text-center">
            <div class="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Check your email</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
              We've sent a password reset link to <strong>{{ form.email }}</strong>
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-6">
              Don't see the email? Check your spam folder or try again.
            </p>
          </div>

          <!-- Back to login link -->
          <div class="mt-6 text-center">
            <NuxtLink to="/auth/login" class="font-medium text-emerald-600 hover:text-emerald-500 transition-colors flex items-center justify-center">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
              </svg>
              Back to sign in
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface ForgotPasswordForm {
  email: string
}

interface ForgotPasswordErrors {
  email?: string
  general?: string
}

const form = ref<ForgotPasswordForm>({
  email: ''
})

const errors = ref<ForgotPasswordErrors>({})
const loading = ref(false)
const submitted = ref(false)

const toast = useToast()

const validateForm = (): boolean => {
  errors.value = {}
  
  if (!form.value.email) {
    errors.value.email = 'Email is required'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
    errors.value.email = 'Please enter a valid email address'
  }
  
  return Object.keys(errors.value).length === 0
}

const handleForgotPassword = async () => {
  if (!validateForm()) {
    return
  }
  
  loading.value = true
  errors.value = {}
  
  try {
    // For now, just simulate the request since we don't have the backend endpoint
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    submitted.value = true
    
    toast.add({
      title: 'Reset link sent',
      description: 'Check your email for password reset instructions',
      color: 'green'
    })
    
  } catch (error: any) {
    console.error('Forgot password error:', error)
    
    if (error.statusCode === 404) {
      errors.value.general = 'No account found with this email address'
    } else {
      errors.value.general = 'An error occurred. Please try again later.'
    }
    
    toast.add({
      title: 'Failed to send reset link',
      description: errors.value.general,
      color: 'red'
    })
  } finally {
    loading.value = false
  }
}

// Meta for SEO
useSeoMeta({
  title: 'Forgot Password - D&D Character Manager',
  description: 'Reset your D&D Character Manager password'
})
</script>