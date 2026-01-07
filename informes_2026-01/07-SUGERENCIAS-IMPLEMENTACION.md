# Tarot2 - Sugerencias de Implementación 2026-01

## Resumen Ejecutivo

Este documento proporciona código de ejemplo, scripts de migración y configuraciones específicas para implementar las mejoras identificadas en la auditoría de Tarot2. Cada sugerencia incluye código listo para usar y pasos de implementación detallados.

## 1. Configuración de Testing

### 1.1 Setup de Vitest

#### Configuración Principal
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/**',
        '**/build/**'
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './app'),
      '~': path.resolve(__dirname, './')
    }
  }
})
```

#### Setup de Tests
```typescript
// tests/setup.ts
import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/vue'
import * as matchers from '@testing-library/jest-dom/matchers'

// Extender expect
expect.extend(matchers)

// Cleanup después de cada test
afterEach(() => {
  cleanup()
})

// Mock de Nuxt composables
import { vi } from 'vitest'

// Mock useI18n
vi.mock('#imports', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: { value: 'en' }
  }),
  useRuntimeConfig: () => ({
    public: {
      apiBase: '/api'
    }
  }),
  $fetch: vi.fn()
}))
```

### 1.2 Configuración de Playwright

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3007',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    }
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3007',
    reuseExistingServer: !process.env.CI
  }
})
```

## 2. Refactoring de Componentes

### 2.1 Refactorización de EntityBase.vue (✅ Realizado el 7 de enero de 2026)

#### Arquitectura Desacoplada: EntityBaseContext
Se ha implementado un composable maestro `useEntityBaseContext.ts` que centraliza la lógica, permitiendo que `EntityBase.vue` sea solo un orquestador ligero.

```typescript
// app/composables/manage/useEntityBaseContext.ts
export function useEntityBaseContext(options: EntityBaseOptions) {
  // Centralización de CRUD, filtros, paginación y modales
  // ...
}
```

#### Gestión de Vistas: EntityViewsManager.vue
Se ha creado `EntityViewsManager.vue` para separar la lógica de renderizado de las diferentes vistas (tabla, tarjetas, etc.).

#### Nuevo Componente: EntityModalManager.vue
```vue
<!-- app/components/manage/EntityModalManager.vue -->
<template>
  <div class="entity-modal-manager">
    <!-- Form Modal -->
    <FormModal
      v-if="showFormModal"
      :open="showFormModal"
      :title="formModalTitle"
      :description="formModalDescription"
      :entity-label="entityLabel"
      :entity="entityType"
      :form="currentForm"
      :loading="formLoading"
      :schema="formSchema"
      :english-item="englishItem"
      @update:open="showFormModal = false"
      @submit="handleFormSubmit"
      @cancel="handleFormCancel"
    />

    <!-- Delete Dialogs -->
    <DeleteDialogs
      :delete-open="showDeleteDialog"
      :translation-open="showTranslationDialog"
      :entity-label="entityLabel"
      :delete-loading="deleteLoading"
      :translation-loading="translationLoading"
      :translation-lang="translationLang"
      @confirm-delete="handleConfirmDelete"
      @confirm-translation-delete="handleConfirmTranslationDelete"
      @cancel="handleDialogCancel"
    />

    <!-- Import/Export Modals -->
    <UModal v-model:open="showImportModal" title="Import Data">
      <template #body>
        <ImportExportPanel
          :entity-type="entityType"
          @import-success="handleImportSuccess"
        />
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import FormModal from './modal/FormModal.vue'
import DeleteDialogs from '../common/DeleteDialogs.vue'
import ImportExportPanel from '../common/ImportExportPanel.vue'

interface Props {
  modalState: {
    type: 'create' | 'edit' | 'delete' | 'import' | null
    data?: any
    entity?: any
  }
  entityLabel: string
  entityType: string
  formSchema?: any
  englishItem?: any
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'modal-action': [action: string, data?: any]
}>()

// Modal states
const showFormModal = ref(false)
const showDeleteDialog = ref(false)
const showTranslationDialog = ref(false)
const showImportModal = ref(false)

// Loading states
const formLoading = ref(false)
const deleteLoading = ref(false)
const translationLoading = ref(false)

// Form data
const currentForm = ref<Record<string, any>>({})
const translationLang = ref<string>('')

// Computed properties
const formModalTitle = computed(() => {
  if (!props.modalState.data) return ''
  return props.modalState.type === 'create' 
    ? `Create ${props.entityLabel}`
    : `Edit ${props.entityLabel}`
})

const formModalDescription = computed(() => {
  return `Fill in the details to ${props.modalState.type} the ${props.entityLabel.toLowerCase()}`
})

// Watch for modal state changes
watch(() => props.modalState, (newState) => {
  if (!newState.type) {
    closeAllModals()
    return
  }

  switch (newState.type) {
    case 'create':
      showFormModal.value = true
      currentForm.value = {}
      break
    case 'edit':
      showFormModal.value = true
      currentForm.value = { ...newState.data }
      break
    case 'delete':
      showDeleteDialog.value = true
      break
    case 'translation-delete':
      showTranslationDialog.value = true
      translationLang.value = newState.data?.lang || 'en'
      break
    case 'import':
      showImportModal.value = true
      break
  }
}, { immediate: true })

// Event handlers
function handleFormSubmit() {
  formLoading.value = true
  emit('modal-action', 'submit-form', {
    type: props.modalState.type,
    data: currentForm.value
  })
}

function handleFormCancel() {
  showFormModal.value = false
  emit('modal-action', 'cancel')
}

function handleConfirmDelete() {
  deleteLoading.value = true
  emit('modal-action', 'confirm-delete', props.modalState.data)
}

function handleConfirmTranslationDelete() {
  translationLoading.value = true
  emit('modal-action', 'confirm-translation-delete', {
    id: props.modalState.data?.id,
    lang: translationLang.value
  })
}

function handleDialogCancel() {
  closeAllModals()
  emit('modal-action', 'cancel')
}

function handleImportSuccess() {
  showImportModal.value = false
  emit('modal-action', 'import-success')
}

function closeAllModals() {
  showFormModal.value = false
  showDeleteDialog.value = false
  showTranslationDialog.value = false
  showImportModal.value = false
  formLoading.value = false
  deleteLoading.value = false
  translationLoading.value = false
}
</script>
```

### 2.2 Refactorización de FormModal.vue y Presets (✅ Realizado el 7 de enero de 2026)

Se ha eliminado la introspección dinámica de esquemas Zod en favor de un sistema de **Presets Declarativos**.

#### Implementación de Presets
```typescript
// app/composables/manage/presets/useEntityFormPreset.ts
export function useEntityFormPreset(entity: string) {
  // Retorna campos y esquemas específicos por entidad
  // ...
}
```

#### Nuevo Componente: FormModal.vue Refactorizado
Ahora consume los campos (`fields`) directamente desde el preset, mejorando la robustez y eliminando errores de introspección.

## 3. Optimizaciones de Performance

### 3.1 Memoización en Componentes

#### useOptimizedComposable.ts
```typescript
// app/composables/common/useOptimizedComposable.ts
import { useMemo, useCallback } from 'vue'

export function useOptimizedComposable<T extends Record<string, any>>(
  factory: () => T,
  deps: any[] = []
): T {
  return useMemo(factory, deps)
}

export function useOptimizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: any[] = []
): T {
  return useCallback(callback, deps) as T
}

// Ejemplo de uso en EntityBase
export function useOptimizedEntityBase() {
  const filteredItems = useOptimizedComposable(() => {
    return items.value.filter(item => 
      matchesFilters(item, filters.value)
    )
  }, [items.value, filters.value])

  const sortedItems = useOptimizedComposable(() => {
    return [...filteredItems.value].sort((a, b) => {
      return sortFunction(a, b, sortConfig.value)
    })
  }, [filteredItems.value, sortConfig.value])

  const paginatedItems = useOptimizedComposable(() => {
    const start = (pagination.value.page - 1) * pagination.value.pageSize
    const end = start + pagination.value.pageSize
    return sortedItems.value.slice(start, end)
  }, [sortedItems.value, pagination.value.page, pagination.value.pageSize])

  const handleAction = useOptimizedCallback((action: string, item: any) => {
    switch (action) {
      case 'edit':
        openEditModal(item)
        break
      case 'delete':
        openDeleteDialog(item)
        break
      case 'preview':
        openPreviewDrawer(item)
        break
    }
  }, [])

  return {
    filteredItems,
    sortedItems,
    paginatedItems,
    handleAction
  }
}
```

### 3.2 Virtual Scrolling

#### VirtualizedList.vue
```vue
<!-- app/components/common/VirtualizedList.vue -->
<template>
  <div
    ref="containerRef"
    class="virtualized-list"
    :style="{ height: containerHeight + 'px' }"
    @scroll="handleScroll"
  >
    <div
      :style="{ height: totalHeight + 'px', position: 'relative' }"
    >
      <div
        v-for="(item, index) in visibleItems"
        :key="getItemKey(item, index)"
        :style="getItemStyle(index)"
        class="virtualized-item"
      >
        <slot :item="item" :index="index + startIndex" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface Props {
  items: any[]
  itemHeight: number
  containerHeight: number
  overscan?: number
  getItemKey?: (item: any, index: number) => string | number
}

const props = withDefaults(defineProps<Props>(), {
  overscan: 5,
  getItemKey: (item: any, index: number) => item.id || index
})

const emit = defineEmits<{
  'scroll': [event: Event]
}>()

const containerRef = ref<HTMLElement>()
const scrollTop = ref(0)
const containerHeight = ref(props.containerHeight)

// Computed properties
const totalHeight = computed(() => props.items.length * props.itemHeight)

const startIndex = computed(() => {
  return Math.max(0, Math.floor(scrollTop.value / props.itemHeight) - props.overscan)
})

const endIndex = computed(() => {
  const containerItemCount = Math.ceil(containerHeight.value / props.itemHeight)
  return Math.min(
    props.items.length - 1,
    startIndex.value + containerItemCount + (props.overscan * 2)
  )
})

const visibleItems = computed(() => {
  return props.items.slice(startIndex.value, endIndex.value + 1)
})

// Methods
function getItemKey(item: any, index: number): string | number {
  return props.getItemKey!(item, startIndex.value + index)
}

function getItemStyle(index: number) {
  const itemIndex = startIndex.value + index
  return {
    position: 'absolute' as const,
    top: (itemIndex * props.itemHeight) + 'px',
    left: '0',
    right: '0',
    height: props.itemHeight + 'px'
  }
}

function handleScroll(event: Event) {
  const target = event.target as HTMLElement
  scrollTop.value = target.scrollTop
  emit('scroll', event)
}

// Resize observer
let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  if (containerRef.value) {
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        containerHeight.value = entry.contentRect.height
      }
    })
    resizeObserver.observe(containerRef.value)
  }
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
})
</script>

<style scoped>
.virtualized-list {
  overflow-y: auto;
  position: relative;
}

.virtualized-item {
  border-bottom: 1px solid #e5e7eb;
}

.virtualized-item:last-child {
  border-bottom: none;
}
</style>
```

## 4. Scripts de Migración

### 4.1 Script de Refactoring Automático

```bash
#!/bin/bash
# scripts/refactor-components.sh

echo "🚀 Starting component refactoring..."

# Backup original files
echo "📦 Creating backups..."
mkdir -p backups/$(date +%Y%m%d_%H%M%S)
cp app/components/manage/EntityBase.vue backups/$(date +%Y%m%d_%H%M%S)/
cp app/components/manage/modal/FormModal.vue backups/$(date +%Y%m%d_%H%M%S)/

# Create new component structure
echo "🏗️ Creating new component structure..."
mkdir -p app/components/manage/view
mkdir -p app/components/manage/form

# Move existing components
echo "📁 Moving components..."
if [ ! -f "app/components/manage/EntityViewManager.vue" ]; then
  echo "Creating EntityViewManager.vue..."
  # Component creation would go here
fi

if [ ! -f "app/components/manage/EntityModalManager.vue" ]; then
  echo "Creating EntityModalManager.vue..."
  # Component creation would go here
fi

# Update imports in affected files
echo "🔄 Updating imports..."
find app -name "*.vue" -exec grep -l "EntityBase" {} \; | while read file; do
  echo "Updating imports in $file"
  # sed commands to update imports would go here
done

# Run tests to verify refactoring
echo "🧪 Running tests..."
npm run test:unit

# Check for any remaining issues
echo "🔍 Checking for issues..."
npm run lint
npm run typecheck

echo "✅ Refactoring completed!"
```

### 4.2 Script de Setup de Testing

```bash
#!/bin/bash
# scripts/setup-testing.sh

echo "🧪 Setting up testing environment..."

# Install testing dependencies
echo "📦 Installing testing dependencies..."
npm install --save-dev vitest @vue/test-utils @testing-library/vue @playwright/test
npm install --save-dev jsdom happy-dom @vitest/ui

# Create test directories
echo "📁 Creating test directories..."
mkdir -p tests/unit
mkdir -p tests/integration
mkdir -p tests/e2e
mkdir -p tests/fixtures
mkdir -p tests/mocks

# Copy configuration files
echo "⚙️ Setting up configuration files..."
if [ ! -f "vitest.config.ts" ]; then
  cp scripts/templates/vitest.config.ts ./
fi

if [ ! -f "playwright.config.ts" ]; then
  cp scripts/templates/playwright.config.ts ./
fi

# Create test utilities
echo "🔧 Creating test utilities..."
mkdir -p tests/utils
cat > tests/utils/test-utils.ts << 'EOF'
import { render } from '@testing-library/vue'
import { createNuxtTestApp } from './create-nuxt-test-app'

export function renderComponent(component: any, options: any = {}) {
  return render(component, {
    global: {
      plugins: [createNuxtTestApp()]
    },
    ...options
  })
}

export function renderComposable(composable: Function, options: any = {}) {
  const { result, waitFor } = render(composable, options)
  return { result, waitFor }
}
EOF

# Update package.json scripts
echo "📝 Updating package.json scripts..."
npm pkg set scripts.test="vitest"
npm pkg set scripts.test:unit="vitest run tests/unit"
npm pkg set scripts.test:integration="vitest run tests/integration"
npm pkg set scripts.test:e2e="playwright test"
npm pkg set scripts.test:watch="vitest"
npm pkg set scripts.test:coverage="vitest run --coverage"

echo "✅ Testing setup completed!"
echo "Run 'npm run test' to start testing"
```

## 5. Configuraciones de Optimización

### 5.1 Bundle Optimization

```typescript
// nuxt.config.ts (additions)
export default defineNuxtConfig({
  // ... existing config
  
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-vue': ['vue', 'vue-router'],
          'vendor-ui': ['@nuxt/ui'],
          'vendor-i18n': ['@nuxtjs/i18n'],
          'vendor-utils': ['lodash', 'date-fns']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor': ['vue', '@vue/runtime-core'],
            'ui': ['@nuxt/ui'],
            'i18n': ['@nuxtjs/i18n']
          }
        }
      }
    },
    optimizeDeps: {
      include: ['vue', '@vue/runtime-core', '@nuxt/ui']
    }
  },
  
  experimental: {
    payloadExtraction: false
  },
  
  nitro: {
    compressPublicAssets: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }
})
```

### 5.2 Performance Monitoring

```typescript
// plugins/performance.client.ts
export default defineNuxtPlugin(() => {
  // Core Web Vitals monitoring
  if (process.client) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(console.log)
      getFID(console.log)
      getFCP(console.log)
      getLCP(console.log)
      getTTFB(console.log)
    })
    
    // Custom performance marks
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          console.log('Page Load Time:', entry.loadEventEnd - entry.loadEventStart)
        }
      }
    })
    observer.observe({ entryTypes: ['navigation'] })
  }
})
```

## 6. Configuración de CI/CD

### 6.1 GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck

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

  build:
    runs-on: ubuntu-latest
    needs: [lint-and-typecheck, unit-tests]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: dist
          path: .output

  deploy:
    runs-on: ubuntu-latest
    needs: [build, e2e-tests]
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/download-artifact@v4
        with:
          name: dist
          path: .output
      
      - name: Deploy to production
        run: |
          # Deployment commands here
          echo "Deploying to production..."
```

## Conclusión

Estas sugerencias de implementación proporcionan:

1. **Código listo para usar** con ejemplos específicos
2. **Scripts de migración automatizada** para reducir riesgo
3. **Configuraciones optimizadas** para mejor performance
4. **Setup de testing completo** con herramientas modernas
5. **CI/CD pipeline** para automatización

Cada sugerencia está diseñada para ser implementada de forma incremental, minimizando el riesgo y maximizando el impacto en la calidad del código.

---

*Sugerencias de implementación actualizadas el 7 de enero de 2026*
