// tests/integration/cardtype.test.ts
import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest'
import { authenticatedApi, createTestData, getEntityEndpoint, cleanupTestData, setupAuthenticatedApi } from './helpers'

describe('CardType Integration Tests', () => {
  const entityType = 'card_type'
  const testCode = `test-cardtype-${Date.now()}`

  beforeAll(async () => {
    await setupAuthenticatedApi()

    // Create a seed cardtype for dependent tests
    const seedData = createTestData(entityType, {
      code: 'seed-cardtype',
      name: 'Seed CardType',
      description: 'Seed cardtype for dependent tests',
      short_text: 'Seed',
      status: 'published',
      is_active: true,
    })

    try {
      await authenticatedApi.post(getEntityEndpoint(entityType), seedData)
    } catch (error) {
      // Seed might already exist, ignore
    }
  })

  beforeEach(async () => {
    await cleanupTestData(entityType, testCode)
  })

  afterEach(async () => {
    await cleanupTestData(entityType, testCode)
  })

  it('should create cardtype with multiple fields', async () => {
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

  it('should edit multiple fields of cardtype', async () => {
    // First create the entity
    const createData = createTestData(entityType, {
      code: testCode,
      name: 'Test CardType Entity',
      description: 'A test cardtype for integration testing',
      short_text: 'Test short description',
      status: 'draft',
      is_active: true,
    })

    const createResponse = await authenticatedApi.post(getEntityEndpoint(entityType), createData)
    expect(createResponse.ok).toBe(true)
    const createdEntityId = createResponse.data.data.id

    // Edit name field
    const updateData1 = {
      name: 'Updated Test CardType Name',
      lang: 'en',
    }
    const response1 = await authenticatedApi.patch(getEntityEndpoint(entityType, createdEntityId), updateData1)
    expect(response1.ok).toBe(true)

    // Edit description field
    const updateData2 = {
      description: 'Updated description for test cardtype',
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

  it('should create Spanish translations for cardtype fields', async () => {
    // First create the entity in English
    const createData = createTestData(entityType, {
      code: testCode,
      name: 'Test CardType Entity',
      description: 'A test cardtype for integration testing',
      short_text: 'Test short description',
      status: 'draft',
      is_active: true,
    })

    const createResponse = await authenticatedApi.post(getEntityEndpoint(entityType), createData)
    expect(createResponse.ok).toBe(true)
    const createdEntityId = createResponse.data.data.id

    // Create Spanish translations
    const spanishData = {
      name: 'Tipo de Carta de Prueba',
      description: 'Un tipo de carta de prueba para pruebas de integración',
      short_text: 'Descripción corta de prueba',
      lang: 'es',
    }

    const response = await authenticatedApi.patch(getEntityEndpoint(entityType, createdEntityId), spanishData)
    expect(response.ok).toBe(true)
    expect(response.status).toBe(200)
    expect(response.data.success).toBe(true)
    expect((response.data.data as any).name).toBe('Tipo de Carta de Prueba')
    expect((response.data.data as any).description).toBe('Un tipo de carta de prueba para pruebas de integración')
    expect((response.data.data as any).language_code_resolved).toBe('es')
  })

  it('should delete cardtype entity', async () => {
    // First create the entity
    const createData = createTestData(entityType, {
      code: testCode,
      name: 'Test CardType Entity',
      description: 'A test cardtype for integration testing',
      short_text: 'Test short description',
      status: 'draft',
      is_active: true,
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
