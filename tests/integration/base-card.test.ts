// tests/integration/base-card.test.ts
import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest'
import { authenticatedApi, createTestData, getEntityEndpoint, cleanupTestData, setupAuthenticatedApi } from './helpers'

describe('BaseCard Integration Tests', () => {
  const entityType = 'base-card'
  const testCode = `test-base-card-${Date.now()}`

  beforeAll(async () => {
    await setupAuthenticatedApi()
  })

  beforeEach(async () => {
    await cleanupTestData(entityType, testCode)
  })

  afterEach(async () => {
    await cleanupTestData(entityType, testCode)
  })

  it('should create base-card with multiple fields using existing card_type', async () => {
    // First get an existing card_type, or create one if none exist
    const cardTypeResponse = await authenticatedApi.get(getEntityEndpoint('card_type'))
    let cardTypeId: number

    if (!cardTypeResponse.data.data || cardTypeResponse.data.data.length === 0) {
      // Create a card_type for this test
      const cardTypeData = createTestData('card_type', {
        code: `dep-cardtype-${Date.now()}`,
        name: 'Dependency CardType',
        description: 'CardType created as dependency for base-card test',
        short_text: 'Dep',
        status: 'published',
        is_active: true,
      })

      const createCardTypeResponse = await authenticatedApi.post(getEntityEndpoint('card_type'), cardTypeData)
      expect(createCardTypeResponse.ok).toBe(true)
      cardTypeId = createCardTypeResponse.data.data.id
    } else {
      cardTypeId = cardTypeResponse.data.data[0].id
    }

    const testData = createTestData(entityType, {
      code: testCode,
      name: 'Test BaseCard Entity',
      description: 'A test base-card for integration testing',
      short_text: 'Test short description',
      status: 'draft',
      is_active: true,
      card_type_id: cardTypeId,
    })

    const response = await authenticatedApi.post(getEntityEndpoint(entityType), testData)

    console.log('🔍 BASE-CARD CREATE DEBUG:', {
      ok: response.ok,
      status: response.status,
      data: response.data,
      testData: JSON.stringify(testData, null, 2)
    })

    expect(response.ok).toBe(true)
    expect(response.status).toBe(200)
    expect(response.data).toBeDefined()
    expect(response.data.success).toBe(true)
    expect(response.data.data.code).toBe(testCode)
    expect(response.data.data.name).toBe('Test BaseCard Entity')
    expect(response.data.data.description).toBe('A test base-card for integration testing')
    expect(response.data.data.card_type_id).toBe(cardTypeId)
  })

  it('should edit multiple fields of base-card', async () => {
    // First get an existing card_type, or create one if none exist
    const cardTypeResponse = await authenticatedApi.get(getEntityEndpoint('card_type'))
    let cardTypeId: number

    if (!cardTypeResponse.data.data || cardTypeResponse.data.data.length === 0) {
      // Create a card_type for this test
      const cardTypeData = createTestData('card_type', {
        code: `dep-cardtype-${Date.now()}`,
        name: 'Dependency CardType',
        description: 'CardType created as dependency for base-card test',
        short_text: 'Dep',
        status: 'published',
        is_active: true,
      })

      const createCardTypeResponse = await authenticatedApi.post(getEntityEndpoint('card_type'), cardTypeData)
      expect(createCardTypeResponse.ok).toBe(true)
      cardTypeId = createCardTypeResponse.data.data.id
    } else {
      cardTypeId = cardTypeResponse.data.data[0].id
    }

    // First create the entity
    const createData = createTestData(entityType, {
      code: testCode,
      name: 'Test BaseCard Entity',
      description: 'A test base-card for integration testing',
      short_text: 'Test short description',
      status: 'draft',
      is_active: true,
      card_type_id: cardTypeId,
      card_family: 'major_arcana', // Required field
    })

    const createResponse = await authenticatedApi.post(getEntityEndpoint(entityType), createData)
    expect(createResponse.ok).toBe(true)
    const createdEntityId = createResponse.data.data.id

    // Edit name field
    const updateData1 = {
      name: 'Updated Test BaseCard Name',
      lang: 'en',
    }
    const response1 = await authenticatedApi.patch(getEntityEndpoint(entityType, createdEntityId), updateData1)
    expect(response1.ok).toBe(true)

    // Edit description field
    const updateData2 = {
      description: 'Updated description for test base-card',
      lang: 'en',
    }
    const response2 = await authenticatedApi.patch(getEntityEndpoint(entityType, createdEntityId), updateData2)
    expect(response2.ok).toBe(true)

    // Edit status field
    const updateData3 = {
      status: 'published',
      lang: 'en',
    }
    const response3 = await authenticatedApi.patch(getEntityEndpoint(entityType, createdEntityId), updateData3)
    expect(response3.ok).toBe(true)
  })

  it('should create Spanish translations for base-card fields', async () => {
    // First get an existing card_type, or create one if none exist
    const cardTypeResponse = await authenticatedApi.get(getEntityEndpoint('card_type'))
    let cardTypeId: number

    if (!cardTypeResponse.data.data || cardTypeResponse.data.data.length === 0) {
      // Create a card_type for this test
      const cardTypeData = createTestData('card_type', {
        code: `dep-cardtype-${Date.now()}`,
        name: 'Dependency CardType',
        description: 'CardType created as dependency for base-card test',
        short_text: 'Dep',
        status: 'published',
        is_active: true,
      })

      const createCardTypeResponse = await authenticatedApi.post(getEntityEndpoint('card_type'), cardTypeData)
      expect(createCardTypeResponse.ok).toBe(true)
      cardTypeId = createCardTypeResponse.data.data.id
    } else {
      cardTypeId = cardTypeResponse.data.data[0].id
    }

    // First create the entity in English
    const createData = createTestData(entityType, {
      code: testCode,
      name: 'Test BaseCard Entity',
      description: 'A test base-card for integration testing',
      short_text: 'Test short description',
      status: 'draft',
      is_active: true,
      card_type_id: cardTypeId,
      card_family: 'major_arcana', // Required field
    })

    const createResponse = await authenticatedApi.post(getEntityEndpoint(entityType), createData)
    expect(createResponse.ok).toBe(true)
    const createdEntityId = createResponse.data.data.id

    // Create Spanish translations
    const spanishData = {
      name: 'Carta Base de Prueba',
      description: 'Una carta base de prueba para pruebas de integración',
      short_text: 'Descripción corta de prueba',
      lang: 'es',
    }

    const response = await authenticatedApi.patch(getEntityEndpoint(entityType, createdEntityId), spanishData)
    expect(response.ok).toBe(true)
    expect(response.status).toBe(200)
    expect(response.data.success).toBe(true)
    expect((response.data.data as any).name).toBe('Carta Base de Prueba')
    expect((response.data.data as any).description).toBe('Una carta base de prueba para pruebas de integración')
    expect((response.data.data as any).language_code_resolved).toBe('es')
  })

  it('should delete base-card entity', async () => {
    // First get an existing card_type, or create one if none exist
    const cardTypeResponse = await authenticatedApi.get(getEntityEndpoint('card_type'))
    let cardTypeId: number

    if (!cardTypeResponse.data.data || cardTypeResponse.data.data.length === 0) {
      // Create a card_type for this test
      const cardTypeData = createTestData('card_type', {
        code: `dep-cardtype-${Date.now()}`,
        name: 'Dependency CardType',
        description: 'CardType created as dependency for base-card test',
        short_text: 'Dep',
        status: 'published',
        is_active: true,
      })

      const createCardTypeResponse = await authenticatedApi.post(getEntityEndpoint('card_type'), cardTypeData)
      expect(createCardTypeResponse.ok).toBe(true)
      cardTypeId = createCardTypeResponse.data.data.id
    } else {
      cardTypeId = cardTypeResponse.data.data[0].id
    }

    // First create the entity
    const createData = createTestData(entityType, {
      code: testCode,
      name: 'Test BaseCard Entity',
      description: 'A test base-card for integration testing',
      short_text: 'Test short description',
      status: 'draft',
      is_active: true,
      card_type_id: cardTypeId,
      card_family: 'major_arcana', // Required field
    })

    const createResponse = await authenticatedApi.post(getEntityEndpoint(entityType), createData)
    expect(createResponse.ok).toBe(true)
    const createdEntityId = createResponse.data.data.id

    // Delete the entity
    const deleteResponse = await authenticatedApi.delete(getEntityEndpoint(entityType, createdEntityId))
    expect(deleteResponse.ok).toBe(true)

    // Verify it's deleted
    const getResponse = await authenticatedApi.get(getEntityEndpoint(entityType, createdEntityId))
    expect(getResponse.status).toBe(404)
  })
})
