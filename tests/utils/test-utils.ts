import { render } from '@testing-library/vue'
import { vi } from 'vitest'

// Utilidades para renderizar componentes
export function renderComponent(component: any, options: any = {}) {
  return render(component, {
    global: {
      plugins: []
    },
    ...options
  })
}

// Utilidades para renderizar composables
export function renderComposable(composable: Function, options: any = {}) {
  const renderResult = render(composable, options)
  return { 
    result: renderResult
  }
}

// Mock data para tests
export const mockArcana = {
  id: 1,
  code: 'TEST_ARCANA',
  name: 'Test Arcana',
  description: 'Test description',
  status: 'active',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

export const mockBaseCard = {
  id: 1,
  code: 'TEST_CARD',
  name: 'Test Card',
  description: 'Test card description',
  card_type_id: 1,
  status: 'active',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

export const mockUser = {
  id: 1,
  email: 'test@example.com',
  username: 'testuser',
  status: 'active',
  roles: ['user']
}

// Mock responses para API calls
export const mockApiResponses = {
  arcana: {
    list: {
      success: true,
      data: [mockArcana],
      meta: {
        totalItems: 1,
        page: 1,
        pageSize: 20
      }
    },
    create: {
      success: true,
      data: mockArcana
    },
    update: {
      success: true,
      data: { ...mockArcana, name: 'Updated Arcana' }
    },
    delete: {
      success: true
    }
  },
  baseCard: {
    list: {
      success: true,
      data: [mockBaseCard],
      meta: {
        totalItems: 1,
        page: 1,
        pageSize: 20
      }
    }
  }
}

// Utilidades para mock de $fetch
export function setupApiMocks() {
  const mockFetch = vi.fn()
  
  mockFetch.mockImplementation((url: string, options?: any) => {
    if (url.includes('/api/arcana') && !url.includes('/api/arcana/')) {
      if (options?.method === 'POST') {
        return Promise.resolve(mockApiResponses.arcana.create)
      }
      return Promise.resolve(mockApiResponses.arcana.list)
    }
    
    if (url.includes('/api/arcana/') && !url.includes('/api/arcana//')) {
      if (options?.method === 'PATCH') {
        return Promise.resolve(mockApiResponses.arcana.update)
      }
      if (options?.method === 'DELETE') {
        return Promise.resolve(mockApiResponses.arcana.delete)
      }
      return Promise.resolve({ success: true, data: mockArcana })
    }
    
    if (url.includes('/api/base_card')) {
      return Promise.resolve(mockApiResponses.baseCard.list)
    }
    
    return Promise.resolve({ success: true, data: [] })
  })
  
  return mockFetch
}
