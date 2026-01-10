// tests/integration/diagnostic.test.ts
import { describe, it, expect } from 'vitest'
import { api } from './helpers'

describe('API Diagnostic Tests', () => {
  it('should be able to connect to the test server', async () => {
    try {
      const response = await api.get('/api/health') // Try a basic health endpoint
      console.log('Health check response:', {
        ok: response.ok,
        status: response.status,
        data: response.data,
      })

      // If health endpoint doesn't exist, that's fine - just check if we can connect
      expect(typeof response.status).toBe('number')
    } catch (error) {
      console.log('Connection error:', error)
      // If we can't even connect, the server isn't running
      throw error
    }
  })

  it('should check if arcana endpoint exists', async () => {
    const response = await api.get('/api/arcana')
    console.log('Arcana endpoint response:', {
      ok: response.ok,
      status: response.status,
      data: response.data,
    })

    // We expect this to fail if authentication is required, but we should get some response
    expect(typeof response.status).toBe('number')
  })

  it('should test basic connectivity', async () => {
    // Test if we can at least reach the server
    const response = await api.get('/')
    console.log('Root endpoint response:', {
      ok: response.ok,
      status: response.status,
      data: response.data,
    })

    expect(typeof response.status).toBe('number')
  })
})
