// i18n.config.ts
import en from './i18n/locales/en.json'
import es from './i18n/locales/es.json'

export default defineI18nConfig(() => ({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: { en, es },
  missingWarn: false,
  fallbackWarn: false
}))