// tests/integration/cardtype.test.ts
import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest'
import { authenticatedApi, createTestData, getEntityEndpoint, cleanupTestData, setupAuthenticatedApi } from './helpers'

describe('CardType Integration Tests', () => {
  const entityType = 'card_type'
  const testCode = `test-cardtype-${Date.now()}`

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
    it('should create cardtype "Test" with multiple fields', async () => {
      const testData = createTestData(entityType, {
        code: testCode,
        name: 'Test CardType Entity',
        description: 'A test cardtype for integration testing',
        short_text: 'Test short description',
        status: 'draft',
        is_active: true,
      })

      const response = await authenticatedApi.post(getEntityEndpoint(entityType), testData)

      console.log('Create response:', JSON.stringify(response, null, 2))
      expect(response.ok).toBe(true)
      expect(response.status).toBe(200)
      expect(response.data).toBeDefined()
      expect(response.data.success).toBe(true)
      expect(response.data.data.code).toBe(testCode)
      expect(response.data.data.name).toBe('Test CardType Entity')
      expect(response.data.data.description).toBe('A test cardtype for integration testing')
      expect(response.data.data.status).toBe('draft')
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
        name: 'Test CardType Entity',
        description: 'A test cardtype for integration testing',
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
        name: 'Updated Test CardType Name',
        lang: 'en',
      }

      const response = await authenticatedApi.patch(getEntityEndpoint(entityType, createdEntityId), updateData)

      console.log('Modify name response:', JSON.stringify(response, null, 2))
      expect(response.ok).toBe(true)
      expect(response.status).toBe(200)
      expect(response.data.success).toBe(true)
      expect(response.data.data.name).toBe('Updated Test CardType Name')
    })

    it('should modify description field', async () => {
      const updateData = {
        description: 'Updated description for test cardtype',
      }

      const response = await authenticatedApi.patch(getEntityEndpoint(entityType, createdEntityId), updateData)

      expect(response.ok).toBe(true)
      expect(response.status).toBe(200)
      expect(response.data.success).toBe(true)
      expect(response.data.data.description).toBe('Updated description for test cardtype')
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
    const spanishTestCode = `${testCode}-es`

    beforeEach(async () => {
      // Create the test entity in English first
      const testData = createTestData(entityType, {
        code: spanishTestCode,
        name: 'Test CardType Entity ES',
        description: 'A test cardtype for Spanish integration testing',
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
        name: 'Tipo de Carta de Prueba',
        description: 'Un tipo de carta de prueba para pruebas de integración',
        short_text: 'Descripción corta de prueba',
        lang: 'es',
      }

      const response = await authenticatedApi.patch(getEntityEndpoint(entityType, createdEntityId), spanishData)

      expect(response.ok).toBe(true)
      expect(response.status).toBe(200)
      expect(response.data!.success).toBe(true)
      expect((response.data!.data as any).name).toBe('Tipo de Carta de Prueba')
      expect((response.data!.data as any).description).toBe('Un tipo de carta de prueba para pruebas de integración')
      expect((response.data!.data as any).language_code_resolved).toBe('es')
    })
  })

  describe('Delete Test Entity', () => {
    let createdEntityId: number
    const deleteTestCode = `${testCode}-delete`

    beforeEach(async () => {
      // Create the test entity first
      const testData = createTestData(entityType, {
        code: deleteTestCode,
        name: 'Test CardType Entity',
        description: 'A test cardtype for integration testing',
        short_text: 'Test short description',
        status: 'draft',
        is_active: true,
      })

      const createResponse = await authenticatedApi.post(getEntityEndpoint(entityType), testData)
      expect(createResponse.ok).toBe(true)
      createdEntityId = createResponse.data.data.id
    })

    it('should delete the test cardtype entity', async () => {
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
