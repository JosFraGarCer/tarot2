// tests/schemas/base-card.test.ts
import { describe, it, expect } from 'vitest'
import { baseCardCreateSchema, baseCardUpdateSchema, baseCardQuerySchema } from '@shared/schemas/entities/base-card'

describe('BaseCard Schemas', () => {
  describe('baseCardCreateSchema', () => {
    it('should validate valid base card creation data', () => {
      const validData = {
        code: 'test-card',
        card_type_id: 1,
        name: 'Test Card',
        lang: 'en',
        status: 'draft',
        is_active: true,
        effects: { combat: ['attack', 'defense'] },
      }

      const result = baseCardCreateSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.code).toBe('test-card')
        expect(result.data.card_type_id).toBe(1)
        expect(result.data.name).toBe('Test Card')
        expect(result.data.effects).toEqual({ combat: ['attack', 'defense'] })
      }
    })

    it('should reject invalid base card creation data', () => {
      const invalidData = {
        code: '', // empty code
        card_type_id: -1, // invalid id
        name: 'x', // name too short
        lang: 'invalid-lang',
      }

      const result = baseCardCreateSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0)
      }
    })

    it('should accept null effects', () => {
      const data = {
        code: 'test',
        card_type_id: 1,
        name: 'Test',
        lang: 'en',
        effects: null,
      }

      const result = baseCardCreateSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept empty effects object', () => {
      const data = {
        code: 'test',
        card_type_id: 1,
        name: 'Test',
        lang: 'en',
        effects: {},
      }

      const result = baseCardCreateSchema.safeParse(data)
      expect(result.success).toBe(true)
    })
  })

  describe('baseCardUpdateSchema', () => {
    it('should validate partial update data', () => {
      const updateData = {
        name: 'Updated Card',
        card_type_id: 2,
        effects: { magic: ['fire', 'ice'] },
      }

      const result = baseCardUpdateSchema.safeParse(updateData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe('Updated Card')
        expect(result.data.card_type_id).toBe(2)
        expect(result.data.effects).toEqual({ magic: ['fire', 'ice'] })
      }
    })

    it('should allow empty update', () => {
      const updateData = {}

      const result = baseCardUpdateSchema.safeParse(updateData)
      expect(result.success).toBe(true)
    })
  })

  describe('baseCardQuerySchema', () => {
    it('should validate query parameters', () => {
      const queryParams = {
        page: 1,
        pageSize: 20,
        search: 'test',
        status: 'draft',
        is_active: true,
        card_type_id: 1,
        sort: 'created_at',
        direction: 'desc',
        lang: 'en',
      }

      const result = baseCardQuerySchema.safeParse(queryParams)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(1)
        expect(result.data.card_type_id).toBe(1)
      }
    })

    it('should reject invalid sort values', () => {
      const queryParams = {
        sort: 'invalid_field',
      }

      const result = baseCardQuerySchema.safeParse(queryParams)
      expect(result.success).toBe(false)
    })

    it('should enforce page size limits', () => {
      const invalidData = {
        pageSize: 150, // exceeds max of 100
      }

      const result = baseCardQuerySchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })
})
