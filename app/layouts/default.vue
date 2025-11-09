<!-- app/layouts/default.vue -->
<script setup lang="ts">
const currentYear = new Date().getFullYear()
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <!-- Header -->
    <AppHeader />

    <!-- Contenido -->
    <main class="p-4">
      <NuxtPage />
    </main>

    <!-- Footer -->
    <footer
      class="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-center text-xs text-gray-600 dark:text-gray-400 py-4"
    >
      <p>{{ $t('app.brand.title') }} &copy; {{ currentYear }}</p>
    </footer>
  </div>
</template>
