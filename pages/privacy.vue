<template>
  <div class="container mx-auto px-4 py-8 max-w-4xl">
    <div class="bg-white rounded-lg shadow-lg p-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
      
      <div class="prose prose-lg max-w-none">
        <section class="mb-8">
          <h2 class="text-2xl font-semibold text-gray-800 mb-4">1. Information We Collect</h2>
          <p class="text-gray-700 mb-4">
            We collect information you provide directly to us, such as when you create an account, create characters, or contact us for support.
          </p>
          <h3 class="text-lg font-semibold text-gray-800 mb-2">Personal Information:</h3>
          <ul class="list-disc list-inside text-gray-700 mb-4 ml-4">
            <li>Username and email address</li>
            <li>First and last name (optional)</li>
            <li>Password (encrypted and stored securely)</li>
            <li>User role (Player or Dungeon Master)</li>
          </ul>
          <h3 class="text-lg font-semibold text-gray-800 mb-2">Character Data:</h3>
          <ul class="list-disc list-inside text-gray-700 mb-4 ml-4">
            <li>Character statistics, abilities, and information</li>
            <li>Character backstories and notes</li>
            <li>Inventory and equipment data</li>
            <li>Campaign and session information</li>
          </ul>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-semibold text-gray-800 mb-4">2. How We Use Your Information</h2>
          <p class="text-gray-700 mb-4">
            We use the information we collect to:
          </p>
          <ul class="list-disc list-inside text-gray-700 mb-4 ml-4">
            <li>Provide, maintain, and improve our application</li>
            <li>Create and manage your user account</li>
            <li>Store and manage your D&D character data</li>
            <li>Enable collaboration between players and dungeon masters</li>
            <li>Respond to your comments and questions</li>
            <li>Ensure the security and integrity of our service</li>
          </ul>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-semibold text-gray-800 mb-4">3. Information Sharing</h2>
          <p class="text-gray-700 mb-4">
            We do not sell, trade, or otherwise transfer your personal information to third parties. Your character data may be shared with:
          </p>
          <ul class="list-disc list-inside text-gray-700 mb-4 ml-4">
            <li>Dungeon Masters you've granted access to</li>
            <li>Other players in your campaigns (as appropriate for gameplay)</li>
          </ul>
          <p class="text-gray-700 mb-4">
            We may disclose your information if required by law or to protect our rights, property, or safety.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-semibold text-gray-800 mb-4">4. Data Security</h2>
          <p class="text-gray-700 mb-4">
            We implement appropriate security measures to protect your personal information:
          </p>
          <ul class="list-disc list-inside text-gray-700 mb-4 ml-4">
            <li>Passwords are encrypted using industry-standard hashing</li>
            <li>Secure HTTP connections (HTTPS) for data transmission</li>
            <li>Regular security updates and monitoring</li>
            <li>Limited access to personal data by authorized personnel only</li>
          </ul>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-semibold text-gray-800 mb-4">5. Data Retention</h2>
          <p class="text-gray-700 mb-4">
            We retain your account information and character data for as long as your account is active or as needed to provide you services. You may request deletion of your account and data at any time.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-semibold text-gray-800 mb-4">6. Your Rights</h2>
          <p class="text-gray-700 mb-4">
            You have the right to:
          </p>
          <ul class="list-disc list-inside text-gray-700 mb-4 ml-4">
            <li>Access and update your personal information</li>
            <li>Delete your account and associated data</li>
            <li>Export your character data</li>
            <li>Control who has access to your characters</li>
            <li>Opt out of non-essential communications</li>
          </ul>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-semibold text-gray-800 mb-4">7. Cookies and Tracking</h2>
          <p class="text-gray-700 mb-4">
            We use cookies and similar technologies to:
          </p>
          <ul class="list-disc list-inside text-gray-700 mb-4 ml-4">
            <li>Keep you logged in to your account</li>
            <li>Remember your preferences</li>
            <li>Analyze how our application is used</li>
            <li>Improve our service performance</li>
          </ul>
          <p class="text-gray-700 mb-4">
            You can control cookie settings through your browser preferences.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-semibold text-gray-800 mb-4">8. Children's Privacy</h2>
          <p class="text-gray-700 mb-4">
            Our application is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-semibold text-gray-800 mb-4">9. Changes to This Privacy Policy</h2>
          <p class="text-gray-700 mb-4">
            We may update this privacy policy from time to time. We will notify you of any changes by posting the new privacy policy on this page and updating the "Last updated" date.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-semibold text-gray-800 mb-4">10. Contact Us</h2>
          <p class="text-gray-700 mb-4">
            If you have any questions about this Privacy Policy or our data practices, please contact us through the application.
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
  title: 'Privacy Policy - D&D Character Manager',
  meta: [
    {
      name: 'description',
      content: 'Privacy Policy for the D&D Character Management Application'
    }
  ]
})
</script>