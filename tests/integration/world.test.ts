// tests/integration/world.test.ts
import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest'
import { authenticatedApi, createTestData, getEntityEndpoint, cleanupTestData, setupAuthenticatedApi } from './helpers'

// Add delay function
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

describe('World Integration Tests', () => {
  const entityType = 'world'
  const testCode = `test-world-${Date.now()}`

  beforeAll(async () => {
    await setupAuthenticatedApi()
    // Add delay to space out test initialization
    await delay(500)
  })

  beforeEach(async () => {
    await cleanupTestData(entityType, testCode)
    await delay(200)
  })

  afterEach(async () => {
    await cleanupTestData(entityType, testCode)
    await delay(200)
  })

  it('should create world with multiple fields', async () => {
    const testData = createTestData(entityType, {
      code: testCode,
      name: 'Test World Entity',
      description: 'A test world for integration testing',
      short_text: 'Test short description',
      status: 'draft',
      is_active: true,
    })

    const response = await authenticatedApi.post(getEntityEndpoint(entityType), testData)

    if (!response.ok) {
      console.error(`❌ WORLD CREATE FAILED (${testCode}):`, {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        url: getEntityEndpoint(entityType),
        testData: JSON.stringify(testData, null, 2)
      })
    } else {
      console.log(`✅ WORLD CREATE SUCCESS (${testCode}): status=${response.status}`)
    }

    expect(response.ok).toBe(true)
    expect(response.status).toBe(200)
    expect(response.data).toBeDefined()
    expect(response.data.success).toBe(true)
    expect(response.data.data.code).toBe(testCode)
    expect(response.data.data.name).toBe('Test World Entity')
    expect(response.data.data.description).toBe('A test world for integration testing')
    expect(response.data.data.status).toBe('draft')
    expect(response.data.data.is_active).toBe(true)
  })

  it('should edit multiple fields of world', async () => {
    // First create the entity
    const createData = createTestData(entityType, {
      code: testCode,
      name: 'Test World Entity',
      description: 'A test world for integration testing',
      short_text: 'Test short description',
      status: 'draft',
      is_active: true,
    })

    const createResponse = await authenticatedApi.post(getEntityEndpoint(entityType), createData)
    expect(createResponse.ok).toBe(true)
    const createdEntityId = createResponse.data.data.id

    // Edit name field
    const updateData1 = {
      name: 'Updated Test World Name',
      lang: 'en',
    }
    const response1 = await authenticatedApi.patch(getEntityEndpoint(entityType, createdEntityId), updateData1)
    expect(response1.ok).toBe(true)

    // Edit description field
    const updateData2 = {
      description: 'Updated description for test world',
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

  it('should create Spanish translations for world fields', async () => {
    // First create the entity in English
    const createData = createTestData(entityType, {
      code: testCode,
      name: 'Test World Entity',
      description: 'A test world for integration testing',
      short_text: 'Test short description',
      status: 'draft',
      is_active: true,
    })

    const createResponse = await authenticatedApi.post(getEntityEndpoint(entityType), createData)
    expect(createResponse.ok).toBe(true)
    const createdEntityId = createResponse.data.data.id

    // Create Spanish translations
    const spanishData = {
      name: 'Mundo de Prueba',
      description: 'Un mundo de prueba para pruebas de integración',
      short_text: 'Descripción corta de prueba',
      lang: 'es',
    }

    const response = await authenticatedApi.patch(getEntityEndpoint(entityType, createdEntityId), spanishData)
    expect(response.ok).toBe(true)
    expect(response.status).toBe(200)
    expect(response.data.success).toBe(true)
    expect((response.data.data as any).name).toBe('Mundo de Prueba')
    expect((response.data.data as any).description).toBe('Un mundo de prueba para pruebas de integración')
    expect((response.data.data as any).language_code_resolved).toBe('es')
  })

  it('should delete world entity', async () => {
    // First create the entity
    const createData = createTestData(entityType, {
      code: testCode,
      name: 'Test World Entity',
      description: 'A test world for integration testing',
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
