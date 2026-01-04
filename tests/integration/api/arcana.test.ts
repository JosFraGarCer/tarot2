import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

// Types for params
interface RouteParams {
  id?: string
}

// Mock data
const mockArcana = {
  id: 1,
  code: 'TEST_ARCANA',
  name: 'Test Arcana',
  description: 'Test description',
  status: 'active',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

const mockArcanaList = {
  success: true,
  data: [mockArcana],
  meta: {
    totalItems: 1,
    page: 1,
    pageSize: 20
  }
}

// Setup MSW server
const server = setupServer(
  http.get('/api/arcana', () => {
    return HttpResponse.json(mockArcanaList)
  }),
  
  http.post('/api/arcana', () => {
    return HttpResponse.json({
      success: true,
      data: { ...mockArcana, id: 2 }
    })
  }),
  
  http.get('/api/arcana/:id', ({ params }: { params: RouteParams }) => {
    return HttpResponse.json({
      success: true,
      data: { ...mockArcana, id: params.id }
    })
  }),
  
  http.patch('/api/arcana/:id', ({ params }: { params: RouteParams }) => {
    return HttpResponse.json({
      success: true,
      data: { ...mockArcana, id: params.id, name: 'Updated Arcana' }
    })
  }),
  
  http.delete('/api/arcana/:id', () => {
    return HttpResponse.json({ success: true })
  })
)

describe('Arcana API Integration', () => {
  beforeEach(() => {
    server.listen()
  })
  
  afterEach(() => {
    server.close()
  })

  it('should fetch arcana list', async () => {
    const response = await fetch('/api/arcana')
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toHaveLength(1)
    expect(data.data[0].code).toBe('TEST_ARCANA')
    expect(data.meta.totalItems).toBe(1)
  })

  it('should create new arcana', async () => {
    const newArcana = {
      code: 'NEW_ARCANA',
      name: 'New Arcana',
      description: 'New description',
      status: 'active'
    }
    
    const response = await fetch('/api/arcana', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newArcana)
    })
    
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.code).toBe('NEW_ARCANA')
    expect(data.data.id).toBe(2)
  })

  it('should fetch single arcana', async () => {
    const response = await fetch('/api/arcana/1')
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.id).toBe(1)
    expect(data.data.code).toBe('TEST_ARCANA')
  })

  it('should update arcana', async () => {
    const updates = {
      name: 'Updated Arcana',
      description: 'Updated description'
    }
    
    const response = await fetch('/api/arcana/1', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    })
    
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.name).toBe('Updated Arcana')
    expect(data.data.id).toBe(1)
  })

  it('should delete arcana', async () => {
    const response = await fetch('/api/arcana/1', {
      method: 'DELETE'
    })
    
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('should handle API errors', async () => {
    // Mock server error
    server.use(
      http.get('/api/arcana', () => {
        return HttpResponse.json(
          { success: false, error: 'Internal Server Error' },
          { status: 500 }
        )
      })
    )
    
    const response = await fetch('/api/arcana')
    
    expect(response.status).toBe(500)
    
    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error).toBe('Internal Server Error')
  })

  it('should handle validation errors', async () => {
    // Mock validation error
    server.use(
      http.post('/api/arcana', () => {
        return HttpResponse.json(
          { 
            success: false, 
            error: 'Validation Error',
            details: {
              code: 'Code is required',
              name: 'Name is required'
            }
          },
          { status: 400 }
        )
      })
    )
    
    const response = await fetch('/api/arcana', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    })
    
    expect(response.status).toBe(400)
    
    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error).toBe('Validation Error')
    expect(data.details).toBeDefined()
  })

  it('should handle not found errors', async () => {
    // Mock not found error
    server.use(
      http.get('/api/arcana/999', () => {
        return HttpResponse.json(
          { success: false, error: 'Arcana not found' },
          { status: 404 }
        )
      })
    )
    
    const response = await fetch('/api/arcana/999')
    
    expect(response.status).toBe(404)
    
    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error).toBe('Arcana not found')
  })

  it('should handle pagination parameters', async () => {
    const response = await fetch('/api/arcana?page=1&pageSize=10')
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.meta.page).toBe(1)
    expect(data.meta.pageSize).toBe(20) // Default from mock
  })

  it('should handle search parameters', async () => {
    const response = await fetch('/api/arcana?search=test')
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('should handle filter parameters', async () => {
    const response = await fetch('/api/arcana?status=active')
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('should handle language parameters', async () => {
    const response = await fetch('/api/arcana?lang=es')
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('should handle bulk operations', async () => {
    // Mock bulk update
    server.use(
      http.patch('/api/arcana/bulk', () => {
        return HttpResponse.json({
          success: true,
          data: { updated: 2, failed: 0 }
        })
      })
    )
    
    const bulkUpdate = {
      ids: [1, 2],
      updates: { status: 'inactive' }
    }
    
    const response = await fetch('/api/arcana/bulk', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bulkUpdate)
    })
    
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.updated).toBe(2)
    expect(data.data.failed).toBe(0)
  })

  it('should handle CORS headers', async () => {
    const response = await fetch('/api/arcana', {
      method: 'OPTIONS'
    })
    
    expect(response.status).toBe(200)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET')
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST')
  })
})
