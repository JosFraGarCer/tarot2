// tests/integration/tag.test.ts
import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest'
import { authenticatedApi, createTestData, getEntityEndpoint, cleanupTestData, setupAuthenticatedApi } from './helpers'

describe('Tag Integration Tests', () => {
  const entityType = 'tag'
  const testCode = `test-tag-${Date.now()}`

  beforeAll(async () => {
    await setupAuthenticatedApi()
  })

  beforeEach(async () => {
    await cleanupTestData(entityType, testCode)
  })

  afterEach(async () => {
    await cleanupTestData(entityType, testCode)
  })

  describe('Create Test Entity', () => {
    it('should create tag "Test" with multiple fields', async () => {
      const testData = createTestData(entityType, {
        code: testCode,
        name: 'Test Tag Entity',
        description: 'A test tag for integration testing',
        short_text: 'Test short description',
        category: 'test_category',
        is_active: true,
      })

      const response = await authenticatedApi.post(getEntityEndpoint(entityType), testData)

      expect(response.ok).toBe(true)
      expect(response.status).toBe(200)
      expect(response.data).toBeDefined()
      expect(response.data.success).toBe(true)
      expect(response.data.data.code).toBe(testCode)
      expect(response.data.data.name).toBe('Test Tag Entity')
      expect(response.data.data.description).toBe('A test tag for integration testing')
      expect(response.data.data.category).toBe('test')
      expect(response.data.data.is_active).toBe(true)
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
        name: 'Test Tag Entity',
        description: 'A test tag for integration testing',
        short_text: 'Test short description',
        status: 'draft',
        is_active: true,
        category: 'test',
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
        name: 'Updated Test Tag Name',
      }

      const response = await authenticatedApi.patch(getEntityEndpoint(entityType, createdEntityId), updateData)

      expect(response.ok).toBe(true)
      expect(response.status).toBe(200)
      expect(response.data.success).toBe(true)
      expect(response.data.data.name).toBe('Updated Test Tag Name')
    })

    it('should modify description field', async () => {
      const updateData = {
        description: 'Updated description for test tag',
      }

      const response = await authenticatedApi.patch(getEntityEndpoint(entityType, createdEntityId), updateData)

      expect(response.ok).toBe(true)
      expect(response.status).toBe(200)
      expect(response.data.success).toBe(true)
      expect(response.data.data.description).toBe('Updated description for test tag')
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

    it('should modify category field', async () => {
      const updateData = {
        category: 'updated_category',
      }

      const response = await authenticatedApi.patch(getEntityEndpoint(entityType, createdEntityId), updateData)

      expect(response.ok).toBe(true)
      expect(response.status).toBe(200)
      expect(response.data.success).toBe(true)
      expect(response.data.data.category).toBe('updated_category')
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
        name: 'Test Tag Entity ES',
        description: 'A test tag for Spanish integration testing',
        short_text: 'Test short description ES',
        category: 'test_category',
        is_active: true,
      })

      const createResponse = await authenticatedApi.post(getEntityEndpoint(entityType), testData)
      expect(createResponse.ok).toBe(true)
      createdEntityId = createResponse.data!.data.id
    })

    it('should add Spanish fields via update', async () => {
      const spanishData = {
        name: 'Etiqueta de Prueba',
        description: 'Una etiqueta de prueba para pruebas de integración',
        short_text: 'Descripción corta de prueba',
        category: 'categoria_prueba',
        lang: 'es',
      }

      const response = await authenticatedApi.patch(`${getEntityEndpoint(entityType, createdEntityId)}?lang=es`, spanishData)

      expect(response.ok).toBe(true)
      expect(response.status).toBe(200)
      expect(response.data!.success).toBe(true)
      expect((response.data!.data as any).name).toBe('Etiqueta de Prueba')
      expect((response.data!.data as any).description).toBe('Una etiqueta de prueba para pruebas de integración')
      expect((response.data!.data as any).category).toBe('categoria_prueba')
      expect((response.data!.data as any).language_code_resolved).toBe('es')
    })
  })

  describe('Delete Test Entity', () => {
    let createdEntityId: number

    beforeEach(async () => {
      // Create the test entity first
      const testData = createTestData(entityType, {
        code: testCode,
        name: 'Test Tag Entity',
        description: 'A test tag for integration testing',
        category: 'test_category',
        is_active: true,
      })

      const createResponse = await authenticatedApi.post(getEntityEndpoint(entityType), testData)
      expect(createResponse.ok).toBe(true)
      createdEntityId = createResponse.data.data.id
    })

    it('should delete the test tag entity', async () => {
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
