// tests/integration/facet.test.ts
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest'
import { authenticatedApi, createTestData, getEntityEndpoint, cleanupTestData, setupAuthenticatedApi } from './helpers'

describe('Facet Integration Tests', () => {
  const entityType = 'facet'
  const testCode = `test-facet-${Date.now()}`
  let arcanaId: number
  let arcanaCode: string

  beforeAll(async () => {
    await setupAuthenticatedApi()

    // Create a unique arcana for this test
    arcanaCode = `test-arcana-${Date.now()}`
    const arcanaData = createTestData('arcana', {
      code: arcanaCode,
      name: 'Test Arcana for Facet',
      status: 'draft',
      is_active: true,
    })

    const arcanaResponse = await authenticatedApi.post(getEntityEndpoint('arcana'), arcanaData)
    expect(arcanaResponse.ok).toBe(true)
    arcanaId = arcanaResponse.data.data.id
  })

  beforeEach(async () => {
    await cleanupTestData(entityType, testCode)
  })

  afterEach(async () => {
    await cleanupTestData(entityType, testCode)
  })

  afterAll(async () => {
    // Cleanup the arcana created for this test
    await cleanupTestData('arcana', arcanaCode)
  })

  describe('Create Test Entity', () => {
    it('should create facet "Test" with multiple fields', async () => {
      const testData = createTestData(entityType, {
        code: testCode,
        name: 'Test Facet Entity',
        description: 'A test facet for integration testing',
        short_text: 'Test short description',
        status: 'draft',
        is_active: true,
        arcana_id: arcanaId,
      })

      const response = await authenticatedApi.post(getEntityEndpoint(entityType), testData)

      expect(response.ok).toBe(true)
      expect(response.status).toBe(200)
      expect(response.data).toBeDefined()
      expect(response.data.success).toBe(true)
      expect(response.data.data.code).toBe(testCode)
      expect(response.data.data.name).toBe('Test Facet Entity')
      expect(response.data.data.description).toBe('A test facet for integration testing')
      expect(response.data.data.status).toBe('draft')
      expect(response.data.data.is_active).toBe(true)
      expect(response.data.data.arcana_id).toBe(arcanaId)
    })
  })

  describe('Modify Test Entity Fields', () => {
    let createdEntityId: number

    beforeEach(async () => {
      // Create the test entity first
      const testData = createTestData(entityType, {
        code: testCode,
        name: 'Test Facet Entity',
        description: 'A test facet for integration testing',
        short_text: 'Test short description',
        status: 'draft',
        is_active: true,
        arcana_id: arcanaId,
      })

      const createResponse = await authenticatedApi.post(getEntityEndpoint(entityType), testData)
      expect(createResponse.ok).toBe(true)
      createdEntityId = createResponse.data.data.id
    })

    it('should modify name field', async () => {
      const updateData = {
        name: 'Updated Test Facet Name',
      }

      const response = await authenticatedApi.patch(getEntityEndpoint(entityType, createdEntityId), updateData)

      expect(response.ok).toBe(true)
      expect(response.status).toBe(200)
      expect(response.data.success).toBe(true)
      expect(response.data.data.name).toBe('Updated Test Facet Name')
    })

    it('should modify description field', async () => {
      const updateData = {
        description: 'Updated description for test facet',
      }

      const response = await authenticatedApi.patch(getEntityEndpoint(entityType, createdEntityId), updateData)

      expect(response.ok).toBe(true)
      expect(response.status).toBe(200)
      expect(response.data.success).toBe(true)
      expect(response.data.data.description).toBe('Updated description for test facet')
    })

    it('should modify short_text field', async () => {
      const updateData = {
        short_text: 'Updated short description',
      }

      const response = await authenticatedApi.patch(getEntityEndpoint(entityType, createdEntityId), updateData)

      expect(response.ok).toBe(true)
      expect(response.status).toBe(200)
      expect(response.data.success).toBe(true)
      expect(response.data.data.short_text).toBe('Updated short description')
    })

    it('should modify status field', async () => {
      const updateData = {
        status: 'approved',
      }

      const response = await authenticatedApi.patch(getEntityEndpoint(entityType, createdEntityId), updateData)

      expect(response.ok).toBe(true)
      expect(response.status).toBe(200)
      expect(response.data.success).toBe(true)
      expect(response.data.data.status).toBe('approved')
    })

    it('should modify is_active field', async () => {
      const updateData = {
        is_active: false,
      }

      const response = await authenticatedApi.patch(getEntityEndpoint(entityType, createdEntityId), updateData)

      expect(response.ok).toBe(true)
      expect(response.status).toBe(200)
      expect(response.data.success).toBe(true)
      expect(response.data.data.is_active).toBe(false)
    })
  })

  describe('Create Fields in Spanish (es)', () => {
    let createdEntityId: number
    const spanishTestCode = `${testCode}-es-${Date.now()}`

    beforeEach(async () => {
      // Create the test entity in English first
      const testData = createTestData(entityType, {
        code: spanishTestCode,
        name: 'Test Facet Entity ES',
        description: 'A test facet for Spanish integration testing',
        short_text: 'Test short description ES',
        status: 'draft',
        is_active: true,
        arcana_id: arcanaId,
      })

      const createResponse = await authenticatedApi.post(getEntityEndpoint(entityType), testData)
      expect(createResponse.ok).toBe(true)
      createdEntityId = createResponse.data!.data.id
    })

    it('should add Spanish fields via update', async () => {
      const spanishData = {
        name: 'Faceta de Prueba',
        description: 'Una faceta de prueba para pruebas de integración',
        short_text: 'Descripción corta de prueba',
        lang: 'es',
      }

      const response = await authenticatedApi.patch(getEntityEndpoint(entityType, createdEntityId), spanishData)

      expect(response.ok).toBe(true)
      expect(response.status).toBe(200)
      expect(response.data!.success).toBe(true)
      expect((response.data!.data as any).name).toBe('Faceta de Prueba')
      expect((response.data!.data as any).description).toBe('Una faceta de prueba para pruebas de integración')
      expect((response.data!.data as any).language_code_resolved).toBe('es')
      expect((response.data!.data as any).arcana_id).toBe(arcanaId)
    })
  })

  describe('Delete Test Entity', () => {
    let createdEntityId: number

    beforeEach(async () => {
      // Create the test entity first
      const testData = createTestData(entityType, {
        code: testCode,
        name: 'Test Facet Entity',
        description: 'A test facet for integration testing',
        status: 'draft',
        is_active: true,
        arcana_id: arcanaId,
      })

      const createResponse = await authenticatedApi.post(getEntityEndpoint(entityType), testData)
      expect(createResponse.ok).toBe(true)
      createdEntityId = createResponse.data.data.id
    })

    it('should delete the test facet entity', async () => {
      const response = await authenticatedApi.delete(getEntityEndpoint(entityType, createdEntityId))

      expect(response.ok).toBe(true)
      expect(response.status).toBe(200)
      expect(response.data.success).toBe(true)

      // Verify the entity was deleted
      const getResponse = await authenticatedApi.get(getEntityEndpoint(entityType, createdEntityId))
      expect(getResponse.status).toBe(404)
    })
  })
})
