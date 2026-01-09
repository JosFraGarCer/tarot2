// tests/schemas/common.test.ts
import { describe, it, expect } from 'vitest'
import { 
  CardStatusEnum, 
  cardStatusSchema, 
  languageCodeSchema,
  paginationSchema 
} from '@shared/schemas/common'

describe('Common Schemas', () => {
  describe('CardStatusEnum', () => {
    it('should contain all expected status values', () => {
      const expected = [
        'draft', 'approved', 'archived', 'review',
        'pending_review', 'changes_requested',
        'translation_review', 'rejected', 'published'
      ]
      
      expect(CardStatusEnum).toEqual(expected)
      expect(CardStatusEnum).toHaveLength(9)
    })

    it('should have draft as first status', () => {
      expect(CardStatusEnum[0]).toBe('draft')
    })

    it('should have published as last status', () => {
      expect(CardStatusEnum[CardStatusEnum.length - 1]).toBe('published')
    })
  })

  describe('cardStatusSchema', () => {
    it('should validate all enum values', () => {
      CardStatusEnum.forEach(status => {
        const result = cardStatusSchema.safeParse(status)
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid status values', () => {
      const invalidStatuses = ['invalid', 'DRAFT', 'APPROVED', '', null, undefined]
      
      invalidStatuses.forEach(status => {
        const result = cardStatusSchema.safeParse(status)
        expect(result.success).toBe(false)
      })
    })
  })

  describe('languageCodeSchema', () => {
    it('should validate valid language codes', () => {
      const validCodes = ['en', 'es', 'fr', 'de', 'en-US', 'es-ES', 'fr-FR']
      
      validCodes.forEach(code => {
        const result = languageCodeSchema.safeParse(code)
        expect(result.success).toBe(true)
        if (result.success) {
          // Should transform to lowercase
          expect(result.data).toBe(code.toLowerCase())
        }
      })
    })

    it('should reject invalid language codes', () => {
      const invalidCodes = ['e', 'eng', 'english', 'EN-USA', 'es-', '-ES', '', null, undefined]
      
      invalidCodes.forEach(code => {
        const result = languageCodeSchema.safeParse(code)
        expect(result.success).toBe(false)
      })
    })

    it('should enforce length constraints', () => {
      const tooShort = 'e'
      const tooLong = 'language-code-too-long'
      
      expect(languageCodeSchema.safeParse(tooShort).success).toBe(false)
      expect(languageCodeSchema.safeParse(tooLong).success).toBe(false)
    })
  })

  describe('paginationSchema', () => {
    it('should validate complete pagination parameters', () => {
      const pagination = {
        page: 2,
        pageSize: 50,
        search: 'test search',
        q: 'alternative search',
        sort: 'created_at',
        direction: 'asc',
      }

      const result = paginationSchema.safeParse(pagination)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(2)
        expect(result.data.pageSize).toBe(50)
        expect(result.data.search).toBe('test search')
        expect(result.data.q).toBe('alternative search')
        expect(result.data.sort).toBe('created_at')
        expect(result.data.direction).toBe('asc')
      }
    })

    it('should use default values for missing parameters', () => {
      const pagination = {}

      const result = paginationSchema.safeParse(pagination)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(1)
        expect(result.data.pageSize).toBe(20)
        expect(result.data.sort).toBeUndefined()
        expect(result.data.direction).toBeUndefined()
      }
    })

    it('should enforce page constraints', () => {
      const invalidPage = { page: 0 }
      const invalidPageSize = { pageSize: 0 }
      const tooLargePageSize = { pageSize: 150 }

      expect(paginationSchema.safeParse(invalidPage).success).toBe(false)
      expect(paginationSchema.safeParse(invalidPageSize).success).toBe(false)
      expect(paginationSchema.safeParse(tooLargePageSize).success).toBe(false)
    })

    it('should enforce search length constraints', () => {
      const tooShortSearch = { search: '' }
      const tooLongSearch = { search: 'a'.repeat(151) }

      expect(paginationSchema.safeParse(tooShortSearch).success).toBe(false)
      expect(paginationSchema.safeParse(tooLongSearch).success).toBe(false)
    })

    it('should validate direction enum', () => {
      const validDirections = ['asc', 'desc']
      const invalidDirections = ['ASC', 'DESC', 'up', 'down', '']

      validDirections.forEach(direction => {
        const result = paginationSchema.safeParse({ direction })
        expect(result.success).toBe(true)
      })

      invalidDirections.forEach(direction => {
        const result = paginationSchema.safeParse({ direction })
        expect(result.success).toBe(false)
      })
    })
  })
})
