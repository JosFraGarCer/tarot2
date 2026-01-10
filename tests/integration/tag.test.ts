// tests/integration/tag.test.ts
import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest'
import { authenticatedApi, createTestData, getEntityEndpoint, cleanupTestData, setupAuthenticatedApi } from './helpers'

describe('Tag Integration Tests', () => {
  const entityType = 'tag'
  const testCode = `test-tag-${Date.now()}`

  beforeAll(async () => {
    await setupAuthenticatedApi()
  })

  afterEach(async () => {
    await cleanupTestData(entityType, testCode)
  })

  it('should create tag with multiple fields', async () => {
    const testData = createTestData(entityType, {
      code: testCode,
      name: 'Test Tag Entity',
      description: 'A test tag for integration testing',
      short_text: 'Test short description',
      status: 'draft',
      is_active: true,
      category: 'test',
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

  it('should edit multiple fields of tag', async () => {
    // First create the entity
    const createData = createTestData(entityType, {
      code: testCode,
      name: 'Test Tag Entity',
      description: 'A test tag for integration testing',
      short_text: 'Test short description',
      status: 'draft',
      is_active: true,
      category: 'test',
    })

    const createResponse = await authenticatedApi.post(getEntityEndpoint(entityType), createData)
    expect(createResponse.ok).toBe(true)
    const createdEntityId = createResponse.data.data.id

    // Edit name field
    const updateData1 = {
      name: 'Updated Test Tag Name',
      lang: 'en',
    }
    const response1 = await authenticatedApi.patch(getEntityEndpoint(entityType, createdEntityId), updateData1)
    expect(response1.ok).toBe(true)

    // Edit description field
    const updateData2 = {
      description: 'Updated description for test tag',
      lang: 'en',
    }
    const response2 = await authenticatedApi.patch(getEntityEndpoint(entityType, createdEntityId), updateData2)
    expect(response2.ok).toBe(true)

    // Edit category field
    const updateData3 = {
      category: 'updated',
      lang: 'en',
    }
    const response3 = await authenticatedApi.patch(getEntityEndpoint(entityType, createdEntityId), updateData3)
    expect(response3.ok).toBe(true)
  })

  it('should create Spanish translations for tag fields', async () => {
    // First create the entity in English
    const createData = createTestData(entityType, {
      code: testCode,
      name: 'Test Tag Entity',
      description: 'A test tag for integration testing',
      short_text: 'Test short description',
      status: 'draft',
      is_active: true,
      category: 'test',
    })

    const createResponse = await authenticatedApi.post(getEntityEndpoint(entityType), createData)
    expect(createResponse.ok).toBe(true)
    const createdEntityId = createResponse.data.data.id

    // Create Spanish translations
    const spanishData = {
      name: 'Etiqueta de Prueba',
      description: 'Una etiqueta de prueba para pruebas de integración',
      short_text: 'Descripción corta de prueba',
    }

    const response = await authenticatedApi.patch(getEntityEndpoint(entityType, createdEntityId) + '?lang=es', spanishData)
    expect(response.ok).toBe(true)
    expect(response.status).toBe(200)
    expect(response.data.success).toBe(true)
    expect((response.data.data as any).name).toBe('Etiqueta de Prueba')
    expect((response.data.data as any).description).toBe('Una etiqueta de prueba para pruebas de integración')
    expect((response.data.data as any).language_code_resolved).toBe('es')
  })

  it('should delete tag entity', async () => {
    // First create the entity
    const createData = createTestData(entityType, {
      code: testCode,
      name: 'Test Tag Entity',
      description: 'A test tag for integration testing',
      short_text: 'Test short description',
      status: 'draft',
      is_active: true,
      category: 'test',
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
