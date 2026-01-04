import { describe, it, expect } from 'vitest'

// Lógica de negocio pura para operaciones de entidades
class EntityOperations {
  static validateEntityData(data: any, schema: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data) {
      errors.push('Data is required')
      return { isValid: false, errors }
    }

    if (schema.required) {
      schema.required.forEach((field: string) => {
        if (!data[field]) {
          errors.push(`${field} is required`)
        }
      })
    }

    if (schema.types) {
      Object.entries(schema.types).forEach(([field, type]) => {
        if (data[field] !== undefined) {
          const actualType = typeof data[field]
          if (actualType !== type) {
            errors.push(`${field} must be of type ${type}, got ${actualType}`)
          }
        }
      })
    }

    if (schema.maxLength) {
      Object.entries(schema.maxLength).forEach(([field, maxLen]) => {
        if (data[field] && data[field].length > maxLen) {
          errors.push(`${field} must be at most ${maxLen} characters`)
        }
      })
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  static buildEntityQuery(filters: any): { where: string; params: any[] } {
    const where: string[] = []
    const params: any[] = []
    let paramIndex = 1

    if (filters.status) {
      where.push(`status = $${paramIndex}`)
      params.push(filters.status)
      paramIndex++
    }

    if (filters.search) {
      where.push(`(name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`)
      params.push(`%${filters.search}%`)
      paramIndex++
    }

    if (filters.lang) {
      where.push(`lang = $${paramIndex}`)
      params.push(filters.lang)
      paramIndex++
    }

    if (filters.dateFrom) {
      where.push(`created_at >= $${paramIndex}`)
      params.push(filters.dateFrom)
      paramIndex++
    }

    if (filters.dateTo) {
      where.push(`created_at <= $${paramIndex}`)
      params.push(filters.dateTo)
      paramIndex++
    }

    return {
      where: where.length > 0 ? `WHERE ${where.join(' AND ')}` : '',
      params
    }
  }

  static paginateResults(data: any[], page: number, pageSize: number) {
    const totalItems = data.length
    const totalPages = Math.ceil(totalItems / pageSize)
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    const items = data.slice(startIndex, endIndex)

    return {
      data: items,
      meta: {
        totalItems,
        page,
        pageSize,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    }
  }

  static sortResults(data: any[], sortBy: string, sortOrder: 'asc' | 'desc' = 'asc') {
    if (!sortBy) return data

    return [...data].sort((a, b) => {
      const aVal = a[sortBy]
      const bVal = b[sortBy]

      if (aVal === bVal) return 0

      const comparison = aVal < bVal ? -1 : 1
      return sortOrder === 'asc' ? comparison : -comparison
    })
  }

  static formatEntityResponse(data: any, meta?: any) {
    return {
      success: true,
      data,
      ...(meta && { meta })
    }
  }

  static calculateEntityStats(entities: any[]) {
    const stats = {
      total: entities.length,
      byStatus: {} as Record<string, number>,
      byLang: {} as Record<string, number>,
      recentActivity: 0
    }

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    entities.forEach(entity => {
      // Count by status
      const status = entity.status || 'unknown'
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1

      // Count by language
      const lang = entity.lang || 'en'
      stats.byLang[lang] = (stats.byLang[lang] || 0) + 1

      // Count recent activity
      if (entity.updated_at && new Date(entity.updated_at) > thirtyDaysAgo) {
        stats.recentActivity++
      }
    })

    return stats
  }

  static validatePaginationParams(page: number, pageSize: number) {
    const errors: string[] = []

    if (!Number.isInteger(page) || page < 1) {
      errors.push('Page must be a positive integer')
    }

    if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 1000) {
      errors.push('PageSize must be an integer between 1 and 1000')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  static sanitizeInput(input: string): string {
    if (typeof input !== 'string') return input

    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .substring(0, 1000) // Limit length
  }

  static generateEntityId(): string {
    return `entity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

describe('Entity Operations Business Logic', () => {
  describe('validateEntityData', () => {
    it('should validate required fields', () => {
      const schema = {
        required: ['name', 'code']
      }

      const result = EntityOperations.validateEntityData({}, schema)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('name is required')
      expect(result.errors).toContain('code is required')
    })

    it('should validate data types', () => {
      const schema = {
        types: {
          name: 'string',
          age: 'number',
          active: 'boolean'
        }
      }

      const data = {
        name: 'Test',
        age: '25', // Should be number
        active: true
      }

      const result = EntityOperations.validateEntityData(data, schema)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('age must be of type number, got string')
    })

    it('should validate max length', () => {
      const schema = {
        maxLength: {
          name: 10,
          description: 50
        }
      }

      const data = {
        name: 'Very long name that exceeds limit',
        description: 'Short description'
      }

      const result = EntityOperations.validateEntityData(data, schema)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('name must be at most 10 characters')
    })

    it('should pass validation for valid data', () => {
      const schema = {
        required: ['name'],
        types: {
          name: 'string',
          age: 'number'
        },
        maxLength: {
          name: 50
        }
      }

      const data = {
        name: 'Valid Name',
        age: 25
      }

      const result = EntityOperations.validateEntityData(data, schema)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should handle null data', () => {
      const schema = {
        required: ['name']
      }

      const result = EntityOperations.validateEntityData(null, schema)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Data is required')
    })
  })

  describe('buildEntityQuery', () => {
    it('should build query with status filter', () => {
      const filters = { status: 'active' }
      const result = EntityOperations.buildEntityQuery(filters)

      expect(result.where).toBe('WHERE status = $1')
      expect(result.params).toEqual(['active'])
    })

    it('should build query with search filter', () => {
      const filters = { search: 'test' }
      const result = EntityOperations.buildEntityQuery(filters)

      expect(result.where).toContain('name ILIKE $1')
      expect(result.params).toEqual(['%test%'])
    })

    it('should build query with multiple filters', () => {
      const filters = {
        status: 'active',
        search: 'test',
        lang: 'es'
      }
      const result = EntityOperations.buildEntityQuery(filters)

      expect(result.where).toContain('status = $1')
      expect(result.where).toContain('name ILIKE $2')
      expect(result.where).toContain('lang = $3')
      expect(result.params).toHaveLength(3)
    })

    it('should handle empty filters', () => {
      const filters = {}
      const result = EntityOperations.buildEntityQuery(filters)

      expect(result.where).toBe('')
      expect(result.params).toEqual([])
    })

    it('should handle date range filters', () => {
      const filters = {
        dateFrom: '2024-01-01',
        dateTo: '2024-12-31'
      }
      const result = EntityOperations.buildEntityQuery(filters)

      expect(result.where).toContain('created_at >= $1')
      expect(result.where).toContain('created_at <= $2')
      expect(result.params).toEqual(['2024-01-01', '2024-12-31'])
    })
  })

  describe('paginateResults', () => {
    it('should paginate results correctly', () => {
      const data = Array.from({ length: 25 }, (_, i) => ({ id: i + 1 }))
      const result = EntityOperations.paginateResults(data, 2, 10)

      expect(result.data).toHaveLength(10)
      expect(result.data[0].id).toBe(11)
      expect(result.data[9].id).toBe(20)
      expect(result.meta.page).toBe(2)
      expect(result.meta.pageSize).toBe(10)
      expect(result.meta.totalItems).toBe(25)
      expect(result.meta.totalPages).toBe(3)
    })

    it('should handle last page', () => {
      const data = Array.from({ length: 25 }, (_, i) => ({ id: i + 1 }))
      const result = EntityOperations.paginateResults(data, 3, 10)

      expect(result.data).toHaveLength(5)
      expect(result.meta.hasNextPage).toBe(false)
      expect(result.meta.hasPreviousPage).toBe(true)
    })

    it('should handle empty data', () => {
      const data = []
      const result = EntityOperations.paginateResults(data, 1, 10)

      expect(result.data).toEqual([])
      expect(result.meta.totalItems).toBe(0)
      expect(result.meta.totalPages).toBe(0)
    })

    it('should handle page beyond data', () => {
      const data = Array.from({ length: 5 }, (_, i) => ({ id: i + 1 }))
      const result = EntityOperations.paginateResults(data, 10, 10)

      expect(result.data).toEqual([])
      expect(result.meta.page).toBe(10)
    })
  })

  describe('sortResults', () => {
    it('should sort by field ascending', () => {
      const data = [
        { name: 'Charlie', age: 30 },
        { name: 'Alice', age: 25 },
        { name: 'Bob', age: 35 }
      ]

      const result = EntityOperations.sortResults(data, 'name', 'asc')

      expect(result[0].name).toBe('Alice')
      expect(result[1].name).toBe('Bob')
      expect(result[2].name).toBe('Charlie')
    })

    it('should sort by field descending', () => {
      const data = [
        { name: 'Charlie', age: 30 },
        { name: 'Alice', age: 25 },
        { name: 'Bob', age: 35 }
      ]

      const result = EntityOperations.sortResults(data, 'age', 'desc')

      expect(result[0].age).toBe(35)
      expect(result[1].age).toBe(30)
      expect(result[2].age).toBe(25)
    })

    it('should return original array if no sort field', () => {
      const data = [{ id: 1 }, { id: 2 }]
      const result = EntityOperations.sortResults(data, '')

      expect(result).toEqual(data)
    })

    it('should handle undefined values', () => {
      const data = [
        { name: 'Alice', value: 10 },
        { name: 'Bob', value: undefined },
        { name: 'Charlie', value: 5 }
      ]

      const result = EntityOperations.sortResults(data, 'value', 'asc')

      expect(result[0].value).toBe(5)
      expect(result[1].value).toBe(10)
      expect(result[2].value).toBeUndefined()
    })
  })

  describe('formatEntityResponse', () => {
    it('should format response with data only', () => {
      const data = { id: 1, name: 'Test' }
      const result = EntityOperations.formatEntityResponse(data)

      expect(result).toEqual({
        success: true,
        data: { id: 1, name: 'Test' }
      })
    })

    it('should format response with data and meta', () => {
      const data = { id: 1, name: 'Test' }
      const meta = { page: 1, total: 10 }
      const result = EntityOperations.formatEntityResponse(data, meta)

      expect(result).toEqual({
        success: true,
        data: { id: 1, name: 'Test' },
        meta: { page: 1, total: 10 }
      })
    })
  })

  describe('calculateEntityStats', () => {
    it('should calculate basic stats', () => {
      const entities = [
        { status: 'active', lang: 'en', updated_at: '2024-01-15' },
        { status: 'inactive', lang: 'es', updated_at: '2024-01-10' },
        { status: 'active', lang: 'en', updated_at: '2023-12-01' }
      ]

      const stats = EntityOperations.calculateEntityStats(entities)

      expect(stats.total).toBe(3)
      expect(stats.byStatus.active).toBe(2)
      expect(stats.byStatus.inactive).toBe(1)
      expect(stats.byLang.en).toBe(2)
      expect(stats.byLang.es).toBe(1)
      expect(stats.recentActivity).toBe(2)
    })

    it('should handle empty entities', () => {
      const stats = EntityOperations.calculateEntityStats([])

      expect(stats.total).toBe(0)
      expect(stats.byStatus).toEqual({})
      expect(stats.byLang).toEqual({})
      expect(stats.recentActivity).toBe(0)
    })
  })

  describe('validatePaginationParams', () => {
    it('should validate correct pagination params', () => {
      const result = EntityOperations.validatePaginationParams(1, 20)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should validate invalid page', () => {
      const result = EntityOperations.validatePaginationParams(0, 20)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Page must be a positive integer')
    })

    it('should validate invalid pageSize', () => {
      const result = EntityOperations.validatePaginationParams(1, 0)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('PageSize must be an integer between 1 and 1000')
    })

    it('should validate pageSize too large', () => {
      const result = EntityOperations.validatePaginationParams(1, 2000)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('PageSize must be an integer between 1 and 1000')
    })
  })

  describe('sanitizeInput', () => {
    it('should sanitize HTML tags', () => {
      const input = '<script>alert("test")</script>Hello'
      const result = EntityOperations.sanitizeInput(input)

      expect(result).toBe('scriptalert("test")/scriptHello')
    })

    it('should trim whitespace', () => {
      const input = '  hello world  '
      const result = EntityOperations.sanitizeInput(input)

      expect(result).toBe('hello world')
    })

    it('should limit length', () => {
      const input = 'a'.repeat(2000)
      const result = EntityOperations.sanitizeInput(input)

      expect(result.length).toBe(1000)
    })

    it('should handle non-string input', () => {
      const input = 123
      const result = EntityOperations.sanitizeInput(input)

      expect(result).toBe(123)
    })
  })

  describe('generateEntityId', () => {
    it('should generate unique IDs', () => {
      const id1 = EntityOperations.generateEntityId()
      const id2 = EntityOperations.generateEntityId()

      expect(id1).not.toBe(id2)
    })

    it('should generate IDs with correct format', () => {
      const id = EntityOperations.generateEntityId()

      expect(id).toMatch(/^entity_\d+_[a-z0-9]+$/)
    })
  })
})
