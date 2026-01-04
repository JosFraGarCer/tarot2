# 🏗️ Análisis Arquitectónico - Tarot2

## 1. Visión General de la Arquitectura

Tarot2 implementa una arquitectura **SSR-first** basada en Nuxt 4, con clara separación entre capas de presentación, lógica de negocio y persistencia.

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CAPA DE PRESENTACIÓN                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   /manage   │  │   /admin    │  │    /deck    │  │   /login    │ │
│  │ EntityBase  │  │ Dashboards  │  │ EntityCard  │  │   useAuth   │ │
│  │   Bridges   │  │   Tables    │  │  Summaries  │  │    Form     │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      CAPA DE COMPOSABLES                             │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Common: useListMeta, useQuerySync, useEntityCapabilities,   │   │
│  │          useEntityPreviewFetch, useDateRange                 │   │
│  ├──────────────────────────────────────────────────────────────┤   │
│  │  Manage: useEntity, useManageFilters, useManageColumns,      │   │
│  │          useEntityModals, useEntityDeletion, useEntityTags   │   │
│  ├──────────────────────────────────────────────────────────────┤   │
│  │  Admin: useContentVersions, useRevisions, useContentFeedback,│   │
│  │         useAdminUsersCrud, useDatabaseExport                 │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         CAPA DE API (H3/Nitro)                       │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────────────┐   │
│  │  Middleware   │  │   Handlers    │  │      Utilities        │   │
│  │ 00.auth.hydr  │  │  /api/world   │  │  createCrudHandlers   │   │
│  │ 01.auth.guard │  │  /api/arcana  │  │  buildFilters         │   │
│  │ 02.rate-limit │  │  /api/user    │  │  translatableUpsert   │   │
│  └───────────────┘  └───────────────┘  └───────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      CAPA DE PERSISTENCIA                            │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  PostgreSQL + Kysely (typed queries)                          │  │
│  │  • Tablas base: worlds, arcana, base_card, facet, skill...   │  │
│  │  • Traducciones: *_translations con fallback EN              │  │
│  │  • Editorial: content_versions, content_revisions, feedback  │  │
│  │  • Auth: users, roles, permissions JSONB                     │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Estructura de Directorios

```
tarot2/
├── app/                          # Frontend Nuxt 4
│   ├── components/
│   │   ├── admin/               # Componentes exclusivos Admin
│   │   ├── common/              # Componentes compartidos
│   │   ├── manage/              # Componentes exclusivos Manage
│   │   ├── card/                # Componentes de visualización
│   │   └── deck/                # Componentes de mazo público
│   ├── composables/
│   │   ├── admin/               # Lógica Admin (versiones, feedback)
│   │   ├── common/              # Lógica compartida (meta, capabilities)
│   │   └── manage/              # Lógica Manage (CRUD, filtros)
│   ├── pages/                   # Rutas Nuxt
│   ├── directives/              # v-can (permisos)
│   └── assets/css/              # Estilos globales
│
├── server/                       # Backend H3/Nitro
│   ├── api/                     # Handlers por entidad
│   │   ├── auth/                # Login/logout
│   │   ├── world/               # CRUD world
│   │   ├── arcana/              # CRUD arcana
│   │   ├── base_card/           # CRUD base_card
│   │   ├── content_versions/    # Editorial
│   │   ├── content_revisions/   # Revisiones
│   │   ├── content_feedback/    # Feedback
│   │   ├── database/            # Import/export
│   │   └── uploads/             # Imágenes
│   ├── middleware/              # Auth, guard, rate-limit
│   ├── plugins/                 # db, auth, logger
│   ├── utils/                   # Helpers compartidos
│   └── database/                # Tipos Kysely
│
├── docs/                         # Documentación técnica
├── informes/                     # Informes de desarrollo
├── i18n/                         # Locales EN/ES
└── public/img/                   # Assets estáticos
```

---

## 3. Principios Arquitectónicos

### 3.1 Dominios Cohesivos

El código se agrupa por entidad tanto en frontend como backend:

```
world (entidad)
├── app/composables/manage/useWorld.ts        # Composable CRUD
├── server/api/world/_crud.ts                 # Handler principal
├── server/api/world/index.get.ts             # List
├── server/api/world/[id].get.ts              # Detail
└── server/schemas/entities/world.ts          # Zod schemas
```

### 3.2 Verticales Completas

Cada funcionalidad recorre la cadena completa: **DB → API → Composables → UI**

```
Ejemplo: Crear nueva carta
1. UI: FormModal.vue con presets
2. Composable: useEntity().create(payload)
3. API: POST /api/base_card (createCrudHandlers)
4. DB: translatableUpsert() → INSERT base_card + translations
5. Response: { success, data, meta } → UI actualiza
```

### 3.3 Tipado Compartido

Los tipos se derivan desde Kysely y Zod, propagándose a toda la aplicación:

```typescript
// server/database/types.ts (generado por Kysely)
interface DB {
  worlds: WorldTable
  worlds_translations: WorldTranslationsTable
  // ...
}

// server/schemas/entities/world.ts
export const worldCreateSchema = z.object({
  code: z.string(),
  name: z.string(),
  // ...
})

// Inferencia automática en handlers y composables
type WorldCreate = z.infer<typeof worldCreateSchema>
```

---

## 4. Patrones de Diseño Clave

### 4.1 Bridge Pattern (Tablas)

Las tablas utilizan un patrón de puente entre los datos y la visualización:

```
┌──────────────┐     ┌───────────────────┐     ┌─────────────────┐
│   useEntity  │ ──▶ │ ManageTableBridge │ ──▶ │ CommonDataTable │
│   (datos)    │     │ (transformación)  │     │ (renderizado)   │
└──────────────┘     └───────────────────┘     └─────────────────┘
```

**Beneficios:**
- Separación de responsabilidades
- Reutilización de la tabla común
- Capabilities declarativas por entidad

### 4.2 Capability Pattern

Las capacidades se inyectan mediante composables:

```typescript
// useEntityCapabilities.ts
export function useEntityCapabilities(entityType: EntityType) {
  return {
    translatable: ['world', 'arcana', 'base_card'].includes(entityType),
    hasTags: ['world', 'arcana', 'base_card', 'facet'].includes(entityType),
    hasPreview: true,
    hasFeedback: entityType !== 'tag',
    canRevision: ['world', 'arcana', 'base_card'].includes(entityType),
    // ...
  }
}
```

### 4.3 CRUD Handler Factory

El backend usa una factoría para generar handlers CRUD:

```typescript
// server/utils/createCrudHandlers.ts
export function createCrudHandlers<T>(config: CrudConfig<T>) {
  return {
    list: async (event) => {
      const filters = buildFilters(event, config.allowedSorts)
      const query = config.buildQuery(db, filters)
      return createPaginatedResponse(await query, meta)
    },
    create: async (event) => {
      const body = await readValidatedBody(event, config.createSchema)
      return await translatableUpsert(config.table, body)
    },
    // update, delete, batch, export, import...
  }
}
```

---

## 5. Flujos de Datos

### 5.1 Flujo de Lectura (SSR)

```
1. Usuario accede a /manage?entity=world&lang=es
2. useAsyncData() → useEntity().fetchList()
3. GET /api/world?lang=es&page=1
4. Middleware: 00.auth.hydrate → 01.auth.guard → 02.rate-limit
5. Handler: buildFilters() → Kysely query con COALESCE(es, en)
6. Response: { success, data: [...], meta: { page, totalItems } }
7. SSR: Renderizado con datos ya cargados
8. Client: Hidratación sin refetch (datos en payload)
```

### 5.2 Flujo de Escritura

```
1. Usuario edita carta en FormModal
2. onSubmit() → useEntity().update(id, payload)
3. PATCH /api/base_card/123?lang=es
4. Body validado contra Zod schema
5. translatableUpsert() → UPDATE base_card + UPSERT translations
6. Logging: { id, lang, timeMs, user_id }
7. Response: { success, data } → invalidateList()
8. UI: Toast + cierre modal + refresh lista
```

### 5.3 Flujo Editorial (Publish)

```
1. Admin selecciona versión en /admin/versions
2. Click "Publicar" → useContentVersions().publish()
3. POST /api/content_versions/publish
4. Validación: canPublish permission
5. Transacción:
   a. Crear/actualizar content_version
   b. Marcar revisiones 'approved' → 'published'
   c. Actualizar content_version_id en entidades
6. Log: { revisionsPublished, entitiesUpdated, timeMs }
7. Response: resumen de publicación
```

---

## 6. Contratos de API

### 6.1 Formato de Respuesta

```typescript
// Éxito
{
  success: true,
  data: T | T[],
  meta?: {
    page: number
    pageSize: number
    totalItems: number
    totalPages: number
    search?: string
  }
}

// Error
{
  statusCode: 400 | 401 | 403 | 404 | 422 | 500,
  statusMessage: string,
  data?: { errors: ZodError[] }
}
```

### 6.2 Paginación y Filtros

Todos los listados soportan:

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `page` | number | Página (1-based) |
| `pageSize` | number | Items por página (1-100) |
| `q` / `search` | string | Búsqueda en campos traducibles |
| `sort` | string | Campo de ordenación (whitelist) |
| `direction` | asc/desc | Dirección de orden |
| `lang` | string | Idioma de traducción |
| `status` | string | Filtro por estado |
| `tags` / `tag_ids` | array | Filtro por tags (OR) |

---

## 7. Invariantes del Sistema

### 7.1 Invariantes de Frontend

| Invariante | Descripción | Componentes afectados |
|------------|-------------|----------------------|
| **Tabla unificada** | Solo `CommonDataTable` + bridges | Todas las tablas |
| **Preview centralizado** | Solo `EntityInspectorDrawer` | Previews de entidad |
| **Formularios preseteados** | Solo `FormModal` + presets | CRUD de entidades |
| **SSR-first** | `useAsyncData`/`useApiFetch` obligatorios | Todas las lecturas |

### 7.2 Invariantes de Backend

| Invariante | Descripción | Utils afectados |
|------------|-------------|-----------------|
| **Respuestas uniformes** | `{ success, data, meta }` | `createResponse` |
| **Filtrado seguro** | Whitelist de campos sort | `buildFilters` |
| **CRUD multiidioma** | Transacciones con fallback | `translatableUpsert` |
| **Borrado controlado** | EN borra entidad, otros solo traducción | `deleteLocalizedEntity` |

---

## 8. Decisiones Técnicas Notables

### 8.1 Por qué Kysely sobre Prisma

- **Tipado granular** de queries SQL complejas
- **Control total** sobre JOINs y subconsultas
- **Menor overhead** en runtime
- **Mejor soporte** para PostgreSQL features

### 8.2 Por qué Nuxt UI 4

- **Diseño consistente** con tokens de diseño
- **Accesibilidad incorporada** (ARIA, focus management)
- **Integración nativa** con TailwindCSS v4
- **Componentes completos** (modales, tablas, formularios)

### 8.3 Por qué i18n a Nivel de BD

- **Consultas optimizadas** con COALESCE
- **Fallback automático** a inglés
- **Independencia** del frontend para traducciones
- **Escalabilidad** a múltiples idiomas

---

## 9. Áreas de Riesgo Arquitectónico

### 9.1 Complejidad SQL

Los `_crud.ts` de entidades con tags y traducciones tienen queries complejas:

```sql
SELECT e.*, 
       COALESCE(t.name, t_en.name) as name,
       array_agg(tg.name) as tags
FROM entity e
LEFT JOIN entity_translations t ON t.entity_id = e.id AND t.lang = $1
LEFT JOIN entity_translations t_en ON t_en.entity_id = e.id AND t_en.lang = 'en'
LEFT JOIN tag_links tl ON tl.entity_id = e.id
LEFT JOIN tags tg ON tg.id = tl.tag_id
GROUP BY e.id, t.name, t_en.name
```

**Mitigación:** Pruebas multi-idioma obligatorias antes de merge.

### 9.2 Coherencia de Capacidades

Si frontend y backend divergen en permisos/capacidades:

```
Frontend: muestra botón "Publicar" 
Backend: rechaza por falta de canPublish
```

**Mitigación:** `useEntityCapabilities` como fuente única de verdad.

### 9.3 Caching Inconsistente

Si se omiten invalidaciones tras mutations:

```
1. Usuario A crea entidad
2. Usuario B no ve la entidad (cache stale)
```

**Mitigación:** `invalidateList()` obligatorio en mutations.

---

## 10. Próximas Evoluciones Arquitectónicas

### 10.1 Corto Plazo
- Migrar tablas legacy a bridges
- Implementar `useTableSelection` compartido
- Consolidar `useServerPagination`

### 10.2 Medio Plazo
- Provider de capacidades (IoC pattern)
- Storybook para componentes críticos
- Métricas con OTLP/Prometheus

### 10.3 Largo Plazo
- Effect System 2.0 integrado
- Cache distribuido para rate limit
- Testing e2e con Playwright

---

*Este documento detalla la arquitectura técnica de Tarot2. Para análisis de componentes específicos, consultar los documentos de Frontend y Backend.*
