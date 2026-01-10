// tests/integration/facet.test.ts
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest'
import { authenticatedApi, createTestData, getEntityEndpoint, cleanupTestData, setupAuthenticatedApi } from './helpers'

describe('Facet Integration Tests', () => {
  const entityType = 'facet'
  const testCode = `test-facet-${Date.now()}`

  beforeAll(async () => {
    await setupAuthenticatedApi()

    // Create a seed facet for dependent tests (needs seed arcana)
    // First ensure seed arcana exists
    try {
      const arcanaResponse = await authenticatedApi.get(getEntityEndpoint('arcana'))
      if (!arcanaResponse.data.data.some((a: any) => a.code === 'seed-arcana')) {
        const seedArcanaData = createTestData('arcana', {
          code: 'seed-arcana',
          name: 'Seed Arcana',
          description: 'Seed arcana for dependent tests',
          short_text: 'Seed',
          status: 'published',
          is_active: true,
        })
        await authenticatedApi.post(getEntityEndpoint('arcana'), seedArcanaData)
      }
    } catch (error) {
      // Ignore
    }

    // Now create seed facet
    const seedData = createTestData(entityType, {
      code: 'seed-facet',
      name: 'Seed Facet',
      description: 'Seed facet for dependent tests',
      short_text: 'Seed',
      status: 'published',
      is_active: true,
      arcana_id: 1, // Will be updated if needed
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

  it('should create facet with multiple fields using existing arcana', async () => {
    // First get an existing arcana, or create one if none exist
    let arcanaResponse = await authenticatedApi.get(getEntityEndpoint('arcana'))
    let arcanaId: number

    if (!arcanaResponse.data.data || arcanaResponse.data.data.length === 0) {
      // Create an arcana for this test
      const arcanaData = createTestData('arcana', {
        code: `dep-arcana-${Date.now()}`,
        name: 'Dependency Arcana',
        description: 'Arcana created as dependency for facet test',
        short_text: 'Dep',
        status: 'published',
        is_active: true,
      })

      const createArcanaResponse = await authenticatedApi.post(getEntityEndpoint('arcana'), arcanaData)
      expect(createArcanaResponse.ok).toBe(true)
      arcanaId = createArcanaResponse.data.data.id
    } else {
      arcanaId = arcanaResponse.data.data[0].id
    }

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
    expect(response.data.data.arcana_id).toBe(arcanaId)
  })

  it('should edit multiple fields of facet', async () => {
    // First get an existing arcana, or create one if none exist
    let arcanaResponse = await authenticatedApi.get(getEntityEndpoint('arcana'))
    let arcanaId: number

    if (!arcanaResponse.data.data || arcanaResponse.data.data.length === 0) {
      // Create an arcana for this test
      const arcanaData = createTestData('arcana', {
        code: `dep-arcana-${Date.now()}`,
        name: 'Dependency Arcana',
        description: 'Arcana created as dependency for facet test',
        short_text: 'Dep',
        status: 'published',
        is_active: true,
      })

      const createArcanaResponse = await authenticatedApi.post(getEntityEndpoint('arcana'), arcanaData)
      expect(createArcanaResponse.ok).toBe(true)
      arcanaId = createArcanaResponse.data.data.id
    } else {
      arcanaId = arcanaResponse.data.data[0].id
    }

    // First create the entity
    const createData = createTestData(entityType, {
      code: testCode,
      name: 'Test Facet Entity',
      description: 'A test facet for integration testing',
      short_text: 'Test short description',
      status: 'draft',
      is_active: true,
      arcana_id: arcanaId,
    })

    const createResponse = await authenticatedApi.post(getEntityEndpoint(entityType), createData)
    expect(createResponse.ok).toBe(true)
    const createdEntityId = createResponse.data.data.id

    // Edit name field
    const updateData1 = {
      name: 'Updated Test Facet Name',
      lang: 'en',
    }
    const response1 = await authenticatedApi.patch(getEntityEndpoint(entityType, createdEntityId), updateData1)
    expect(response1.ok).toBe(true)

    // Edit description field
    const updateData2 = {
      description: 'Updated description for test facet',
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

  it('should create Spanish translations for facet fields', async () => {
    // First get an existing arcana, or create one if none exist
    let arcanaResponse = await authenticatedApi.get(getEntityEndpoint('arcana'))
    let arcanaId: number

    if (!arcanaResponse.data.data || arcanaResponse.data.data.length === 0) {
      // Create an arcana for this test
      const arcanaData = createTestData('arcana', {
        code: `dep-arcana-${Date.now()}`,
        name: 'Dependency Arcana',
        description: 'Arcana created as dependency for facet test',
        short_text: 'Dep',
        status: 'published',
        is_active: true,
      })

      const createArcanaResponse = await authenticatedApi.post(getEntityEndpoint('arcana'), arcanaData)
      expect(createArcanaResponse.ok).toBe(true)
      arcanaId = createArcanaResponse.data.data.id
    } else {
      arcanaId = arcanaResponse.data.data[0].id
    }

    // First create the entity in English
    const createData = createTestData(entityType, {
      code: testCode,
      name: 'Test Facet Entity',
      description: 'A test facet for integration testing',
      short_text: 'Test short description',
      status: 'draft',
      is_active: true,
      arcana_id: arcanaId,
    })

    const createResponse = await authenticatedApi.post(getEntityEndpoint(entityType), createData)
    expect(createResponse.ok).toBe(true)
    const createdEntityId = createResponse.data.data.id

    // Create Spanish translations
    const spanishData = {
      name: 'Faceta de Prueba',
      description: 'Una faceta de prueba para pruebas de integración',
      short_text: 'Descripción corta de prueba',
      lang: 'es',
    }

    const response = await authenticatedApi.patch(getEntityEndpoint(entityType, createdEntityId), spanishData)
    expect(response.ok).toBe(true)
    expect(response.status).toBe(200)
    expect(response.data.success).toBe(true)
    expect((response.data.data as any).name).toBe('Faceta de Prueba')
    expect((response.data.data as any).description).toBe('Una faceta de prueba para pruebas de integración')
    expect((response.data.data as any).language_code_resolved).toBe('es')
  })

  it('should delete facet entity', async () => {
    // First get an existing arcana, or create one if none exist
    let arcanaResponse = await authenticatedApi.get(getEntityEndpoint('arcana'))
    let arcanaId: number

    if (!arcanaResponse.data.data || arcanaResponse.data.data.length === 0) {
      // Create an arcana for this test
      const arcanaData = createTestData('arcana', {
        code: `dep-arcana-${Date.now()}`,
        name: 'Dependency Arcana',
        description: 'Arcana created as dependency for facet test',
        short_text: 'Dep',
        status: 'published',
        is_active: true,
      })

      const createArcanaResponse = await authenticatedApi.post(getEntityEndpoint('arcana'), arcanaData)
      expect(createArcanaResponse.ok).toBe(true)
      arcanaId = createArcanaResponse.data.data.id
    } else {
      arcanaId = arcanaResponse.data.data[0].id
    }

    // First create the entity
    const createData = createTestData(entityType, {
      code: testCode,
      name: 'Test Facet Entity',
      description: 'A test facet for integration testing',
      short_text: 'Test short description',
      status: 'draft',
      is_active: true,
      arcana_id: arcanaId,
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
