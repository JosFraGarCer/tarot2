import { describe, it, expect } from 'vitest'

// Lógica de procesamiento de datos pura
class DataTransformers {
  static transformEntityForDisplay(entity: any) {
    if (!entity) return null

    return {
      id: entity.id,
      name: entity.name || 'Unnamed',
      status: entity.status || 'unknown',
      displayName: this.formatDisplayName(entity.name),
      formattedDate: this.formatDate(entity.created_at),
      tags: this.formatTags(entity.tags),
      description: this.truncateText(entity.description, 100)
    }
  }

  static formatDisplayName(name: string): string {
    if (!name) return 'Unknown'
    return name
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
  }

  static formatDate(dateString: string): string {
    if (!dateString) return 'N/A'
    
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  static formatTags(tags: string[]): string {
    if (!tags || !Array.isArray(tags)) return 'No tags'
    return tags.join(', ')
  }

  static truncateText(text: string, maxLength: number): string {
    if (!text) return ''
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength - 3) + '...'
  }

  static normalizeEntityData(data: any) {
    if (!data) return null

    return {
      ...data,
      name: data.name?.trim(),
      code: data.code?.toUpperCase(),
      status: data.status?.toLowerCase(),
      created_at: data.created_at ? new Date(data.created_at).toISOString() : null,
      updated_at: data.updated_at ? new Date(data.updated_at).toISOString() : null
    }
  }

  static groupEntitiesByStatus(entities: any[]) {
    return entities.reduce((groups, entity) => {
      const status = entity.status || 'unknown'
      if (!groups[status]) {
        groups[status] = []
      }
      groups[status].push(entity)
      return groups
    }, {} as Record<string, any[]>)
  }

  static calculateEntityMetrics(entities: any[]) {
    const total = entities.length
    const byStatus = this.groupEntitiesByStatus(entities)
    
    const metrics = {
      total,
      byStatus: {} as Record<string, number>,
      averageAge: 0,
      recentCount: 0,
      oldestDate: null as Date | null,
      newestDate: null as Date | null
    }

    // Count by status
    Object.entries(byStatus).forEach(([status, items]) => {
      metrics.byStatus[status] = items.length
    })

    // Calculate dates and age
    const dates = entities
      .map(e => e.created_at ? new Date(e.created_at) : null)
      .filter(Boolean) as Date[]

    if (dates.length > 0) {
      dates.sort((a, b) => a.getTime() - b.getTime())
      metrics.oldestDate = dates[0]
      metrics.newestDate = dates[dates.length - 1]
      
      // Calculate average age in days
      const now = new Date()
      const totalAge = dates.reduce((sum, date) => {
        return sum + (now.getTime() - date.getTime())
      }, 0)
      metrics.averageAge = Math.round(totalAge / dates.length / (1000 * 60 * 60 * 24))
    }

    // Count recent (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    metrics.recentCount = dates.filter(date => date > thirtyDaysAgo).length

    return metrics
  }

  static filterEntities(entities: any[], filters: any) {
    return entities.filter(entity => {
      if (filters.status && entity.status !== filters.status) {
        return false
      }

      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        const searchableText = `${entity.name} ${entity.description}`.toLowerCase()
        if (!searchableText.includes(searchTerm)) {
          return false
        }
      }

      if (filters.dateFrom) {
        const entityDate = new Date(entity.created_at)
        const fromDate = new Date(filters.dateFrom)
        if (entityDate < fromDate) {
          return false
        }
      }

      if (filters.dateTo) {
        const entityDate = new Date(entity.created_at)
        const toDate = new Date(filters.dateTo)
        if (entityDate > toDate) {
          return false
        }
      }

      if (filters.tags && filters.tags.length > 0) {
        const entityTags = entity.tags || []
        const hasMatchingTag = filters.tags.some((tag: string) => 
          entityTags.includes(tag)
        )
        if (!hasMatchingTag) {
          return false
        }
      }

      return true
    })
  }

  static sortEntities(entities: any[], sortBy: string, sortOrder: 'asc' | 'desc' = 'asc') {
    if (!sortBy) return entities

    return [...entities].sort((a, b) => {
      let aVal = a[sortBy]
      let bVal = b[sortBy]

      // Handle dates
      if (sortBy.includes('date') || sortBy.includes('created') || sortBy.includes('updated')) {
        aVal = aVal ? new Date(aVal).getTime() : 0
        bVal = bVal ? new Date(bVal).getTime() : 0
      }

      // Handle strings
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        aVal = aVal.toLowerCase()
        bVal = bVal.toLowerCase()
      }

      if (aVal === bVal) return 0
      if (aVal === undefined || aVal === null) return 1
      if (bVal === undefined || bVal === null) return -1

      const comparison = aVal < bVal ? -1 : 1
      return sortOrder === 'asc' ? comparison : -comparison
    })
  }

  static validateEntityData(entity: any) {
    const errors: string[] = []

    if (!entity) {
      errors.push('Entity is required')
      return { isValid: false, errors }
    }

    if (!entity.id) {
      errors.push('ID is required')
    }

    if (!entity.name || entity.name.trim().length === 0) {
      errors.push('Name is required')
    }

    if (entity.name && entity.name.length > 100) {
      errors.push('Name must be less than 100 characters')
    }

    if (entity.code && !/^[A-Z0-9_]+$/.test(entity.code)) {
      errors.push('Code must contain only uppercase letters, numbers, and underscores')
    }

    if (entity.description && entity.description.length > 1000) {
      errors.push('Description must be less than 1000 characters')
    }

    const validStatuses = ['active', 'inactive', 'draft', 'archived']
    if (entity.status && !validStatuses.includes(entity.status)) {
      errors.push(`Status must be one of: ${validStatuses.join(', ')}`)
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  static generateEntityReport(entities: any[]) {
    const metrics = this.calculateEntityMetrics(entities)
    const byStatus = this.groupEntitiesByStatus(entities)

    const report = {
      summary: {
        totalEntities: metrics.total,
        recentActivity: metrics.recentCount,
        averageAge: metrics.averageAge
      },
      statusBreakdown: Object.entries(metrics.byStatus).map(([status, count]) => ({
        status,
        count,
        percentage: Math.round((count / metrics.total) * 100)
      })),
      dateRange: {
        oldest: metrics.oldestDate?.toISOString(),
        newest: metrics.newestDate?.toISOString()
      },
      topTags: this.getTopTags(entities),
      recommendations: this.generateRecommendations(metrics, byStatus)
    }

    return report
  }

  static getTopTags(entities: any[]) {
    const tagCounts: Record<string, number> = {}
    
    entities.forEach(entity => {
      if (entity.tags && Array.isArray(entity.tags)) {
        entity.tags.forEach((tag: string) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1
        })
      }
    })

    return Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }))
  }

  static generateRecommendations(metrics: any, byStatus: Record<string, any[]>) {
    const recommendations: string[] = []

    if (metrics.byStatus.draft && metrics.byStatus.draft.length > metrics.total * 0.3) {
      recommendations.push('Consider reviewing or publishing draft entities')
    }

    if (metrics.byStatus.inactive && metrics.byStatus.inactive.length > metrics.total * 0.2) {
      recommendations.push('Review inactive entities for potential cleanup')
    }

    if (metrics.averageAge > 365) {
      recommendations.push('Consider updating older entities')
    }

    if (metrics.recentCount < metrics.total * 0.1) {
      recommendations.push('Low recent activity - consider content updates')
    }

    return recommendations
  }
}

describe('Data Transformers', () => {
  describe('transformEntityForDisplay', () => {
    it('should transform entity for display', () => {
      const entity = {
        id: 1,
        name: 'test_entity',
        status: 'ACTIVE',
        created_at: '2024-01-15T10:00:00Z',
        tags: ['tag1', 'tag2'],
        description: 'This is a test entity description that is quite long'
      }

      const result = DataTransformers.transformEntityForDisplay(entity)

      expect(result.id).toBe(1)
      expect(result.name).toBe('test_entity')
      expect(result.status).toBe('ACTIVE')
      expect(result.displayName).toBe('Test Entity')
      expect(result.formattedDate).toBe('Jan 15, 2024')
      expect(result.tags).toBe('tag1, tag2')
      expect(result.description).toBe('This is a test entity description that is quite long')
    })

    it('should handle null entity', () => {
      const result = DataTransformers.transformEntityForDisplay(null)
      expect(result).toBeNull()
    })

    it('should handle missing fields', () => {
      const entity = { id: 1 }

      const result = DataTransformers.transformEntityForDisplay(entity)

      expect(result.name).toBe('Unnamed')
      expect(result.status).toBe('unknown')
      expect(result.formattedDate).toBe('N/A')
      expect(result.tags).toBe('No tags')
      expect(result.description).toBe('')
    })
  })

  describe('formatDisplayName', () => {
    it('should format snake_case to Title Case', () => {
      expect(DataTransformers.formatDisplayName('test_entity')).toBe('Test Entity')
      expect(DataTransformers.formatDisplayName('another_test_case')).toBe('Another Test Case')
    })

    it('should handle empty string', () => {
      expect(DataTransformers.formatDisplayName('')).toBe('Unknown')
    })

    it('should handle null', () => {
      expect(DataTransformers.formatDisplayName(null as any)).toBe('Unknown')
    })
  })

  describe('formatDate', () => {
    it('should format ISO date string', () => {
      const result = DataTransformers.formatDate('2024-01-15T10:00:00Z')
      expect(result).toBe('Jan 15, 2024')
    })

    it('should handle null date', () => {
      expect(DataTransformers.formatDate(null as any)).toBe('N/A')
    })
  })

  describe('formatTags', () => {
    it('should format tags array', () => {
      expect(DataTransformers.formatTags(['tag1', 'tag2', 'tag3'])).toBe('tag1, tag2, tag3')
    })

    it('should handle empty array', () => {
      expect(DataTransformers.formatTags([])).toBe('No tags')
    })

    it('should handle null', () => {
      expect(DataTransformers.formatTags(null as any)).toBe('No tags')
    })
  })

  describe('truncateText', () => {
    it('should truncate long text', () => {
      const longText = 'This is a very long text that should be truncated'
      const result = DataTransformers.truncateText(longText, 20)
      expect(result).toBe('This is a very long ...')
    })

    it('should not truncate short text', () => {
      const shortText = 'Short text'
      const result = DataTransformers.truncateText(shortText, 20)
      expect(result).toBe('Short text')
    })

    it('should handle null text', () => {
      expect(DataTransformers.truncateText(null as any, 20)).toBe('')
    })
  })

  describe('normalizeEntityData', () => {
    it('should normalize entity data', () => {
      const entity = {
        name: '  Test Entity  ',
        code: 'test_code',
        status: 'ACTIVE',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-16T10:00:00Z'
      }

      const result = DataTransformers.normalizeEntityData(entity)

      expect(result.name).toBe('Test Entity')
      expect(result.code).toBe('TEST_CODE')
      expect(result.status).toBe('active')
      expect(result.created_at).toBe('2024-01-15T10:00:00.000Z')
      expect(result.updated_at).toBe('2024-01-16T10:00:00.000Z')
    })

    it('should handle null entity', () => {
      const result = DataTransformers.normalizeEntityData(null)
      expect(result).toBeNull()
    })
  })

  describe('groupEntitiesByStatus', () => {
    it('should group entities by status', () => {
      const entities = [
        { id: 1, status: 'active' },
        { id: 2, status: 'inactive' },
        { id: 3, status: 'active' },
        { id: 4, status: 'draft' }
      ]

      const result = DataTransformers.groupEntitiesByStatus(entities)

      expect(result.active).toHaveLength(2)
      expect(result.inactive).toHaveLength(1)
      expect(result.draft).toHaveLength(1)
    })

    it('should handle entities without status', () => {
      const entities = [
        { id: 1 },
        { id: 2, status: 'active' }
      ]

      const result = DataTransformers.groupEntitiesByStatus(entities)

      expect(result.unknown).toHaveLength(1)
      expect(result.active).toHaveLength(1)
    })
  })

  describe('calculateEntityMetrics', () => {
    it('should calculate metrics correctly', () => {
      const entities = [
        { id: 1, status: 'active', created_at: '2024-01-01T00:00:00Z' },
        { id: 2, status: 'inactive', created_at: '2024-01-15T00:00:00Z' },
        { id: 3, status: 'active', created_at: '2024-01-20T00:00:00Z' }
      ]

      const metrics = DataTransformers.calculateEntityMetrics(entities)

      expect(metrics.total).toBe(3)
      expect(metrics.byStatus.active).toBe(2)
      expect(metrics.byStatus.inactive).toBe(1)
      expect(metrics.recentCount).toBe(3)
      expect(metrics.averageAge).toBeGreaterThan(0)
    })

    it('should handle empty entities array', () => {
      const metrics = DataTransformers.calculateEntityMetrics([])

      expect(metrics.total).toBe(0)
      expect(metrics.byStatus).toEqual({})
      expect(metrics.recentCount).toBe(0)
      expect(metrics.averageAge).toBe(0)
    })
  })

  describe('filterEntities', () => {
    it('should filter by status', () => {
      const entities = [
        { id: 1, status: 'active' },
        { id: 2, status: 'inactive' },
        { id: 3, status: 'active' }
      ]

      const result = DataTransformers.filterEntities(entities, { status: 'active' })

      expect(result).toHaveLength(2)
      expect(result.every(e => e.status === 'active')).toBe(true)
    })

    it('should filter by search term', () => {
      const entities = [
        { id: 1, name: 'Test Entity', description: 'Description 1' },
        { id: 2, name: 'Another Entity', description: 'Description 2' }
      ]

      const result = DataTransformers.filterEntities(entities, { search: 'test' })

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Test Entity')
    })

    it('should filter by date range', () => {
      const entities = [
        { id: 1, created_at: '2024-01-01T00:00:00Z' },
        { id: 2, created_at: '2024-01-15T00:00:00Z' },
        { id: 3, created_at: '2024-01-30T00:00:00Z' }
      ]

      const result = DataTransformers.filterEntities(entities, {
        dateFrom: '2024-01-10',
        dateTo: '2024-01-20'
      })

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(2)
    })

    it('should filter by tags', () => {
      const entities = [
        { id: 1, tags: ['tag1', 'tag2'] },
        { id: 2, tags: ['tag2', 'tag3'] },
        { id: 3, tags: ['tag3'] }
      ]

      const result = DataTransformers.filterEntities(entities, { tags: ['tag1'] })

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(1)
    })
  })

  describe('sortEntities', () => {
    it('should sort by name ascending', () => {
      const entities = [
        { id: 1, name: 'Charlie' },
        { id: 2, name: 'Alice' },
        { id: 3, name: 'Bob' }
      ]

      const result = DataTransformers.sortEntities(entities, 'name', 'asc')

      expect(result[0].name).toBe('Alice')
      expect(result[1].name).toBe('Bob')
      expect(result[2].name).toBe('Charlie')
    })

    it('should sort by date descending', () => {
      const entities = [
        { id: 1, created_at: '2024-01-01T00:00:00Z' },
        { id: 2, created_at: '2024-01-15T00:00:00Z' },
        { id: 3, created_at: '2024-01-10T00:00:00Z' }
      ]

      const result = DataTransformers.sortEntities(entities, 'created_at', 'desc')

      expect(result[0].id).toBe(2)
      expect(result[1].id).toBe(3)
      expect(result[2].id).toBe(1)
    })

    it('should return original array if no sort field', () => {
      const entities = [{ id: 1 }, { id: 2 }]
      const result = DataTransformers.sortEntities(entities, '')

      expect(result).toEqual(entities)
    })
  })

  describe('validateEntityData', () => {
    it('should validate valid entity', () => {
      const entity = {
        id: 1,
        name: 'Test Entity',
        code: 'TEST_ENTITY',
        status: 'active',
        description: 'Test description'
      }

      const result = DataTransformers.validateEntityData(entity)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should validate invalid entity', () => {
      const entity = {
        name: '',
        code: 'invalid code',
        status: 'invalid_status',
        description: 'x'.repeat(1001)
      }

      const result = DataTransformers.validateEntityData(entity)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should handle null entity', () => {
      const result = DataTransformers.validateEntityData(null)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Entity is required')
    })
  })

  describe('generateEntityReport', () => {
    it('should generate comprehensive report', () => {
      const entities = [
        { id: 1, status: 'active', created_at: '2024-01-01T00:00:00Z', tags: ['tag1'] },
        { id: 2, status: 'inactive', created_at: '2024-01-15T00:00:00Z', tags: ['tag1', 'tag2'] },
        { id: 3, status: 'active', created_at: '2024-01-20T00:00:00Z', tags: ['tag2'] }
      ]

      const report = DataTransformers.generateEntityReport(entities)

      expect(report.summary.totalEntities).toBe(3)
      expect(report.statusBreakdown).toHaveLength(2)
      expect(report.dateRange.oldest).toBeDefined()
      expect(report.dateRange.newest).toBeDefined()
      expect(report.topTags).toHaveLength(2)
      expect(report.recommendations).toBeDefined()
    })

    it('should handle empty entities', () => {
      const report = DataTransformers.generateEntityReport([])

      expect(report.summary.totalEntities).toBe(0)
      expect(report.statusBreakdown).toEqual([])
      expect(report.topTags).toEqual([])
    })
  })

  describe('getTopTags', () => {
    it('should get top tags by frequency', () => {
      const entities = [
        { id: 1, tags: ['tag1', 'tag2'] },
        { id: 2, tags: ['tag1', 'tag3'] },
        { id: 3, tags: ['tag2', 'tag3'] }
      ]

      const topTags = DataTransformers.getTopTags(entities)

      expect(topTags[0].tag).toBe('tag1')
      expect(topTags[0].count).toBe(2)
      expect(topTags).toHaveLength(3)
    })
  })

  describe('generateRecommendations', () => {
    it('should generate relevant recommendations', () => {
      const metrics = {
        byStatus: {
          draft: 15,
          inactive: 8,
          active: 10
        },
        averageAge: 400,
        recentCount: 1
      }

      const byStatus = {
        draft: Array(15).fill({}),
        inactive: Array(8).fill({}),
        active: Array(10).fill({})
      }

      const recommendations = DataTransformers.generateRecommendations(metrics, byStatus)

      expect(recommendations.length).toBeGreaterThan(0)
      expect(recommendations.some(r => r.toLowerCase().includes('draft'))).toBe(true)
    })
  })
})
