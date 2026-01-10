// tests/integration/skill.test.ts
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest'
import { authenticatedApi, createTestData, getEntityEndpoint, cleanupTestData, setupAuthenticatedApi } from './helpers'

describe('Skill Integration Tests', () => {
  const entityType = 'skill'
  const testCode = `test-skill-${Date.now()}`

  beforeAll(async () => {
    await setupAuthenticatedApi()
  })

  beforeEach(async () => {
    await cleanupTestData(entityType, testCode)
  })

  afterEach(async () => {
    await cleanupTestData(entityType, testCode)
  })

  it('should create skill with multiple fields using existing facet', async () => {
    // First get an existing facet, or create one if none exist
    let facetResponse = await authenticatedApi.get(getEntityEndpoint('facet'))
    let facetId: number

    if (!facetResponse.data.data || facetResponse.data.data.length === 0) {
      // Need to create both arcana and facet
      // First check/create arcana
      let arcanaResponse = await authenticatedApi.get(getEntityEndpoint('arcana'))
      let arcanaId: number

      if (!arcanaResponse.data.data || arcanaResponse.data.data.length === 0) {
        const arcanaData = createTestData('arcana', {
          code: `dep-arcana-${Date.now()}`,
          name: 'Dependency Arcana',
          description: 'Arcana created as dependency for skill test',
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

      // Now create facet
      const facetData = createTestData('facet', {
        code: `dep-facet-${Date.now()}`,
        name: 'Dependency Facet',
        description: 'Facet created as dependency for skill test',
        short_text: 'Dep',
        status: 'published',
        is_active: true,
        arcana_id: arcanaId,
      })

      const createFacetResponse = await authenticatedApi.post(getEntityEndpoint('facet'), facetData)
      expect(createFacetResponse.ok).toBe(true)
      facetId = createFacetResponse.data.data.id
    } else {
      facetId = facetResponse.data.data[0].id
    }

    const testData = createTestData(entityType, {
      code: testCode,
      name: 'Test Skill Entity',
      description: 'A test skill for integration testing',
      short_text: 'Test short description',
      status: 'draft',
      is_active: true,
      facet_id: facetId,
    })

    const response = await authenticatedApi.post(getEntityEndpoint(entityType), testData)

    expect(response.ok).toBe(true)
    expect(response.status).toBe(200)
    expect(response.data).toBeDefined()
    expect(response.data.success).toBe(true)
    expect(response.data.data.code).toBe(testCode)
    expect(response.data.data.name).toBe('Test Skill Entity')
    expect(response.data.data.description).toBe('A test skill for integration testing')
    expect(response.data.data.facet_id).toBe(facetId)
  })

  it('should edit multiple fields of skill', async () => {
    // First get an existing facet, or create one if none exist
    let facetResponse = await authenticatedApi.get(getEntityEndpoint('facet'))
    let facetId: number

    if (!facetResponse.data.data || facetResponse.data.data.length === 0) {
      // Need to create both arcana and facet
      let arcanaResponse = await authenticatedApi.get(getEntityEndpoint('arcana'))
      let arcanaId: number

      if (!arcanaResponse.data.data || arcanaResponse.data.data.length === 0) {
        const arcanaData = createTestData('arcana', {
          code: `dep-arcana-${Date.now()}`,
          name: 'Dependency Arcana',
          description: 'Arcana created as dependency for skill test',
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

      const facetData = createTestData('facet', {
        code: `dep-facet-${Date.now()}`,
        name: 'Dependency Facet',
        description: 'Facet created as dependency for skill test',
        short_text: 'Dep',
        status: 'published',
        is_active: true,
        arcana_id: arcanaId,
      })

      const createFacetResponse = await authenticatedApi.post(getEntityEndpoint('facet'), facetData)
      expect(createFacetResponse.ok).toBe(true)
      facetId = createFacetResponse.data.data.id
    } else {
      facetId = facetResponse.data.data[0].id
    }

    // First create the entity
    const createData = createTestData(entityType, {
      code: testCode,
      name: 'Test Skill Entity',
      description: 'A test skill for integration testing',
      short_text: 'Test short description',
      status: 'draft',
      is_active: true,
      facet_id: facetId,
    })

    const createResponse = await authenticatedApi.post(getEntityEndpoint(entityType), createData)
    expect(createResponse.ok).toBe(true)
    const createdEntityId = createResponse.data.data.id

    // Edit name field
    const updateData1 = {
      name: 'Updated Test Skill Name',
      lang: 'en',
    }
    const response1 = await authenticatedApi.patch(getEntityEndpoint(entityType, createdEntityId), updateData1)
    expect(response1.ok).toBe(true)

    // Edit description field
    const updateData2 = {
      description: 'Updated description for test skill',
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

  it('should create Spanish translations for skill fields', async () => {
    // First get an existing facet, or create one if none exist
    let facetResponse = await authenticatedApi.get(getEntityEndpoint('facet'))
    let facetId: number

    if (!facetResponse.data.data || facetResponse.data.data.length === 0) {
      // Need to create both arcana and facet
      let arcanaResponse = await authenticatedApi.get(getEntityEndpoint('arcana'))
      let arcanaId: number

      if (!arcanaResponse.data.data || arcanaResponse.data.data.length === 0) {
        const arcanaData = createTestData('arcana', {
          code: `dep-arcana-${Date.now()}`,
          name: 'Dependency Arcana',
          description: 'Arcana created as dependency for skill test',
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

      const facetData = createTestData('facet', {
        code: `dep-facet-${Date.now()}`,
        name: 'Dependency Facet',
        description: 'Facet created as dependency for skill test',
        short_text: 'Dep',
        status: 'published',
        is_active: true,
        arcana_id: arcanaId,
      })

      const createFacetResponse = await authenticatedApi.post(getEntityEndpoint('facet'), facetData)
      expect(createFacetResponse.ok).toBe(true)
      facetId = createFacetResponse.data.data.id
    } else {
      facetId = facetResponse.data.data[0].id
    }

    // First create the entity in English
    const createData = createTestData(entityType, {
      code: testCode,
      name: 'Test Skill Entity',
      description: 'A test skill for integration testing',
      short_text: 'Test short description',
      status: 'draft',
      is_active: true,
      facet_id: facetId,
    })

    const createResponse = await authenticatedApi.post(getEntityEndpoint(entityType), createData)
    expect(createResponse.ok).toBe(true)
    const createdEntityId = createResponse.data.data.id

    // Create Spanish translations
    const spanishData = {
      name: 'Habilidad de Prueba',
      description: 'Una habilidad de prueba para pruebas de integración',
      short_text: 'Descripción corta de prueba',
      lang: 'es',
    }

    const response = await authenticatedApi.patch(getEntityEndpoint(entityType, createdEntityId), spanishData)
    expect(response.ok).toBe(true)
    expect(response.status).toBe(200)
    expect(response.data.success).toBe(true)
    expect((response.data.data as any).name).toBe('Habilidad de Prueba')
    expect((response.data.data as any).description).toBe('Una habilidad de prueba para pruebas de integración')
    expect((response.data.data as any).language_code_resolved).toBe('es')
  })

  it('should delete skill entity', async () => {
    // First get an existing facet, or create one if none exist
    let facetResponse = await authenticatedApi.get(getEntityEndpoint('facet'))
    let facetId: number

    if (!facetResponse.data.data || facetResponse.data.data.length === 0) {
      // Need to create both arcana and facet
      let arcanaResponse = await authenticatedApi.get(getEntityEndpoint('arcana'))
      let arcanaId: number

      if (!arcanaResponse.data.data || arcanaResponse.data.data.length === 0) {
        const arcanaData = createTestData('arcana', {
          code: `dep-arcana-${Date.now()}`,
          name: 'Dependency Arcana',
          description: 'Arcana created as dependency for skill test',
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

      const facetData = createTestData('facet', {
        code: `dep-facet-${Date.now()}`,
        name: 'Dependency Facet',
        description: 'Facet created as dependency for skill test',
        short_text: 'Dep',
        status: 'published',
        is_active: true,
        arcana_id: arcanaId,
      })

      const createFacetResponse = await authenticatedApi.post(getEntityEndpoint('facet'), facetData)
      expect(createFacetResponse.ok).toBe(true)
      facetId = createFacetResponse.data.data.id
    } else {
      facetId = facetResponse.data.data[0].id
    }

    // First create the entity
    const createData = createTestData(entityType, {
      code: testCode,
      name: 'Test Skill Entity',
      description: 'A test skill for integration testing',
      short_text: 'Test short description',
      status: 'draft',
      is_active: true,
      facet_id: facetId,
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
