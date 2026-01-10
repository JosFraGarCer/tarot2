// tests/integration/skill.test.ts
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest'
import { authenticatedApi, createTestData, getEntityEndpoint, cleanupTestData, setupAuthenticatedApi } from './helpers'

describe('Skill Integration Tests', () => {
  const entityType = 'skill'
  const testCode = `test-skill-${Date.now()}`
  let arcanaId: number
  let facetId: number
  let arcanaCode: string
  let facetCode: string

  beforeAll(async () => {
    await setupAuthenticatedApi()

    // Create a unique arcana for this test
    arcanaCode = `test-arcana-${Date.now()}`
    const arcanaData = createTestData('arcana', {
      code: arcanaCode,
      name: 'Test Arcana for Skill',
      status: 'draft',
      is_active: true,
    })

    const arcanaResponse = await authenticatedApi.post(getEntityEndpoint('arcana'), arcanaData)
    expect(arcanaResponse.ok).toBe(true)
    arcanaId = arcanaResponse.data.data.id

    // Create a unique facet for this test
    facetCode = `test-facet-${Date.now()}`
    const facetData = createTestData('facet', {
      code: facetCode,
      name: 'Test Facet for Skill',
      status: 'draft',
      is_active: true,
      arcana_id: arcanaId,
    })

    const facetResponse = await authenticatedApi.post(getEntityEndpoint('facet'), facetData)
    expect(facetResponse.ok).toBe(true)
    facetId = facetResponse.data.data.id
  })

  beforeEach(async () => {
    await cleanupTestData(entityType, testCode)
  })

  afterEach(async () => {
    await cleanupTestData(entityType, testCode)
  })

  afterAll(async () => {
    // Cleanup the facet and arcana created for this test
    await cleanupTestData('facet', facetCode)
    await cleanupTestData('arcana', arcanaCode)
  })

  describe('Create Test Entity', () => {
    it('should create skill "Test" with multiple fields', async () => {
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
      expect(response.data.data.status).toBe('draft')
      expect(response.data.data.is_active).toBe(true)
      expect(response.data.data.facet_id).toBe(facetId)
    })
  })

  describe('Modify Test Entity Fields', () => {
    let createdEntityId: number

    beforeEach(async () => {
      // Create the test entity first
      const testData = createTestData(entityType, {
        code: testCode,
        name: 'Test Skill Entity',
        description: 'A test skill for integration testing',
        short_text: 'Test short description',
        status: 'draft',
        is_active: true,
        facet_id: facetId,
      })

      const createResponse = await authenticatedApi.post(getEntityEndpoint(entityType), testData)
      expect(createResponse.ok).toBe(true)
      createdEntityId = createResponse.data.data.id
    })

    it('should modify name field', async () => {
      const updateData = {
        name: 'Updated Test Skill Name',
      }

      const response = await authenticatedApi.patch(getEntityEndpoint(entityType, createdEntityId), updateData)

      expect(response.ok).toBe(true)
      expect(response.status).toBe(200)
      expect(response.data.success).toBe(true)
      expect(response.data.data.name).toBe('Updated Test Skill Name')
    })

    it('should modify description field', async () => {
      const updateData = {
        description: 'Updated description for test skill',
      }

      const response = await authenticatedApi.patch(getEntityEndpoint(entityType, createdEntityId), updateData)

      expect(response.ok).toBe(true)
      expect(response.status).toBe(200)
      expect(response.data.success).toBe(true)
      expect(response.data.data.description).toBe('Updated description for test skill')
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
    const spanishTestCode = `${testCode}-es-${Date.now()}`

    beforeEach(async () => {
      // Create the test entity in English first
      const testData = createTestData(entityType, {
        code: spanishTestCode,
        name: 'Test Skill Entity ES',
        description: 'A test skill for Spanish integration testing',
        short_text: 'Test short description ES',
        status: 'draft',
        is_active: true,
        facet_id: facetId,
      })

      const createResponse = await authenticatedApi.post(getEntityEndpoint(entityType), testData)
      expect(createResponse.ok).toBe(true)
      createdEntityId = createResponse.data!.data.id
    })

    it('should add Spanish fields via update', async () => {
      const spanishData = {
        name: 'Habilidad de Prueba',
        description: 'Una habilidad de prueba para pruebas de integración',
        short_text: 'Descripción corta de prueba',
        lang: 'es',
      }

      const response = await authenticatedApi.patch(getEntityEndpoint(entityType, createdEntityId), spanishData)

      expect(response.ok).toBe(true)
      expect(response.status).toBe(200)
      expect(response.data!.success).toBe(true)
      expect((response.data!.data as any).name).toBe('Habilidad de Prueba')
      expect((response.data!.data as any).description).toBe('Una habilidad de prueba para pruebas de integración')
      expect((response.data!.data as any).language_code_resolved).toBe('es')
      expect((response.data!.data as any).facet_id).toBe(facetId)
    })
  })

  describe('Delete Test Entity', () => {
    let createdEntityId: number

    beforeEach(async () => {
      // Create the test entity first
      const testData = createTestData(entityType, {
        code: testCode,
        name: 'Test Skill Entity',
        description: 'A test skill for integration testing',
        status: 'draft',
        is_active: true,
        facet_id: facetId,
      })

      const createResponse = await authenticatedApi.post(getEntityEndpoint(entityType), testData)
      expect(createResponse.ok).toBe(true)
      createdEntityId = createResponse.data.data.id
    })

    it('should delete the test skill entity', async () => {
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
