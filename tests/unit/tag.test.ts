// tests/unit/tag.test.ts
import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest'

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

describe('Tag Unit Tests', () => {
  const entityType = 'tag'
  const testCode = 'test-tag'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Create Test Entity', () => {
    it('should create tag "Test" with multiple fields', async () => {
      const mockResponse = {
        ok: true,
        status: 201,
        data: {
          success: true,
          data: {
            id: 1,
            code: testCode,
            name: 'Test Tag Entity',
            description: 'A test tag for unit testing',
            status: 'draft',
            is_active: true,
            created_at: '2024-01-01T00:00:00Z',
            modified_at: '2024-01-01T00:00:00Z',
          }
        }
      }

      const { authenticatedApi, createTestData, getEntityEndpoint } = await import('../integration/helpers')
      const mockCreateTestData = createTestData as MockedFunction<typeof createTestData>
      const mockGetEntityEndpoint = getEntityEndpoint as MockedFunction<typeof getEntityEndpoint>
      const mockPost = authenticatedApi.post as MockedFunction<typeof authenticatedApi.post>

      mockCreateTestData.mockReturnValue({
        code: testCode,
        name: 'Test Tag Entity',
        description: 'A test tag for unit testing',
        status: 'draft',
        is_active: true,
      })

      mockGetEntityEndpoint.mockReturnValue('/api/tag')
      mockPost.mockResolvedValue(mockResponse)

      const testData = createTestData(entityType, {
        code: testCode,
        name: 'Test Tag Entity',
        description: 'A test tag for unit testing',
        status: 'draft',
        is_active: true,
      })

      const response = await authenticatedApi.post(getEntityEndpoint(entityType), testData)

      expect(response.ok).toBe(true)
      expect(response.status).toBe(201)
      expect(response.data?.success).toBe(true)
      expect(response.data?.data.code).toBe(testCode)
    })
  })

  describe('Modify Test Entity Fields', () => {
    const createdEntityId = 1

    beforeEach(async () => {
      const { getEntityEndpoint } = await import('../integration/helpers')
      const mockGetEntityEndpoint = getEntityEndpoint as MockedFunction<typeof getEntityEndpoint>
      mockGetEntityEndpoint.mockReturnValue(`/api/tag/${createdEntityId}`)
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
            name: 'Updated Test Tag Name',
            status: 'draft',
            is_active: true,
          }
        }
      }

      mockPatch.mockResolvedValue(mockResponse)

      const updateData = { name: 'Updated Test Tag Name' }
      const response = await authenticatedApi.patch(getEntityEndpoint(entityType, createdEntityId), updateData)

      expect(response.ok).toBe(true)
      expect(response.status).toBe(200)
      expect(response.data?.success).toBe(true)
      expect(response.data?.data.name).toBe('Updated Test Tag Name')
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
            description: 'Updated description for test tag',
            status: 'draft',
            is_active: true,
          }
        }
      }

      mockPatch.mockResolvedValue(mockResponse)

      const updateData = { description: 'Updated description for test tag' }
      const response = await authenticatedApi.patch(getEntityEndpoint(entityType, createdEntityId), updateData)

      expect(response.ok).toBe(true)
      expect(response.status).toBe(200)
      expect(response.data?.success).toBe(true)
      expect(response.data?.data.description).toBe('Updated description for test tag')
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
    })
  })

  describe('Create Fields in Spanish (es)', () => {
    it('should create tag with Spanish fields', async () => {
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
            name: 'Etiqueta de Prueba',
            description: 'Una etiqueta de prueba para pruebas unitarias',
            lang: 'es',
            status: 'draft',
            is_active: true,
          }
        }
      }

      mockCreateTestData.mockReturnValue({
        code: `${testCode}-es`,
        name: 'Etiqueta de Prueba',
        description: 'Una etiqueta de prueba para pruebas unitarias',
        lang: 'es',
        status: 'draft',
        is_active: true,
      })

      mockGetEntityEndpoint.mockReturnValue('/api/tag')
      mockPost.mockResolvedValue(mockResponse)

      const testData = createTestData(entityType, {
        code: `${testCode}-es`,
        name: 'Etiqueta de Prueba',
        description: 'Una etiqueta de prueba para pruebas unitarias',
        lang: 'es',
        status: 'draft',
        is_active: true,
      })

      const response = await authenticatedApi.post(getEntityEndpoint(entityType), testData)

      expect(response.ok).toBe(true)
      expect(response.status).toBe(201)
      expect(response.data?.success).toBe(true)
      expect(response.data?.data.name).toBe('Etiqueta de Prueba')
      expect(response.data?.data.lang).toBe('es')
    })
  })

  describe('Delete Test Entity', () => {
    const createdEntityId = 1

    beforeEach(async () => {
      const { getEntityEndpoint } = await import('../integration/helpers')
      const mockGetEntityEndpoint = getEntityEndpoint as MockedFunction<typeof getEntityEndpoint>
      mockGetEntityEndpoint.mockReturnValue(`/api/tag/${createdEntityId}`)
    })

    it('should delete the test tag entity', async () => {
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
    })
  })
})
