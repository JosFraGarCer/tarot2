// tests/integration/helpers.ts
const TEST_SERVER_URL = (globalThis as any).TEST_SERVER_URL || 'http://localhost:3007'

// API Response types
interface ApiResponse<T = unknown> {
  success: boolean
  data: T
  meta?: {
    count?: number
    page?: number
    pageSize?: number
    total?: number
    [key: string]: unknown
  }
}

interface EntityData {
  id: number
  code: string
  name: string
  status: string
  is_active: boolean
  created_at: string
  modified_at: string
  [key: string]: unknown
}

export class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = TEST_SERVER_URL) {
    this.baseUrl = baseUrl
  }

  async request(endpoint: string, options: RequestInit = {}): Promise<{
    ok: boolean
    status: number
    data: ApiResponse | null
  }> {
    const url = `${this.baseUrl}${endpoint}`
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })

      let data: ApiResponse | null = null
      try {
        const parsed = await response.json()
        data = parsed as ApiResponse
      } catch {
        data = null
      }

      return {
        ok: response.ok,
        status: response.status,
        data,
      }
    } catch (fetchError) {
      // Handle network errors
      return {
        ok: false,
        status: 0,
        data: { success: false, data: null, error: 'Network error' } as any,
      }
    }
  }

  async get(endpoint: string) {
    return this.request(endpoint, { method: 'GET' })
  }

  async post(endpoint: string, data: unknown) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async patch(endpoint: string, data: unknown) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async delete(endpoint: string) {
    return this.request(endpoint, { method: 'DELETE' })
  }
}

export const api = new ApiClient()

// Helper to create test data for different entities
export function createTestData(entityType: string, overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const baseData: Record<string, unknown> = {
    code: 'test-entity',
    name: 'Test Entity',
    lang: 'en',
    status: 'draft',
    is_active: true,
    ...overrides,
  }

  switch (entityType) {
    case 'arcana':
      return baseData
    case 'cardtype':
      return baseData
    case 'world':
      return baseData
    case 'facet':
      return {
        ...baseData,
        ...(baseData.arcana_id ? {} : { arcana_id: 1 }), // Only set default if not provided
      }
    case 'skill':
      return {
        ...baseData,
        ...(baseData.facet_id ? {} : { facet_id: 1 }), // Only set default if not provided
      }
    case 'base-card':
      return {
        ...baseData,
        ...(baseData.card_type_id ? {} : { card_type_id: 1 }), // Only set default if not provided
      }
    case 'world-card':
      return {
        ...baseData,
        ...(baseData.world_id ? {} : { world_id: 1 }), // Only set default if not provided
      }
    case 'tag':
      return {
        ...baseData,
        category: 'test',
      }
    default:
      return baseData
  }
}

// Helper to get API endpoint for entity
export function getEntityEndpoint(entityType: string, id?: number): string {
  const base = `/api/${entityType.replace('-', '_')}`
  return id ? `${base}/${id}` : base
}

// Helper to authenticate and get a token for tests
export async function authenticateTestUser(identifier = 'wsurf', password = 'windsurf'): Promise<string> {
  const response = await api.post('/api/auth/login', {
    identifier,
    password,
  })

  if (!response.ok || !response.data?.data?.token) {
    throw new Error(`Authentication failed: ${response.status} - ${JSON.stringify(response.data)}`)
  }

  return response.data.data.token
}

// Enhanced ApiClient that supports authentication
export class AuthenticatedApiClient extends ApiClient {
  private token: string | null = null

  setToken(token: string) {
    this.token = token
  }

  async request(endpoint: string, options: RequestInit = {}): Promise<{
    ok: boolean
    status: number
    data: unknown
  }> {
    const headers: Record<string, string> = {
      ...options.headers,
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
      // Also set cookie for cookie-based auth
      headers['Cookie'] = `auth_token=${this.token}`
    }

    return super.request(endpoint, {
      ...options,
      headers,
    })
  }
}

// Create authenticated API client
export const authenticatedApi = new AuthenticatedApiClient()

// Helper to setup authenticated API for tests
export async function setupAuthenticatedApi(): Promise<void> {
  try {
    const token = await authenticateTestUser()
    authenticatedApi.setToken(token)
  } catch (error) {
    console.warn('Could not authenticate test user, tests may fail:', error)
    // Continue without authentication - some tests might still work
  }
}

// Helper to clean up test data
export async function cleanupTestData(entityType: string, testCode: string = 'test-entity'): Promise<void> {
  try {
    // Try to find and delete test entities
    const listResponse = await authenticatedApi.get(getEntityEndpoint(entityType))
    if (listResponse.ok && listResponse.data && typeof listResponse.data === 'object' && 'data' in listResponse.data) {
      const data = (listResponse.data as { data?: unknown[] }).data
      if (Array.isArray(data)) {
        const testEntities = data.filter((item: any) => item?.code === testCode)
        for (const entity of testEntities) {
          if (entity && typeof entity === 'object' && 'id' in entity) {
            await authenticatedApi.delete(getEntityEndpoint(entityType, entity.id as number))
          }
        }
      }
    }
  } catch {
    // Ignore cleanup errors
  }
}
