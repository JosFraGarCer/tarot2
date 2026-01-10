// tests/schemas/arcana.test.ts
import { describe, it, expect } from 'vitest'
import { arcanaCreateSchema, arcanaUpdateSchema, arcanaQuerySchema } from '@shared/schemas/entities/arcana'
import { CardStatusEnum } from '@shared/schemas/common'

describe('Arcana Schemas', () => {
  describe('arcanaCreateSchema', () => {
    it('should validate valid arcana creation data', () => {
      const validData = {
        code: 'test-arcana',
        name: 'Test Arcana',
        lang: 'en',
        status: 'draft',
        is_active: true,
      }

      const result = arcanaCreateSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.code).toBe('test-arcana')
        expect(result.data.name).toBe('Test Arcana')
        expect(result.data.status).toBe('draft')
      }
    })

    it('should reject invalid arcana creation data', () => {
      const invalidData = {
        code: '', // empty code
        name: 'x', // name too short
        lang: 'invalid', // invalid format and right length
      }

      const result = arcanaCreateSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toHaveLength(3)
      }
    })

    it('should accept valid status values', () => {
      const validStatuses = ['draft', 'review', 'pending_review']
      
      validStatuses.forEach(status => {
        const data = {
          code: 'test',
          name: 'Test',
          lang: 'en',
          status,
        }
        const result = arcanaCreateSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })
  })

  describe('arcanaUpdateSchema', () => {
    it('should validate partial update data', () => {
      const updateData = {
        name: 'Updated Name',
        status: 'approved',
      }

      const result = arcanaUpdateSchema.safeParse(updateData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe('Updated Name')
        expect(result.data.status).toBe('approved')
      }
    })

    it('should reject invalid update data', () => {
      const invalidData = {
        name: 'x', // too short
        lang: 'invalid',
      }

      const result = arcanaUpdateSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('arcanaQuerySchema', () => {
    it('should validate query parameters', () => {
      const queryParams = {
        page: 1,
        pageSize: 20,
        search: 'test',
        status: 'draft',
        is_active: true,
        sort: 'created_at',
        direction: 'desc',
        lang: 'en',
      }

      const result = arcanaQuerySchema.safeParse(queryParams)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(1)
        expect(result.data.pageSize).toBe(20)
        expect(result.data.search).toBe('test')
      }
    })

    it('should use default values for optional parameters', () => {
      const queryParams = {}

      const result = arcanaQuerySchema.safeParse(queryParams)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(1)
        expect(result.data.pageSize).toBe(20)
      }
    })

    it('should reject invalid sort values', () => {
      const queryParams = {
        sort: 'invalid_field',
      }

      const result = arcanaQuerySchema.safeParse(queryParams)
      expect(result.success).toBe(false)
    })
  })

  describe('CardStatusEnum consistency', () => {
    it('should contain all required status values', () => {
      const expectedStatuses = [
        'draft', 'approved', 'archived', 'review',
        'pending_review', 'changes_requested',
        'translation_review', 'rejected', 'published'
      ]

      expect(CardStatusEnum).toEqual(expect.arrayContaining(expectedStatuses))
      expect(CardStatusEnum).toHaveLength(9)
    })
  })
})
