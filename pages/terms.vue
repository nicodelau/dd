<template>
  <div class="container mx-auto px-4 py-8 max-w-4xl">
    <div class="bg-white rounded-lg shadow-lg p-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
      
      <div class="prose prose-lg max-w-none">
        <section class="mb-8">
          <h2 class="text-2xl font-semibold text-gray-800 mb-4">1. Acceptance of Terms</h2>
          <p class="text-gray-700 mb-4">
            By accessing and using this D&D character management application, you accept and agree to be bound by the terms and provision of this agreement.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-semibold text-gray-800 mb-4">2. Use License</h2>
          <p class="text-gray-700 mb-4">
            Permission is granted to temporarily use this application for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
          </p>
          <ul class="list-disc list-inside text-gray-700 mb-4 ml-4">
            <li>modify or copy the materials</li>
            <li>use the materials for any commercial purpose or for any public display</li>
            <li>attempt to reverse engineer any software contained in the application</li>
            <li>remove any copyright or other proprietary notations from the materials</li>
          </ul>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-semibold text-gray-800 mb-4">3. User Accounts</h2>
          <p class="text-gray-700 mb-4">
            When you create an account with us, you must provide information that is accurate, complete, and current at all times. You are responsible for safeguarding the password and for maintaining the confidentiality of your account.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-semibold text-gray-800 mb-4">4. Character Data</h2>
          <p class="text-gray-700 mb-4">
            You retain ownership of any character data you create using this application. However, by using our service, you grant us permission to store and process this data to provide the service functionality.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-semibold text-gray-800 mb-4">5. Prohibited Uses</h2>
          <p class="text-gray-700 mb-4">
            You may not use our service:
          </p>
          <ul class="list-disc list-inside text-gray-700 mb-4 ml-4">
            <li>for any unlawful purpose or to solicit others to perform unlawful acts</li>
            <li>to violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
            <li>to infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
            <li>to harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
            <li>to submit false or misleading information</li>
          </ul>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-semibold text-gray-800 mb-4">6. Disclaimer</h2>
          <p class="text-gray-700 mb-4">
            The information on this application is provided on an 'as is' basis. To the fullest extent permitted by law, this application excludes all representations, warranties, conditions and terms whether express or implied, statutory or otherwise.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-semibold text-gray-800 mb-4">7. Limitations</h2>
          <p class="text-gray-700 mb-4">
            In no event shall the application developers or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use this application.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-semibold text-gray-800 mb-4">8. Revisions</h2>
          <p class="text-gray-700 mb-4">
            We may revise these terms of service at any time without notice. By using this application, you are agreeing to be bound by the then current version of these terms of service.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-semibold text-gray-800 mb-4">9. Contact Information</h2>
          <p class="text-gray-700 mb-4">
            If you have any questions about these Terms of Service, please contact us through the application.
          </p>
        </section>
      </div>

      <div class="mt-8 pt-6 border-t border-gray-200">
        <p class="text-sm text-gray-500">
          Last updated: {{ new Date().toLocaleDateString() }}
        </p>
        <div class="mt-4">
          <NuxtLink 
            to="/auth/register" 
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            ← Back to Registration
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'auth'
})

useHead({
  title: 'Terms of Service - D&D Character Manager',
  meta: [
    {
      name: 'description',
      content: 'Terms of Service for the D&D Character Management Application'
    }
  ]
})
</script>