import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  future: {
    compatibilityVersion: 5,
  },
  experimental: {
    componentIslands: true,
    localLayerAliases: true,
  },
  devtools: { enabled: false },
  // Development server
  devServer: {
    host: '0.0.0.0',
    port: 3007,
  },

  ssr: true,

  routeRules: {
    // API Caching: Cache session for 5 seconds to avoid spam during hydration
    '/api/auth/session': { cache: { maxAge: 5 } },
    // Global Security: Add basic security headers via Nitro
    '/**': {
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      }
    }
  },

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

  css: [resolve(__dirname, './app/assets/css/main.css')],

  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL || '',
    jwtSecret: process.env.JWT_SECRET || 'default-insecure-secret-for-dev-only',
    public: {
      apiBase: '/api'
    }
  },
  modules: [
    'nuxt-security',
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxt/ui',
    '@nuxtjs/i18n',
    '@pinia/nuxt',
    '@pinia/colada-nuxt',
   ],

  security: {
    csrf: true,
    headers: {
      contentSecurityPolicy: {
        'img-src': ["'self'", 'data:', 'https:', 'http:'],
      }
    },
    rateLimiter: false, // Ya tenemos un middleware custom de rate limit más granular
    enabled: process.env.NODE_ENV === 'production',
  },

})