// tests/integration/arcana.test.ts
import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest'
import { authenticatedApi, createTestData, getEntityEndpoint, cleanupTestData, setupAuthenticatedApi } from './helpers'

describe('Arcana Integration Tests', () => {
  const entityType = 'arcana'
  const testCode = `test-arcana-${Date.now()}`

  beforeAll(async () => {
    await setupAuthenticatedApi()

    // Create a seed arcana for dependent tests
    const seedData = createTestData(entityType, {
      code: 'seed-arcana',
      name: 'Seed Arcana',
      description: 'Seed arcana for dependent tests',
      short_text: 'Seed',
      status: 'published',
      is_active: true,
    })

    try {
      await authenticatedApi.post(getEntityEndpoint(entityType), seedData)
    } catch (error) {
      // Seed might already exist, ignore
    }
  }, 30000)

  beforeEach(async () => {
    await cleanupTestData(entityType, testCode)
  })

  afterEach(async () => {
    await cleanupTestData(entityType, testCode)
  })

  it('should create arcana with multiple fields', async () => {
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
    expect(response.data.success).toBe(true)
    expect((response.data.data as any).code).toBe(testCode)
    expect((response.data.data as any).name).toBe('Test Arcana Entity')
    expect((response.data.data as any).description).toBe('A test arcana for integration testing')
    expect((response.data.data as any).status).toBe('draft')
    expect((response.data.data as any).is_active).toBe(true)
  })

  it('should edit multiple fields of arcana', async () => {
    // First create the entity
    const createData = createTestData(entityType, {
      code: testCode,
      name: 'Test Arcana Entity',
      description: 'A test arcana for integration testing',
      short_text: 'Test short description',
      status: 'draft',
      is_active: true,
    })

    const createResponse = await authenticatedApi.post(getEntityEndpoint(entityType), createData)
    expect(createResponse.ok).toBe(true)
    const createdEntityId = createResponse.data.data.id

    // Edit name field
    const updateData1 = {
      name: 'Updated Test Arcana Name',
      lang: 'en',
    }
    const response1 = await authenticatedApi.patch(getEntityEndpoint(entityType, createdEntityId), updateData1)
    expect(response1.ok).toBe(true)

    // Edit description field
    const updateData2 = {
      description: 'Updated description for test arcana',
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

  it('should create Spanish translations for arcana fields', async () => {
    // First create the entity in English
    const createData = createTestData(entityType, {
      code: testCode,
      name: 'Test Arcana Entity',
      description: 'A test arcana for integration testing',
      short_text: 'Test short description',
      status: 'draft',
      is_active: true,
    })

    const createResponse = await authenticatedApi.post(getEntityEndpoint(entityType), createData)
    expect(createResponse.ok).toBe(true)
    const createdEntityId = createResponse.data.data.id

    // Create Spanish translations
    const spanishData = {
      name: 'Arcana de Prueba',
      description: 'Una arcana de prueba para pruebas de integración',
      short_text: 'Descripción corta de prueba',
      lang: 'es',
    }

    const response = await authenticatedApi.patch(getEntityEndpoint(entityType, createdEntityId), spanishData)
    expect(response.ok).toBe(true)
    expect(response.status).toBe(200)
    expect(response.data.success).toBe(true)
    expect((response.data.data as any).name).toBe('Arcana de Prueba')
    expect((response.data.data as any).description).toBe('Una arcana de prueba para pruebas de integración')
    expect((response.data.data as any).language_code_resolved).toBe('es')
  })

  it('should delete arcana entity', async () => {
    // First create the entity
    const createData = createTestData(entityType, {
      code: testCode,
      name: 'Test Arcana Entity',
      description: 'A test arcana for integration testing',
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
