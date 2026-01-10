// tests/integration/arcana.test.ts
import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest'
import { authenticatedApi, createTestData, getEntityEndpoint, cleanupTestData, setupAuthenticatedApi } from './helpers'

describe('Arcana Integration Tests', () => {
  const entityType = 'arcana'
  const testCode = `test-arcana-${Date.now()}`

  beforeAll(async () => {
    await setupAuthenticatedApi()
  }, 30000)

  beforeEach(async () => {
    await cleanupTestData(entityType, testCode)
  })

  afterEach(async () => {
    await cleanupTestData(entityType, testCode)
  })

  describe('Create Test Entity', () => {
    it('should create arcana "Test" with multiple fields', async () => {
      const testData = createTestData(entityType, {
        code: testCode,
        name: 'Test Arcana Entity',
        description: 'A test arcana for integration testing',
        short_text: 'Test short description',
        status: 'draft',
        is_active: true,
      })

      const response = await authenticatedApi.post(getEntityEndpoint(entityType), testData)

      expect(response.ok).toBe(true)
      expect(response.status).toBe(200)
      expect(response.data).toBeDefined()
      expect(response.data!.success).toBe(true)
      expect((response.data!.data as any).code).toBe(testCode)
      expect((response.data!.data as any).name).toBe('Test Arcana Entity')
      expect((response.data!.data as any).description).toBe('A test arcana for integration testing')
      expect((response.data!.data as any).status).toBe('draft')
      expect((response.data!.data as any).is_active).toBe(true)
    })
  })

  describe('Modify Test Entity Fields', () => {
    let createdEntityId: number
    const modifyTestCode = `${testCode}-modify`

    beforeEach(async () => {
      await cleanupTestData(entityType, modifyTestCode)
      
      // Create the test entity first
      const testData = createTestData(entityType, {
        code: modifyTestCode,
        name: 'Test Arcana Entity',
        description: 'A test arcana for integration testing',
        short_text: 'Test short description',
        status: 'draft',
        is_active: true,
      })

      const createResponse = await authenticatedApi.post(getEntityEndpoint(entityType), testData)
      expect(createResponse.ok).toBe(true)
      createdEntityId = createResponse.data.data.id
    })

    afterEach(async () => {
      await cleanupTestData(entityType, modifyTestCode)
    })

    it('should modify name field', async () => {
      const updateData = {
        name: 'Updated Test Arcana Name',
      }

      const response = await authenticatedApi.patch(getEntityEndpoint(entityType, createdEntityId), updateData)

      expect(response.ok).toBe(true)
      expect(response.status).toBe(200)
      expect(response.data.success).toBe(true)
      expect(response.data.data.name).toBe('Updated Test Arcana Name')
    })

    it('should modify description field', async () => {
      const updateData = {
        description: 'Updated description for test arcana',
      }

      const response = await authenticatedApi.patch(getEntityEndpoint(entityType, createdEntityId), updateData)

      expect(response.ok).toBe(true)
      expect(response.status).toBe(200)
      expect(response.data.success).toBe(true)
      expect(response.data.data.description).toBe('Updated description for test arcana')
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
        name: 'Test Arcana Entity ES',
        description: 'A test arcana for Spanish integration testing',
        short_text: 'Test short description ES',
        status: 'draft',
        is_active: true,
      })

      const createResponse = await authenticatedApi.post(getEntityEndpoint(entityType), testData)
      expect(createResponse.ok).toBe(true)
      createdEntityId = createResponse.data!.data.id
    })

    it('should add Spanish fields via update', async () => {
      const spanishData = {
        name: 'Arcana de Prueba',
        description: 'Una arcana de prueba para pruebas de integración',
        short_text: 'Descripción corta de prueba',
        lang: 'es',
      }

      const response = await authenticatedApi.patch(getEntityEndpoint(entityType, createdEntityId), spanishData)

      expect(response.ok).toBe(true)
      expect(response.status).toBe(200)
      expect(response.data!.success).toBe(true)
      expect((response.data!.data as any).name).toBe('Arcana de Prueba')
      expect((response.data!.data as any).description).toBe('Una arcana de prueba para pruebas de integración')
      expect((response.data!.data as any).language_code_resolved).toBe('es')
    })
  })

  describe('Delete Test Entity', () => {
    let createdEntityId: number

    beforeEach(async () => {
      // Create the test entity first
      const testData = createTestData(entityType, {
        code: testCode,
        name: 'Test Arcana Entity',
        description: 'A test arcana for integration testing',
        status: 'draft',
        is_active: true,
      })

      const createResponse = await authenticatedApi.post(getEntityEndpoint(entityType), testData)
      expect(createResponse.ok).toBe(true)
      createdEntityId = createResponse.data!.data.id
    })

    it('should delete the test arcana entity', async () => {
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
