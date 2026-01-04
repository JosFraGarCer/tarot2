import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/vue'
import * as matchers from '@testing-library/jest-dom/matchers'

// Extender expect
expect.extend(matchers)

// Cleanup después de cada test
afterEach(() => {
  cleanup()
})

// Mock de Nuxt composables
vi.mock('#imports', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: { value: 'en' }
  }),
  useRuntimeConfig: () => ({
    public: {
      apiBase: '/api'
    }
  }),
  $fetch: vi.fn(),
  useAsyncData: vi.fn(),
  useRoute: () => ({
    params: {},
    query: {},
    path: '/test'
  }),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn()
  }),
  useToast: () => ({
    add: vi.fn()
  })
}))

// Mock de componentes Nuxt UI
vi.mock('@nuxt/ui', () => ({
  UButton: {
    name: 'UButton',
    template: '<button><slot /></button>'
  },
  UInput: {
    name: 'UInput',
    template: '<input />',
    props: ['modelValue']
  },
  USelectMenu: {
    name: 'USelectMenu',
    template: '<select><slot /></select>',
    props: ['modelValue', 'items']
  },
  USwitch: {
    name: 'USwitch',
    template: '<input type="checkbox" />',
    props: ['modelValue']
  },
  UModal: {
    name: 'UModal',
    template: '<div><slot /></div>',
    props: ['open']
  },
  UFormField: {
    name: 'UFormField',
    template: '<div><label><slot /></label></div>',
    props: ['label', 'required']
  },
  UTextarea: {
    name: 'UTextarea',
    template: '<textarea></textarea>',
    props: ['modelValue']
  },
  UIcon: {
    name: 'UIcon',
    template: '<span></span>',
    props: ['name']
  },
  UApp: {
    name: 'UApp',
    template: '<div><slot /></div>'
  },
  NuxtLayout: {
    name: 'NuxtLayout',
    template: '<div><slot /></div>'
  },
  NuxtPage: {
    name: 'NuxtPage',
    template: '<div><slot /></div>'
  }
}))

// Mock de consola para tests
global.console = {
  ...console,
  warn: vi.fn(),
  error: vi.fn()
}
