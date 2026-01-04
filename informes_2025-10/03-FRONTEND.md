# 🎨 Análisis del Frontend - Tarot2

## 1. Visión General

El frontend de Tarot2 está construido sobre **Nuxt 4** con **Nuxt UI 4** y sigue un patrón SSR-first con hidratación optimizada. La arquitectura se organiza en tres áreas principales: **Manage** (gestión de contenido), **Admin** (administración) y **Deck** (visualización pública).

---

## 2. Mapa de Componentes

### 2.1 Jerarquía de Componentes

```
app/components/
├── common/                      # Compartidos entre áreas
│   ├── CommonDataTable.vue      # Shell de tabla Nuxt UI ⭐
│   ├── AdvancedFiltersPanel.vue # Filtros dinámicos colapsables
│   ├── PaginationControls.vue   # Control de paginación
│   ├── StatusBadge.vue          # Badge unificado de estados
│   ├── EntityInspectorDrawer.vue# Preview en drawer ⭐
│   ├── EntityCard.vue           # Card de entidad
│   ├── EntitySummary.vue        # Resumen de entidad
│   ├── BulkActionsBar.vue       # Acciones masivas (en diseño)
│   └── JsonModal.vue            # Modal para diffs JSON
│
├── manage/                      # Exclusivos de /manage
│   ├── EntityBase.vue           # Coordinador principal ⭐
│   ├── ManageTableBridge.vue    # Puente datos → tabla ⭐
│   ├── ManageEntityFilters.vue  # Filtros de entidad
│   ├── ViewControls.vue         # Control de vista (tabla/cards)
│   ├── EntityTableWrapper.vue   # Legacy wrapper
│   ├── view/
│   │   ├── EntityCards.vue      # Vista de cards
│   │   ├── EntityCardsClassic.vue
│   │   ├── EntityCarta.vue      # Vista carta estilo TCG
│   │   └── EntityTable.vue      # Legacy table
│   └── modal/
│       ├── FormModal.vue        # Formulario dinámico ⭐
│       ├── EntityTagsModal.vue  # Gestión de tags
│       ├── FeedbackModal.vue    # Modal de feedback
│       ├── ImportJson.vue       # Importación JSON
│       └── PreviewModal.vue     # Legacy (migrar a drawer)
│
├── admin/                       # Exclusivos de /admin
│   ├── AdminTableBridge.vue     # Puente Admin → tabla ⭐
│   ├── FeedbackList.vue         # Lista de feedback ⭐
│   ├── RevisionsTable.vue       # Tabla de revisiones
│   ├── VersionList.vue          # Lista de versiones (legacy)
│   ├── VersionModal.vue         # Modal de versión
│   ├── RoleForm.vue             # Formulario de roles (legacy)
│   ├── RevisionCompareModal.vue # Comparación de diffs
│   ├── FeedbackNotesModal.vue   # Notas de feedback
│   └── users/
│       ├── ManageUsers.vue      # Gestión de usuarios
│       └── UserTable.vue        # Tabla de usuarios
│
├── card/                        # Visualización de cartas
│   ├── CardFull.vue             # Vista completa
│   └── CardPreview.vue          # Vista previa
│
└── deck/                        # Mazo público
    ├── DeckSection.vue          # Sección de mazo
    └── DeckEntityPage.vue       # Página de entidad
```

### 2.2 Componentes Core (⭐)

| Componente | Rol | Estado |
|------------|-----|--------|
| `CommonDataTable` | Base de todas las tablas | ✅ Producción |
| `ManageTableBridge` | Adaptador Manage → tabla | ✅ Producción |
| `AdminTableBridge` | Adaptador Admin → tabla | ✅ Producción |
| `EntityBase` | Orquestador de /manage | ✅ Producción |
| `EntityInspectorDrawer` | Preview unificado | ✅ Producción |
| `FormModal` | Formularios dinámicos | ✅ Producción |

---

## 3. Mapa de Composables

### 3.1 Organización por Scope

```
app/composables/
├── common/                      # Compartidos
│   ├── useListMeta.ts           # Meta de paginación
│   ├── useQuerySync.ts          # Sincronización URL ↔ estado
│   ├── useEntityCapabilities.ts # Capabilities declarativas ⭐
│   ├── useEntityPreviewFetch.ts # Fetch lazy de preview
│   ├── useDateRange.ts          # Rangos de fecha
│   └── useApiFetch.ts           # Wrapper fetch SSR-safe
│
├── manage/                      # Gestión de contenido
│   ├── useEntity.ts             # CRUD genérico SSR ⭐
│   ├── useManageFilters.ts      # Filtros de Manage
│   ├── useManageColumns.ts      # Columnas dinámicas
│   ├── useEntityModals.ts       # Gestión de modales
│   ├── useEntityDeletion.ts     # Lógica de borrado
│   ├── useEntityTags.ts         # Tags de entidad
│   ├── useEntityPreview.ts      # Preview de entidad
│   ├── useEntityBulk.ts         # Acciones masivas
│   ├── entityFieldPresets.ts    # Presets de campos
│   ├── useWorld.ts              # CRUD world
│   ├── useArcana.ts             # CRUD arcana
│   ├── useBaseCard.ts           # CRUD base_card
│   └── ...                      # Otros por entidad
│
├── admin/                       # Administración
│   ├── useContentVersions.ts    # Versiones editoriales
│   ├── useRevisions.ts          # Revisiones con diff
│   ├── useContentFeedback.ts    # Feedback QA ⭐
│   ├── useAdminUsersCrud.ts     # CRUD usuarios
│   ├── useDatabaseExport.ts     # Export DB
│   └── useDatabaseImport.ts     # Import DB
│
├── auth/
│   └── useAuth.ts               # Autenticación JWT
│
└── useUser.ts                   # Usuario actual
```

### 3.2 Composables Core

#### `useEntity` - CRUD Genérico

```typescript
const { items, meta, pending, error, create, update, remove, fetchList } = 
  useEntity<World>('world', {
    lang: 'es',
    filters: { status: 'draft' },
    schema: worldCreateSchema,
  })
```

**Características:**
- SSR-first con `useAsyncData`
- Cache SWR con invalidación
- Validación Zod opcional
- Soporte multi-idioma

#### `useEntityCapabilities` - Configuración Declarativa

```typescript
const caps = useEntityCapabilities('base_card')
// {
//   translatable: true,
//   hasTags: true,
//   hasPreview: true,
//   hasFeedback: true,
//   canRevision: true,
//   canExport: true,
//   canImport: true,
//   actionsBatch: true,
// }
```

**Uso en componentes:**
```vue
<template>
  <BulkActionsBar v-if="caps.actionsBatch" :selected="selected" />
  <EntityTagsModal v-if="caps.hasTags" :entity="entity" />
</template>
```

---

## 4. Sistema de Tablas

### 4.1 Arquitectura de Tablas

```
┌─────────────────────────────────────────────────────────────────┐
│                      CommonDataTable.vue                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  UTable (Nuxt UI)                                         │  │
│  │  • Columnas dinámicas                                     │  │
│  │  • Selección múltiple                                     │  │
│  │  • Densidad configurable                                  │  │
│  │  • Slots: row, cell:<key>, toolbar                        │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  PaginationControls                                       │  │
│  │  • Page selector                                          │  │
│  │  • PageSize selector                                      │  │
│  │  • Total items                                            │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │
              ┌───────────────┴───────────────┐
              │                               │
   ┌──────────┴──────────┐       ┌────────────┴──────────┐
   │  ManageTableBridge  │       │   AdminTableBridge    │
   │  • Columnas Manage  │       │  • Columnas Admin     │
   │  • Acciones entidad │       │  • Acciones admin     │
   │  • Preview drawer   │       │  • Bulk resolve       │
   │  • Bulk actions     │       │  • Inspección         │
   └─────────────────────┘       └───────────────────────┘
```

### 4.2 Slots Disponibles

```vue
<CommonDataTable :data="items" :columns="columns">
  <!-- Toolbar personalizado -->
  <template #toolbar>
    <UButton>Crear</UButton>
  </template>
  
  <!-- Celda personalizada -->
  <template #cell:status="{ row }">
    <StatusBadge :status="row.status" />
  </template>
  
  <!-- Acciones por fila -->
  <template #row:actions="{ row }">
    <UButton icon="i-lucide-edit" @click="edit(row)" />
  </template>
</CommonDataTable>
```

---

## 5. Sistema de Formularios

### 5.1 FormModal con Presets

```typescript
// entityFieldPresets.ts
export const entityFieldPresets = {
  world: {
    fields: [
      { key: 'code', type: 'text', required: true },
      { key: 'name', type: 'text', required: true, translatable: true },
      { key: 'status', type: 'select', options: statusOptions },
      { key: 'description', type: 'markdown', translatable: true },
      { key: 'image', type: 'image', bucket: 'worlds' },
    ],
    schema: worldSchema,
  },
  // ... otros presets
}
```

### 5.2 Flujo de Formulario

```
1. Usuario abre modal → FormModal recibe entityType
2. FormModal carga preset → genera campos dinámicamente
3. Si editing && lang !== 'en' → muestra valores EN como referencia
4. Usuario rellena → validación Zod en blur
5. onSubmit → useEntity().create() o .update()
6. Éxito → toast + cierre modal + invalidate lista
```

### 5.3 Campos Soportados

| Tipo | Componente | Características |
|------|------------|-----------------|
| `text` | UInput | Texto simple |
| `textarea` | UTextarea | Texto multilínea |
| `markdown` | MarkdownEditor | Con preview |
| `select` | USelectMenu | Opciones dinámicas |
| `multiselect` | USelectMenu (multiple) | Selección múltiple |
| `number` | UInput (type=number) | Numérico |
| `boolean` | USwitch | Toggle |
| `image` | ImageUploadField | Upload + preview |
| `date` | UCalendar | Selector de fecha |
| `json` | JsonEditor | Editor JSON |

---

## 6. Sistema de Preview

### 6.1 EntityInspectorDrawer

```vue
<EntityInspectorDrawer
  v-model:open="previewOpen"
  :entity-type="entityType"
  :entity-id="selectedId"
  :lang="currentLang"
>
  <template #header="{ entity }">
    <StatusBadge :status="entity.status" />
  </template>
  
  <template #tabs>
    <UTabs>
      <UTab label="Detalles" />
      <UTab label="Efectos" />
      <UTab label="Historial" />
    </UTabs>
  </template>
</EntityInspectorDrawer>
```

### 6.2 Características

- **Lazy loading** - Datos cargados solo al abrir
- **Multi-idioma** - Indica si usa fallback
- **Tabs extensibles** - Para información adicional
- **Accesibilidad** - Focus trap, ARIA compliant
- **Acciones contextuales** - Editar, tags, feedback

---

## 7. Sistema de Vistas

### 7.1 ViewControls

```
┌─────────────────────────────────────────┐
│  [📋 Tabla] [🃏 Cards] [📜 Classic]     │
│  Densidad: [Compacto] [Normal] [Amplio] │
└─────────────────────────────────────────┘
```

### 7.2 Vistas Disponibles

| Vista | Componente | Uso |
|-------|------------|-----|
| Tabla | ManageTableBridge | Por defecto |
| Cards | EntityCards | Visualización gráfica |
| Classic | EntityCardsClassic | Cards simplificadas |
| Carta | EntityCarta | Estilo TCG |

---

## 8. Filtros y Búsqueda

### 8.1 ManageEntityFilters

```vue
<ManageEntityFilters
  v-model:search="filters.search"
  v-model:status="filters.status"
  v-model:tags="filters.tags"
  v-model:lang="filters.lang"
  :capabilities="caps"
/>
```

### 8.2 AdvancedFiltersPanel

Panel colapsable para filtros complejos:

```vue
<AdvancedFiltersPanel :schema="filterSchema">
  <template #filter:dateRange>
    <UDateRangePicker v-model="dateRange" />
  </template>
</AdvancedFiltersPanel>
```

---

## 9. Zonas Legacy

### 9.1 Componentes Pendientes de Migración

| Componente | Estado | Acción |
|------------|--------|--------|
| `EntityTableWrapper.vue` | Legacy | Migrar a ManageTableBridge |
| `EntityTable.vue` | Legacy | Eliminar tras migración |
| `PreviewModal.vue` | Legacy | Migrar a EntityInspectorDrawer |
| `VersionList.vue` | Legacy | Migrar a AdminTableBridge |
| `UserTable.vue` | Legacy | Migrar a AdminTableBridge |
| `RoleForm.vue` | Legacy | Migrar a FormModal + presets |

### 9.2 Antipatrones Detectados

| Antipattern | Ubicación | Solución |
|-------------|-----------|----------|
| `$fetch` directo | stores/user.ts | Usar `useApiFetch` |
| `:model-value` | RoleForm, PreviewModal | Usar `v-model:open` |
| Tabla HTML manual | VersionList | Usar CommonDataTable |
| Modal sin focus trap | PreviewModal | Usar UModal con setup |

---

## 10. Accesibilidad

### 10.1 Checklist ARIA

| Elemento | Requisito | Estado |
|----------|-----------|--------|
| Modales | `role="dialog"`, `aria-modal` | ⚠️ Parcial |
| Botones icónicos | `aria-label` | ⚠️ Parcial |
| Tablas | Checkboxes con `aria-label` | ⚠️ Parcial |
| Drawers | Focus trap, retorno foco | ✅ Ok |
| Formularios | Labels vinculados | ✅ Ok |

### 10.2 Mejoras Pendientes

```vue
<!-- Antes (legacy) -->
<UButton icon="i-lucide-edit" />

<!-- Después (accesible) -->
<UButton icon="i-lucide-edit" aria-label="Editar entidad" />
```

---

## 11. Roadmap de Frontend

### 11.1 Fase 1 - Convergencia UI (Alta prioridad)

| Tarea | Impacto | Esfuerzo |
|-------|---------|----------|
| Migrar VersionList → AdminTableBridge | Alto | Medio |
| Migrar RevisionsTable → AdminTableBridge | Alto | Medio |
| Eliminar PreviewModal → EntityInspectorDrawer | Alto | Bajo |
| Normalizar USelectMenu a v-model | Medio | Bajo |

### 11.2 Fase 2 - Optimización

| Tarea | Impacto | Esfuerzo |
|-------|---------|----------|
| Crear BulkActionsBar compartida | Medio | Medio |
| Implementar useTableSelection | Medio | Medio |
| Skeletons reutilizables | Bajo | Bajo |
| aria-label en botones icónicos | Bajo | Bajo |

### 11.3 Fase 3 - Extensibilidad

| Tarea | Impacto | Esfuerzo |
|-------|---------|----------|
| Storybook para componentes core | Alto | Alto |
| Effect System 2.0 en FormModal | Alto | Alto |
| Dashboard i18n | Medio | Medio |

---

## 12. Métricas de Frontend

### 12.1 Métricas Actuales

| Métrica | Valor |
|---------|-------|
| Componentes totales | ~60 |
| Componentes legacy | ~6 |
| Composables | ~40 |
| Cobertura bridges | 90% Manage, 60% Admin |

### 12.2 Métricas Objetivo

| Métrica | Objetivo |
|---------|----------|
| Componentes legacy | 0 |
| Cobertura bridges | 100% |
| Lighthouse accessibility | > 90 |
| SSR latency /manage | < 300ms |

---

*Este documento detalla el análisis del frontend de Tarot2. Para información sobre el backend, consultar 04-BACKEND.md.*
