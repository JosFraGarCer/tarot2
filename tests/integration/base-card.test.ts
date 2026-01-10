// tests/integration/base-card.test.ts
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest'
import { authenticatedApi, createTestData, getEntityEndpoint, cleanupTestData, setupAuthenticatedApi } from './helpers'

describe('BaseCard Integration Tests', () => {
  const entityType = 'base-card'
  const testCode = `test-base-card-${Date.now()}`
  let cardTypeId: number
  let cardTypeCode: string

  beforeAll(async () => {
    await setupAuthenticatedApi()

    // Create a unique cardtype for this test
    cardTypeCode = `test-cardtype-${Date.now()}`
    const cardTypeData = createTestData('card_type', {
      code: cardTypeCode,
      name: 'Test CardType for BaseCard',
      status: 'draft',
      is_active: true,
    })

    const cardTypeResponse = await authenticatedApi.post(getEntityEndpoint('card_type'), cardTypeData)
    expect(cardTypeResponse.ok).toBe(true)
    cardTypeId = cardTypeResponse.data.data.id
  })

  beforeEach(async () => {
    await cleanupTestData(entityType, testCode)
  })

  afterEach(async () => {
    await cleanupTestData(entityType, testCode)
  })

  afterAll(async () => {
    // Cleanup the cardtype created for this test
    await cleanupTestData('card_type', cardTypeCode)
  })

  describe('Create Test Entity', () => {
    it('should create base-card "Test" with multiple fields', async () => {
      const testData = createTestData(entityType, {
        code: testCode,
        name: 'Test BaseCard Entity',
        description: 'A test base-card for integration testing',
        short_text: 'Test short description',
        status: 'draft',
        is_active: true,
        card_type_id: cardTypeId,
        card_family: 'major_arcana',
      })

      const response = await authenticatedApi.post(getEntityEndpoint(entityType), testData)

      expect(response.ok).toBe(true)
      expect(response.status).toBe(200)
      expect(response.data).toBeDefined()
      expect(response.data.success).toBe(true)
      expect(response.data.data.code).toBe(testCode)
      expect(response.data.data.name).toBe('Test BaseCard Entity')
      expect(response.data.data.description).toBe('A test base-card for integration testing')
      expect(response.data.data.status).toBe('draft')
      expect(response.data.data.is_active).toBe(true)
      expect(response.data.data.card_type_id).toBe(cardTypeId)
      expect(response.data.data.card_family).toBe('major_arcana')
    })
  })

  describe('Modify Test Entity Fields', () => {
    let createdEntityId: number

    beforeEach(async () => {
      // Create the test entity first
      const testData = createTestData(entityType, {
        code: testCode,
        name: 'Test BaseCard Entity',
        description: 'A test base-card for integration testing',
        short_text: 'Test short description',
        status: 'draft',
        is_active: true,
        card_type_id: cardTypeId,
        card_family: 'major_arcana',
      })

      const createResponse = await authenticatedApi.post(getEntityEndpoint(entityType), testData)
      expect(createResponse.ok).toBe(true)
      createdEntityId = createResponse.data.data.id
    })

    it('should modify name field', async () => {
      const updateData = {
        name: 'Updated Test BaseCard Name',
      }

      const response = await authenticatedApi.patch(getEntityEndpoint(entityType, createdEntityId), updateData)

      expect(response.ok).toBe(true)
      expect(response.status).toBe(200)
      expect(response.data.success).toBe(true)
      expect(response.data.data.name).toBe('Updated Test BaseCard Name')
    })

    it('should modify description field', async () => {
      const updateData = {
        description: 'Updated description for test base-card',
      }

      const response = await authenticatedApi.patch(getEntityEndpoint(entityType, createdEntityId), updateData)

      expect(response.ok).toBe(true)
      expect(response.status).toBe(200)
      expect(response.data.success).toBe(true)
      expect(response.data.data.description).toBe('Updated description for test base-card')
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

    it('should modify card_family field', async () => {
      const updateData = {
        card_family: 'minor_arcana',
      }

      const response = await authenticatedApi.patch(getEntityEndpoint(entityType, createdEntityId), updateData)

      expect(response.ok).toBe(true)
      expect(response.status).toBe(200)
      expect(response.data.success).toBe(true)
      expect(response.data.data.card_family).toBe('minor_arcana')
    })
  })

  describe('Create Fields in Spanish (es)', () => {
    let createdEntityId: number
    const spanishTestCode = `${testCode}-es-${Date.now()}`

    beforeEach(async () => {
      // Create the test entity in English first
      const testData = createTestData(entityType, {
        code: spanishTestCode,
        name: 'Test BaseCard Entity ES',
        description: 'A test base-card for Spanish integration testing',
        short_text: 'Test short description ES',
        status: 'draft',
        is_active: true,
        card_type_id: cardTypeId,
        card_family: 'major_arcana',
      })

      const createResponse = await authenticatedApi.post(getEntityEndpoint(entityType), testData)
      expect(createResponse.ok).toBe(true)
      createdEntityId = createResponse.data!.data.id
    })

    it('should add Spanish fields via update', async () => {
      const spanishData = {
        name: 'Carta Base de Prueba',
        description: 'Una carta base de prueba para pruebas de integración',
        short_text: 'Descripción corta de prueba',
        lang: 'es',
      }

      const response = await authenticatedApi.patch(getEntityEndpoint(entityType, createdEntityId), spanishData)

      expect(response.ok).toBe(true)
      expect(response.status).toBe(200)
      expect(response.data!.success).toBe(true)
      expect((response.data!.data as any).name).toBe('Carta Base de Prueba')
      expect((response.data!.data as any).description).toBe('Una carta base de prueba para pruebas de integración')
      expect((response.data!.data as any).language_code_resolved).toBe('es')
      expect((response.data!.data as any).card_type_id).toBe(cardTypeId)
    })
  })

  describe('Delete Test Entity', () => {
    let createdEntityId: number

    beforeEach(async () => {
      // Create the test entity first
      const testData = createTestData(entityType, {
        code: testCode,
        name: 'Test BaseCard Entity',
        description: 'A test base-card for integration testing',
        status: 'draft',
        is_active: true,
        card_type_id: cardTypeId,
        card_family: 'major_arcana',
      })

      const createResponse = await authenticatedApi.post(getEntityEndpoint(entityType), testData)
      expect(createResponse.ok).toBe(true)
      createdEntityId = createResponse.data.data.id
    })

    it('should delete the test base-card entity', async () => {
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
