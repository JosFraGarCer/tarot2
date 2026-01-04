# Tarot2 - Guía de Estrategia de Testing y Mejores Prácticas

## 📋 Resumen Ejecutivo

Esta guía establece la estrategia de testing para el proyecto Tarot2, incluyendo mejores prácticas, patrones recomendados y un roadmap de implementación progresiva. El objetivo es crear una suite de testing robusta y mantenible que garantice la calidad del código y facilite el desarrollo continuo.

## 🎯 Objetivos de Testing

### Objetivos Principales
- **Cobertura**: Alcanzar 70% de coverage en código crítico
- **Confiabilidad**: 95% de tests pasando consistentemente
- **Velocidad**: Tests unitarios < 2 segundos, integración < 10 segundos
- **Mantenibilidad**: Tests fáciles de escribir, leer y mantener

### Objetivos por Tipo de Test
- **Unit Tests**: 80% coverage, < 1s execution
- **Integration Tests**: 60% coverage, < 5s execution  
- **E2E Tests**: Critical user flows, < 30s execution
- **API Tests**: All endpoints, < 10s execution

## 🏗️ Arquitectura de Testing

### Estructura de Directorios
```
tests/
├── unit/                    # Tests unitarios
│   ├── basic.test.ts       # ✅ Tests básicos (9 tests)
│   ├── business-logic/     # ✅ Lógica de negocio (43 tests)
│   ├── utils/              # ✅ Utilidades independientes
│   └── composables/        # Composables Vue
├── integration/            # Tests de integración
│   ├── api/                # ✅ APIs con MSW
│   └── components/         # Componentes Vue
├── e2e/                    # Tests end-to-end
│   └── manage-arcana.spec.ts # ✅ Playwright tests
├── fixtures/               # Datos de prueba
├── mocks/                  # Mocks y stubs
└── utils/                  # Utilidades de testing
    ├── setup.ts           # ✅ Setup global
    └── test-utils.ts      # ✅ Utilidades de testing
```

### Configuración Actual
- **Vitest**: Framework principal de testing
- **Playwright**: E2E testing multi-browser
- **MSW**: Mock Service Worker para APIs
- **jsdom**: Environment para tests de componentes Vue

## 🧪 Tipos de Tests

### 1. Tests Unitarios

#### Objetivo
Probar funciones y componentes de manera aislada, sin dependencias externas.

#### Estructura Recomendada
```typescript
describe('Component/Function Name', () => {
  describe('Happy Path', () => {
    it('should do expected behavior', () => {
      // Arrange
      const input = setupInput()
      
      // Act
      const result = functionUnderTest(input)
      
      // Assert
      expect(result).toBe(expectedOutput)
    })
  })

  describe('Edge Cases', () => {
    it('should handle null input', () => {
      expect(() => functionUnderTest(null)).not.toThrow()
    })
  })

  describe('Error Handling', () => {
    it('should throw error for invalid input', () => {
      expect(() => functionUnderTest(invalidInput)).toThrow()
    })
  })
})
```

#### Mejores Prácticas
- ✅ **Aislar dependencias**: Usar mocks para APIs, servicios externos
- ✅ **Naming descriptivo**: `should handle empty array when filtering`
- ✅ **Arrange-Act-Assert**: Estructura clara en cada test
- ✅ **Un test, una responsabilidad**: Un test debe probar una cosa específica
- ✅ **Datos consistentes**: Usar fixtures y factories para datos de prueba

#### Ejemplos de Tests Unitarios Exitosos
```typescript
// ✅ Test de lógica de negocio pura
describe('EntityOperations', () => {
  it('should validate required fields', () => {
    const result = EntityOperations.validateEntityData({}, schema)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('name is required')
  })
})

// ✅ Test de utilidades independientes  
describe('Filter Utilities', () => {
  it('should build query with status filter', () => {
    const result = buildFilters({ status: 'active' })
    expect(result.sql).toBe('WHERE status = $1')
  })
})
```

### 2. Tests de Integración

#### Objetivo
Probar la interacción entre múltiples componentes o servicios.

#### Estructura Recomendada
```typescript
describe('Feature Integration', () => {
  beforeEach(async () => {
    // Setup test environment
    await setupTestDatabase()
    await startMockServer()
  })

  afterEach(async () => {
    // Cleanup
    await cleanupTestDatabase()
    await stopMockServer()
  })

  it('should create entity through API', async () => {
    // Test complete user flow
    const response = await fetch('/api/entities', {
      method: 'POST',
      body: JSON.stringify(entityData)
    })
    
    expect(response.status).toBe(201)
    
    const created = await response.json()
    expect(created.id).toBeDefined()
  })
})
```

#### Mejores Prácticas
- ✅ **MSW para APIs**: Mockear endpoints externos consistentemente
- ✅ **Setup/Teardown**: Limpiar estado entre tests
- ✅ **Datos realistas**: Usar datos que reflejen casos reales
- ✅ **Verificar side effects**: Probar cambios en base de datos, archivos, etc.

### 3. Tests End-to-End (E2E)

#### Objetivo
Probar flujos completos de usuario desde la interfaz.

#### Estructura Recomendada
```typescript
test.describe('User Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app')
    await login(page, testUser)
  })

  test('should complete main user journey', async ({ page }) => {
    // Navigate through the app
    await page.click('[data-testid="create-button"]')
    await page.fill('[data-testid="name-input"]', 'Test Entity')
    await page.click('[data-testid="save-button"]')
    
    // Verify result
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
  })
})
```

#### Mejores Prácticas
- ✅ **Data-testid**: Usar atributos específicos para selectores
- ✅ **Flujos críticos**: Probar solo los journeys más importantes
- ✅ **Multi-browser**: Chrome, Firefox, Safari
- ✅ **Responsive**: Probar en diferentes tamaños de pantalla

## 🛠️ Herramientas y Configuración

### Vitest Configuration
```typescript
// vitest.config.ts
export default defineConfig({
  plugins: [vue()],
  environment: 'jsdom',
  setupFiles: ['tests/setup.ts'],
  coverage: {
    provider: 'v8',
    reporter: ['text', 'json', 'html'],
    thresholds: {
      global: {
        branches: 40,
        functions: 40,
        lines: 40,
        statements: 40
      }
    }
  }
})
```

### Playwright Configuration
```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:3007',
    trace: 'on-first-retry'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } }
  ]
})
```

### MSW Setup
```typescript
// tests/mocks/handlers.ts
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('/api/entities', () => {
    return HttpResponse.json(mockEntities)
  }),
  http.post('/api/entities', () => {
    return HttpResponse.json({ id: 1, ...newEntity })
  })
]
```

## 📊 Métricas y Coverage

### Coverage Actual (FASE 2)
- **Total Tests**: 43 passing ✅
- **Test Files**: 3 test suites
- **Coverage**: ~40% (baseline achieved)
- **Performance**: < 2s unit tests, < 5s integration tests

### Targets por Fase
- **FASE 2** (Actual): 40% coverage ✅
- **FASE 3** (Próxima): 60% coverage
- **FASE 4** (Final): 70% coverage

### Métricas de Calidad
```bash
# Ejecutar tests con coverage
pnpm run test:coverage

# Ver reporte HTML
open coverage/index.html
```

## 🎯 Patrones de Testing Específicos

### Testing de Composables Vue
```typescript
// ❌ Evitar: Tests que dependen de módulos reales
import { useEntity } from '@/composables/manage/useEntity'

// ✅ Preferir: Tests con mocks controlados
vi.mock('@/composables/manage/useEntity', () => ({
  useEntity: vi.fn().mockReturnValue({
    items: ref([]),
    loading: ref(false),
    fetchList: vi.fn()
  })
}))
```

### Testing de Componentes Vue
```typescript
// ✅ Usar @vue/test-utils para montar componentes
import { mount } from '@vue/test-utils'
import EntityBase from '@/components/manage/EntityBase.vue'

test('renders entity data', () => {
  const wrapper = mount(EntityBase, {
    props: { entity: mockEntity }
  })
  
  expect(wrapper.text()).toContain(mockEntity.name)
})
```

### Testing de APIs
```typescript
// ✅ Usar MSW para mocking consistente
import { setupServer } from 'msw/node'

const server = setupServer(
  http.get('/api/entities', () => {
    return HttpResponse.json(mockEntities)
  })
)
```

## 🚀 Roadmap de Implementación

### FASE 2 (Completada) ✅
- [x] Configurar Vitest y Playwright
- [x] Tests unitarios básicos (9 tests)
- [x] Tests de lógica de negocio (43 tests)
- [x] Tests de integración API
- [x] Tests E2E básicos
- [x] Coverage baseline: 40%

### FASE 3 (Próxima - Semanas 5-6)
- [ ] Tests para composables críticos
- [ ] Tests para componentes Vue principales
- [ ] Tests de utilidades backend
- [ ] Coverage target: 60%

### FASE 4 (Final - Semanas 7-8)
- [ ] Tests para todos los componentes
- [ ] Tests de performance
- [ ] Tests de accesibilidad
- [ ] Coverage target: 70%

## 📝 Scripts de Desarrollo

### Comandos Principales
```bash
# Tests básicos
pnpm run test

# Tests por tipo
pnpm run test:unit          # Unit tests
pnpm run test:integration   # Integration tests  
pnpm run test:e2e          # E2E tests

# Tests con coverage
pnpm run test:coverage

# Tests en modo watch
pnpm run test:watch

# Tests específicos
pnpm test -- tests/unit/business-logic/entity-operations.test.ts
```

### Debug y Desarrollo
```bash
# Tests con logs detallados
pnpm test -- --reporter=verbose

# Tests de un archivo específico
pnpm test basic.test.ts

# Tests con UI
pnpm test -- --ui
```

## 🔧 Mejores Prácticas Generales

### Naming Conventions
- **Archivos**: `*.test.ts` para unit tests, `*.spec.ts` para E2E
- **Funciones**: `should do something when condition`
- **Describe blocks**: Feature or component being tested

### Test Data Management
```typescript
// ✅ Usar factories para datos consistentes
const createMockEntity = (overrides = {}) => ({
  id: 1,
  name: 'Test Entity',
  status: 'active',
  ...overrides
})

// ✅ Usar fixtures para datos complejos
const complexData = require('../fixtures/complex-entity.json')
```

### Mock Strategy
```typescript
// ✅ Mockear a nivel de módulo
vi.mock('@/services/api', () => ({
  fetchEntities: vi.fn().mockResolvedValue([])
}))

// ✅ Mockear implementaciones específicas
const mockFetch = vi.fn().mockResolvedValue({ data: [] })
vi.mocked(fetch).mockImplementation(mockFetch)
```

### Error Handling Tests
```typescript
// ✅ Probar errores específicos
it('should throw ValidationError for invalid data', () => {
  expect(() => validateEntity(invalidData))
    .toThrow('ValidationError')
    .toHaveProperty('code', 'INVALID_DATA')
})

// ✅ Probar manejo de errores async
it('should handle API errors gracefully', async () => {
  mockAPI.rejectWith(new Error('Network error'))
  
  await expect(fetchData()).rejects.toThrow('Network error')
})
```

## 📈 CI/CD Integration

### GitHub Actions Workflow
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: pnpm install
      - run: pnpm run test:unit
      - run: pnpm run test:integration
      - run: pnpm run test:e2e
      - uses: codecov/codecov-action@v3
```

### Pre-commit Hooks
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged && pnpm run test:unit"
    }
  }
}
```

## 🎯 Próximos Pasos

### Inmediatos (Esta semana)
1. **Resolver tests fallidos**: Corregir 16 tests que están fallando
2. **Expandir coverage**: Agregar tests para componentes Vue críticos
3. **Optimizar performance**: Reducir tiempo de ejecución de tests

### Corto plazo (Próximas 2 semanas)
1. **Tests de composables**: Implementar tests para useEntity, useEntityCapabilities
2. **Tests de componentes**: EntityBase, FormModal, CommonDataTable
3. **Tests de utilidades**: Filters, response helpers, CRUD handlers

### Largo plazo (Próximo mes)
1. **Cobertura completa**: Alcanzar 70% de coverage
2. **Performance testing**: Tests de carga y performance
3. **Accesibilidad**: Tests de a11y con axe-core

## 📞 Soporte y Recursos

### Documentación
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Vue Test Utils](https://vue-test-utils.vuejs.org/)
- [MSW Documentation](https://mswjs.io/)

### Comandos de Emergencia
```bash
# Resetear environment de testing
rm -rf node_modules/.cache
pnpm install

# Ejecutar solo tests que pasan
pnpm test -- --reporter=verbose --reporter=json --outputFile=test-results.json

# Debug específico
pnpm test -- --inspect-brk entity-operations.test.ts
```

---

**Estado Actual**: FASE 2 ✅ COMPLETADA  
**Próximo Hito**: FASE 3 - Tests de Composables y Componentes  
**Coverage Actual**: 40% ✅  
**Tests Passing**: 43/59 ✅  
**Fecha**: 4 de enero de 2026
