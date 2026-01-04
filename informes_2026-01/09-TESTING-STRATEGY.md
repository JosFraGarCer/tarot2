# Tarot2 - Estrategia de Testing 2026-01

## Resumen Ejecutivo

Esta estrategia establece un plan completo de testing para Tarot2, incluyendo configuración de herramientas, tipos de tests, cobertura objetivo y CI/CD integration. El objetivo es alcanzar 85% de coverage y establecer testing automatizado robusto.

## Estado Actual del Testing

### Análisis Baseline
- **Cobertura actual**: 0% (no hay tests)
- **Tests manuales**: Limitados y ad-hoc
- **Herramientas**: Ninguna configurada
- **CI/CD**: Sin testing automatizado

### Objetivos de Testing
- **Cobertura**: 0% → 85% en 3 meses
- **Performance**: Tests ejecutándose en < 5 minutos
- **Confiabilidad**: 99% de tests pasando consistentemente
- **Mantenibilidad**: Tests fáciles de escribir y mantener

## Stack de Testing

### Herramientas Principales
```json
{
  "unit": "vitest",
  "integration": "vitest + @vue/test-utils", 
  "e2e": "playwright",
  "coverage": "v8",
  "mocking": "vi.mock",
  "assertions": "@testing-library/jest-dom"
}
```

### Configuración de Vitest
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        global: {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85
        }
      }
    }
  }
})
```

## Estrategia de Testing por Capas

### 1. Unit Tests (70% del esfuerzo)

#### Composables Críticos
```typescript
// tests/unit/composables/useEntity.test.ts
import { describe, it, expect, vi } from 'vitest'
import { renderComposable } from '@vue/test-utils'
import { useEntity } from '@/composables/manage/useEntity'

describe('useEntity', () => {
  it('should fetch list successfully', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      data: [{ id: 1, name: 'Test' }],
      meta: { totalItems: 1 }
    })
    
    vi.mocked($fetch).mockImplementation(mockFetch)
    
    const { result } = renderComposable(() => 
      useEntity({
        resourcePath: '/api/arcana',
        schema: arcanaSchema
      })
    )
    
    await result.fetchList()
    expect(result.items.value).toHaveLength(1)
    expect(result.items.value[0].name).toBe('Test')
  })
})
```

#### Utilidades y Helpers
```typescript
// tests/unit/utils/filters.test.ts
import { describe, it, expect } from 'vitest'
import { buildFilters } from '@/server/utils/filters'

describe('buildFilters', () => {
  it('should build SQL filters correctly', () => {
    const filters = { status: 'active', search: 'test' }
    const result = buildFilters(filters)
    
    expect(result.sql).toBe('status = $1 AND (name ILIKE $2 OR description ILIKE $2)')
    expect(result.params).toEqual(['active', '%test%'])
  })
})
```

#### Componentes Simples
```typescript
// tests/unit/components/StatusBadge.test.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StatusBadge from '@/components/common/StatusBadge.vue'

describe('StatusBadge', () => {
  it('should render with correct color', () => {
    const wrapper = mount(StatusBadge, {
      props: { type: 'status', value: 'active' }
    })
    
    expect(wrapper.text()).toContain('Active')
    expect(wrapper.classes()).toContain('bg-green-100')
  })
})
```

### 2. Integration Tests (20% del esfuerzo)

#### API Endpoints
```typescript
// tests/integration/api/arcana.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { setupTestServer } from '../helpers/setup'

describe('Arcana API', () => {
  beforeAll(setupTestServer)
  
  it('should create arcana successfully', async () => {
    const response = await $fetch('/api/arcana', {
      method: 'POST',
      body: {
        code: 'TEST',
        name: 'Test Arcana',
        status: 'active'
      }
    })
    
    expect(response.success).toBe(true)
    expect(response.data.code).toBe('TEST')
  })
})
```

#### Componentes Complejos
```typescript
// tests/integration/components/EntityBase.test.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EntityBase from '@/components/manage/EntityBase.vue'

describe('EntityBase Integration', () => {
  it('should handle create workflow', async () => {
    const wrapper = mount(EntityBase, {
      props: {
        entityType: 'arcana',
        useCrud: mockCrud
      }
    })
    
    await wrapper.find('[data-testid="create-button"]').trigger('click')
    expect(wrapper.findComponent(FormModal).exists()).toBe(true)
  })
})
```

### 3. E2E Tests (10% del esfuerzo)

#### Flujos Principales
```typescript
// tests/e2e/manage-arcana.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Arcana Management', () => {
  test('should create new arcana', async ({ page }) => {
    await page.goto('/manage')
    await page.click('[data-testid="tab-arcana"]')
    await page.click('[data-testid="create-arcana"]')
    
    await page.fill('[data-testid="code-input"]', 'TEST')
    await page.fill('[data-testid="name-input"]', 'Test Arcana')
    await page.selectOption('[data-testid="status-select"]', 'active')
    await page.click('[data-testid="save-button"]')
    
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
  })
})
```

## Configuración de CI/CD

### GitHub Actions Workflow
```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run test:unit -- --coverage
      - uses: codecov/codecov-action@v3

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run build
      - run: npm run test:e2e
```

## Plan de Implementación

### Fase 1: Setup (Semana 1)
- [ ] Configurar Vitest y dependencias
- [ ] Crear estructura de tests
- [ ] Configurar CI/CD pipeline
- [ ] Escribir primeros tests unitarios

### Fase 2: Unit Tests (Semanas 2-4)
- [ ] Tests para composables críticos (useEntity, useEntityCapabilities)
- [ ] Tests para utilidades (filters, response helpers)
- [ ] Tests para componentes simples (StatusBadge, EntitySummary)
- [ ] Objetivo: 60% coverage

### Fase 3: Integration Tests (Semanas 5-6)
- [ ] Tests para APIs principales
- [ ] Tests para componentes complejos
- [ ] Tests para workflows completos
- [ ] Objetivo: 75% coverage

### Fase 4: E2E Tests (Semanas 7-8)
- [ ] Tests para flujos principales de usuario
- [ ] Tests para casos edge
- [ ] Tests de regresión
- [ ] Objetivo: 85% coverage

## Métricas y Objetivos

### Coverage Targets
- **Semana 2**: 30%
- **Semana 4**: 60%
- **Semana 6**: 75%
- **Semana 8**: 85%

### Performance Targets
- **Unit Tests**: < 2 minutos
- **Integration Tests**: < 3 minutos
- **E2E Tests**: < 5 minutos
- **Total CI Time**: < 10 minutos

## Conclusión

Esta estrategia establece las bases para un testing robusto en Tarot2, con objetivos claros y un plan de implementación gradual que minimiza riesgos mientras maximiza la calidad del código.

---

*Estrategia de testing generada el 4 de enero de 2026*
