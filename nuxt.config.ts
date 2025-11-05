// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  // Development server
  devServer: {
    host: '0.0.0.0',
    port: 3012,
  },

  ssr: true,

  // App configuration
  app: {
    head: {
      title: 'Tarot - Sistema de role-play con cartas generico',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Crea personajes únicos para tu juego de rol de ciencia ficción con nuestro sistema de cartas interactivo.' }
      ],
    }
  },

    // Soporte para i18n
  i18n: {
    strategy: 'prefix_except_default',
    locales: [
      { code: 'en', iso: 'en-US', name: 'English', file: 'en.json' },
      { code: 'es', iso: 'es-ES', name: 'Español', file: 'es.json' },
    ],
    defaultLocale: 'en',
    // Remove unsupported 'lazy' option for current module version
    // langDir only applies when using lazy loading; remove to satisfy typing
    // langDir: 'locales/',
    vueI18n: './i18n.config.ts',
  },

  css: ['@/assets/css/main.css'],

  modules: [
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxt/ui',
    '@nuxtjs/i18n',
    '@pinia/nuxt',
    '@pinia/colada-nuxt',
   ]
})