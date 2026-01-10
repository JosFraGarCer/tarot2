// tests/unit/arcana.test.ts
import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest'
import { createTestData, getEntityEndpoint, cleanupTestData, authenticatedApi, setupAuthenticatedApi } from '../integration/helpers'

// Mock the authenticated API
vi.mock('../integration/helpers', () => ({
  authenticatedApi: {
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    get: vi.fn(),
  },
  createTestData: vi.fn(),
  getEntityEndpoint: vi.fn(),
  cleanupTestData: vi.fn(),
  setupAuthenticatedApi: vi.fn(),
}))

describe('Arcana Unit Tests', () => {
  const entityType = 'arcana'
  const testCode = 'test-arcana'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Create Test Entity', () => {
    it('should create arcana "Test" with multiple fields', async () => {
      // Mock the API response
      const mockResponse = {
        ok: true,
        status: 201,
        data: {
          success: true,
          data: {
            id: 1,
            code: testCode,
            name: 'Test Arcana Entity',
            description: 'A test arcana for integration testing',
            short_text: 'Test short description',
            status: 'draft',
            is_active: true,
            created_at: '2024-01-01T00:00:00Z',
            modified_at: '2024-01-01T00:00:00Z',
          }
        }
      }

      // Setup mocks
      const { authenticatedApi, createTestData, getEntityEndpoint } = await import('../integration/helpers')
      const mockCreateTestData = createTestData as MockedFunction<typeof createTestData>
      const mockGetEntityEndpoint = getEntityEndpoint as MockedFunction<typeof getEntityEndpoint>
      const mockPost = authenticatedApi.post as MockedFunction<typeof authenticatedApi.post>

      mockCreateTestData.mockReturnValue({
        code: testCode,
        name: 'Test Arcana Entity',
        description: 'A test arcana for integration testing',
        short_text: 'Test short description',
        status: 'draft',
        is_active: true,
      })

      mockGetEntityEndpoint.mockReturnValue('/api/arcana')
      mockPost.mockResolvedValue(mockResponse)

      // Execute test
      const testData = createTestData(entityType, {
        code: testCode,
        name: 'Test Arcana Entity',
        description: 'A test arcana for integration testing',
        short_text: 'Test short description',
        status: 'draft',
        is_active: true,
      })

      const response = await authenticatedApi.post(getEntityEndpoint(entityType), testData)

      // Assertions
      expect(response.ok).toBe(true)
      expect(response.status).toBe(201)
      expect(response.data?.success).toBe(true)
      expect(response.data?.data.code).toBe(testCode)
      expect(response.data?.data.name).toBe('Test Arcana Entity')
      expect(response.data?.data.description).toBe('A test arcana for integration testing')
      expect(response.data?.data.status).toBe('draft')
      expect(response.data?.data.is_active).toBe(true)

      // Verify mocks were called correctly
      expect(mockPost).toHaveBeenCalledWith('/api/arcana', expect.objectContaining({
        code: testCode,
        name: 'Test Arcana Entity',
        status: 'draft',
        is_active: true,
      }))
    })
  })

  describe('Modify Test Entity Fields', () => {
    const createdEntityId = 1

    beforeEach(async () => {
      // Mock entity creation for modification tests
      const { authenticatedApi, getEntityEndpoint } = await import('../integration/helpers')
      const mockGetEntityEndpoint = getEntityEndpoint as MockedFunction<typeof getEntityEndpoint>

      mockGetEntityEndpoint.mockReturnValue(`/api/arcana/${createdEntityId}`)
    })

    it('should modify name field', async () => {
      const { authenticatedApi, getEntityEndpoint } = await import('../integration/helpers')
      const mockPatch = authenticatedApi.patch as MockedFunction<typeof authenticatedApi.patch>

      const mockResponse = {
        ok: true,
        status: 200,
        data: {
          success: true,
          data: {
            id: createdEntityId,
            name: 'Updated Test Arcana Name',
            status: 'draft',
            is_active: true,
          }
        }
      }

      mockPatch.mockResolvedValue(mockResponse)

      const updateData = { name: 'Updated Test Arcana Name' }
      const response = await authenticatedApi.patch(getEntityEndpoint(entityType, createdEntityId), updateData)

      expect(response.ok).toBe(true)
      expect(response.status).toBe(200)
      expect(response.data?.success).toBe(true)
      expect(response.data?.data.name).toBe('Updated Test Arcana Name')
      expect(mockPatch).toHaveBeenCalledWith(`/api/arcana/${createdEntityId}`, updateData)
    })

    it('should modify description field', async () => {
      const { authenticatedApi, getEntityEndpoint } = await import('../integration/helpers')
      const mockPatch = authenticatedApi.patch as MockedFunction<typeof authenticatedApi.patch>

      const mockResponse = {
        ok: true,
        status: 200,
        data: {
          success: true,
          data: {
            id: createdEntityId,
            description: 'Updated description for test arcana',
            status: 'draft',
            is_active: true,
          }
        }
      }

      mockPatch.mockResolvedValue(mockResponse)

      const updateData = { description: 'Updated description for test arcana' }
      const response = await authenticatedApi.patch(getEntityEndpoint(entityType, createdEntityId), updateData)

      expect(response.ok).toBe(true)
      expect(response.status).toBe(200)
      expect(response.data?.success).toBe(true)
      expect(response.data?.data.description).toBe('Updated description for test arcana')
      expect(mockPatch).toHaveBeenCalledWith(`/api/arcana/${createdEntityId}`, updateData)
    })

    it('should modify status field', async () => {
      const { authenticatedApi, getEntityEndpoint } = await import('../integration/helpers')
      const mockPatch = authenticatedApi.patch as MockedFunction<typeof authenticatedApi.patch>

      const mockResponse = {
        ok: true,
        status: 200,
        data: {
          success: true,
          data: {
            id: createdEntityId,
            status: 'approved',
            is_active: true,
          }
        }
      }

      mockPatch.mockResolvedValue(mockResponse)

      const updateData = { status: 'approved' }
      const response = await authenticatedApi.patch(getEntityEndpoint(entityType, createdEntityId), updateData)

      expect(response.ok).toBe(true)
      expect(response.status).toBe(200)
      expect(response.data?.success).toBe(true)
      expect(response.data?.data.status).toBe('approved')
      expect(mockPatch).toHaveBeenCalledWith(`/api/arcana/${createdEntityId}`, updateData)
    })

    it('should modify is_active field', async () => {
      const { authenticatedApi, getEntityEndpoint } = await import('../integration/helpers')
      const mockPatch = authenticatedApi.patch as MockedFunction<typeof authenticatedApi.patch>

      const mockResponse = {
        ok: true,
        status: 200,
        data: {
          success: true,
          data: {
            id: createdEntityId,
            status: 'draft',
            is_active: false,
          }
        }
      }

      mockPatch.mockResolvedValue(mockResponse)

      const updateData = { is_active: false }
      const response = await authenticatedApi.patch(getEntityEndpoint(entityType, createdEntityId), updateData)

      expect(response.ok).toBe(true)
      expect(response.status).toBe(200)
      expect(response.data?.success).toBe(true)
      expect(response.data?.data.is_active).toBe(false)
      expect(mockPatch).toHaveBeenCalledWith(`/api/arcana/${createdEntityId}`, updateData)
    })
  })

  describe('Create Fields in Spanish (es)', () => {
    it('should create arcana with Spanish fields', async () => {
      const { authenticatedApi, createTestData, getEntityEndpoint } = await import('../integration/helpers')
      const mockCreateTestData = createTestData as MockedFunction<typeof createTestData>
      const mockGetEntityEndpoint = getEntityEndpoint as MockedFunction<typeof getEntityEndpoint>
      const mockPost = authenticatedApi.post as MockedFunction<typeof authenticatedApi.post>

      const mockResponse = {
        ok: true,
        status: 201,
        data: {
          success: true,
          data: {
            id: 2,
            code: `${testCode}-es`,
            name: 'Arcano de Prueba',
            description: 'Un arcano de prueba para pruebas de integración',
            short_text: 'Descripción corta de prueba',
            lang: 'es',
            status: 'draft',
            is_active: true,
          }
        }
      }

      mockCreateTestData.mockReturnValue({
        code: `${testCode}-es`,
        name: 'Arcano de Prueba',
        description: 'Un arcano de prueba para pruebas de integración',
        short_text: 'Descripción corta de prueba',
        lang: 'es',
        status: 'draft',
        is_active: true,
      })

      mockGetEntityEndpoint.mockReturnValue('/api/arcana')
      mockPost.mockResolvedValue(mockResponse)

      const testData = createTestData(entityType, {
        code: `${testCode}-es`,
        name: 'Arcano de Prueba',
        description: 'Un arcano de prueba para pruebas de integración',
        short_text: 'Descripción corta de prueba',
        lang: 'es',
        status: 'draft',
        is_active: true,
      })

      const response = await authenticatedApi.post(getEntityEndpoint(entityType), testData)

      expect(response.ok).toBe(true)
      expect(response.status).toBe(201)
      expect(response.data?.success).toBe(true)
      expect(response.data?.data.name).toBe('Arcano de Prueba')
      expect(response.data?.data.description).toBe('Un arcano de prueba para pruebas de integración')
      expect(response.data?.data.lang).toBe('es')
    })
  })

  describe('Delete Test Entity', () => {
    const createdEntityId = 1

    beforeEach(async () => {
      const { getEntityEndpoint } = await import('../integration/helpers')
      const mockGetEntityEndpoint = getEntityEndpoint as MockedFunction<typeof getEntityEndpoint>
      mockGetEntityEndpoint.mockReturnValue(`/api/arcana/${createdEntityId}`)
    })

    it('should delete the test arcana entity', async () => {
      const { authenticatedApi, getEntityEndpoint } = await import('../integration/helpers')
      const mockDelete = authenticatedApi.delete as MockedFunction<typeof authenticatedApi.delete>

      const mockResponse = {
        ok: true,
        status: 200,
        data: {
          success: true,
          data: null
        }
      }

      mockDelete.mockResolvedValue(mockResponse)

      const response = await authenticatedApi.delete(getEntityEndpoint(entityType, createdEntityId))

      expect(response.ok).toBe(true)
      expect(response.status).toBe(200)
      expect(response.data?.success).toBe(true)
      expect(mockDelete).toHaveBeenCalledWith(`/api/arcana/${createdEntityId}`)
    })
  })
})
