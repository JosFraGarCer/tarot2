// tests/setup.ts
import { setup } from '@nuxt/test-utils'
import { beforeAll } from 'vitest'

// Set test environment
process.env.NODE_ENV = 'test'
process.env.VITEST = 'true'

beforeAll(async () => {
  await setup({
    server: true,
    port: 3007,
    host: 'localhost',
    environment: 'test',
  })

  // Store the test server URL globally
  ;(globalThis as any).TEST_SERVER_URL = 'http://localhost:3007'
}, 60000) // Increase timeout for server startup
