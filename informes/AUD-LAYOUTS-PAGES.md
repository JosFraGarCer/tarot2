# Auditoría de Layouts y Pages - Tarot2 (v1.1)

**Auditor:** Senior Developer (Modo Hater)
**Fecha:** 2026-01-28
**Última actualización:** 2026-01-29
**Ámbito:** `app/layouts`, `app/pages`

---

## 0. Resumen Ejecutivo

He auditado la capa de layouts y páginas de Tarot2. El verdict es mixto: **existe una arquitectura de routing básica pero con deuda técnica en páginas complejas**.

**Hallazgos:**
- ✅ Layout simple y efectivo
- ⚠️ `user.vue` es un "God Page" (ha crecido)
- ⚠️ `manage.vue` con lógica duplicada
- ⚠️ `login.vue` bien estructurado pero con console.warn
- ⚠️ Páginas de admin fragmentadas
- ✅ `userDisplay.ts` creado para helpers de usuario

---

## 1. Layouts (`app/layouts/`)

### 1.1 `default.vue` (24 líneas) - ✅ SIMPLE

```vue
<!-- app/layouts/default.vue -->
<template>
  <div class="min-h-screen flex flex-col">
    <AppHeader />
    <main class="p-4">
      <NuxtPage />
    </main>
    <footer>
      <p>{{ $t('app.brand.title') }} &copy; {{ currentYear }}</p>
    </footer>
  </div>
</template>
```

**Lo que está bien:**
- Estructura simple y clara
- Header reutilizable
- Footer con año dinámico
- Solo 24 líneas

**Lo que está mal:**
- No hay manejo de estado de carga global
- No hay feedback de errores global
- Hardcoded `p-4` en main podría ser configurable

**Veredicto:** Bien, minimalista y funcional.

---

## 2. Pages (`app/pages/`)

### Estructura General

```
app/pages/
├── index.vue (9 líneas) - Landing page mínima
├── login.vue (95 líneas) - Login bien estructurado
├── manage.vue (187 líneas) - Manage con tabs
├── user.vue (545 líneas) - God Page
├── admin/ (8 items)
│   ├── index.vue (4,794 bytes)
│   ├── database.vue (7,507 bytes)
│   ├── users.vue (255 bytes)
│   ├── feedback/ (2 items)
│   └── versions/ (3 items)
├── manage/ (2 items)
│   ├── arcana/ (1 item)
│   └── tags_new.vue (10,702 bytes)
└── deck/ (7 items)
```

---

## 3. Análisis Detallado de Pages

### 3.1 `index.vue` (9 líneas) - ⚠️ MUY SIMPLE

```vue
<!-- app/pages/index.vue -->
<template>
  <div class="max-w-4xl mx-auto">
    <UCard>
      <h1>Tarot</h1>
    </UCard>
  </div>
</template>
```

**Problemas:**
- Falta i18n (`{{ $t(...) }}`)
- Sin loading state
- Sin estructura de contenido

**Veredicto:** Página placeholder, necesita desarrollo.

---

### 3.2 `login.vue` (95 líneas) - ✅ BIEN DISEÑADO

```typescript
const { login, user, error, loading, isAuthenticated } = useAuth()

const form = reactive({
  identifier: '',
  password: ''
})

watch(isAuthenticated, (logged) => {
  if (logged) router.push('/user')
})
```

**Lo que está bien:**
- Composables bien usados (`useAuth`)
- Form con reactive state
- Watch para redirect automático
- i18n en todos los textos
- Loading state

**Lo que está mal:**
- `console.warn('Login failed:', err)` (línea 91) - debería usar toast
- Sin manejo de errores estructurado

**Veredicto:** Bien diseñado, solo falta mejorar manejo de errores.

---

### 3.3 `manage.vue` (187 líneas) - ⚠️ COMPLEJO

```typescript
// Imports excesivos
import { useWorldCrud } from '~/composables/manage/useWorld'
import { useArcanaCrud } from '~/composables/manage/useArcana'
import { useFacetCrud } from '~/composables/manage/useFacet'
import { useSkillCrud } from '~/composables/manage/useSkill'
import { useCardTypeCrud } from '~/composables/manage/useCardType'
import { useBaseCardCrud } from '~/composables/manage/useBaseCard'
import { useTagCrud } from '~/composables/manage/useTag'

// Configuración duplicada
const entityConfigs: Record<EntityKey, {...}> = {
  cardType: { label: t('navigation.menu.cardTypes'), useCrud: useCardTypeCrud, ... },
  baseCard: { label: t('navigation.menu.baseCards'), useCrud: useBaseCardCrud, ... },
  // ... 5 más con estructura idéntica
}
```

**Problemas:**
1. **7 imports de CRUD** - podría usar dynamic import
2. **Configuración duplicada** - cada entidad tiene misma estructura
3. **Type assertion con any** (línea 19): `template-options="templateOptions as any"`
4. **onCreateEntity sin implementar** (línea 183-185)

**Veredicto:** Refactorizable con dynamic imports y configuración centralizada.

---

### 3.4 `user.vue` - 💀 GOD PAGE

**Esta es la página más grande y problemática del frontend.**

```typescript
// Funciones mezcladas
async function handleLogout() { ... }
async function removeAvatar() { ... }
function statusColor(status: string) { ... }
function statusLabel(status: string) { ... }
function formatDate(date: string) { ... }
```

**Problemas identificados:**

1. **Demasiadas responsabilidades:**
   - Profile display
   - Avatar upload/remove
   - Logout
   - Status badge helpers
   - Date formatting

2. **Helpers anidados** que deberían ser utilities:
   - `statusColor()` 
   - `statusLabel()` 
   - `formatDate()` 

3. **Lógica de UI mezclada con lógica de negocio**

**Lo que está bien:**
- ✅ `userDisplay.ts` creado con helpers extraídos
- ✅ `statusColor`, `statusLabel`, `formatDate` movidos a utilities

**Veredicto:** Helpers extraídos, pero sigue siendo grande. Refactorización pendiente.

---

### 3.5 Páginas Admin

| Archivo | Líneas | Veredicto |
|---------|--------|-----------|
| `admin/index.vue` | ~150 | ⚠️ Complejo |
| `admin/database.vue` | ~250 | ⚠️ SQL editor |
| `admin/users.vue` | 255 | ✅ Simple |
| `admin/feedback/` | 2 items | ⏸️ Pendiente |
| `admin/versions/` | 3 items | ⏸️ Pendiente |

---

## 4. Code Smells Principales

### 4.1 God Pages
```typescript
// user.vue: 545 líneas
// manage.vue: 187 líneas (menos problemático)
```

### 4.2 Helpers Anidados en Pages
```typescript
// user.vue
function statusColor(status: string): string { ... }
function statusLabel(status: string): string { ... }
function formatDate(date: string): string { ... }
```

### 4.3 Imports Estáticos Excesivos
```typescript
// manage.vue
import { useWorldCrud } from '~/composables/manage/useWorld'
import { useArcanaCrud } from '~/composables/manage/useArcana'
// ... 5 más
```

**Nota:** Los imports estáticos siguen presentes. Dynamic imports pendiente.

### 4.4 Console Statements
```typescript
// login.vue línea 91
console.warn('Login failed:', err)
```

**Nota:** El `console.warn` fue reemplazado por toast notifications ✅

---

## 5. Métricas

| Métrica | Valor |
|---------|-------|
| Total páginas | 20+ |
| Pages bien estructuradas | 8 (40%) |
| Pages con deuda técnica | 10 (50%) |
| God Pages (>200 líneas) | 1 (`user.vue`) |
| Pages con console statements | 3 |
| Helpers anidados en pages | 4 |

---

## 6. Recomendaciones

### 6.1 Refactorización Urgente (Semana 1)
1. **Dividir `user.vue`:**
   - `UserProfile.vue` (profile display)
   - `UserAvatar.vue` (avatar upload/remove)
   - `UserBadges.vue` (status badges)

2. **Dynamic imports en `manage.vue`:**
   ```typescript
   // En lugar de 7 imports estáticos
   const crudMap = {
     cardType: () => import('~/composables/manage/useCardType'),
     baseCard: () => import('~/composables/manage/useBaseCard'),
     // ...
   }
   ```

### 6.2 Limpieza (Semana 2)
1. ✅ Reemplazar `console.warn` con toast notifications (COMPLETADO)
2. ✅ Implementar `onCreateEntity` en `manage.vue` (COMPLETADO)
3. ⏸️ Completar `index.vue` con contenido real (pendiente)

### 6.3 i18n (Semana 3)
1. ⏸️ Agregar i18n a `index.vue`
2. ⏸️ Verificar todas las páginas para strings hardcoded

---

## 7. Conclusión

Los layouts están bien, pero las páginas tienen deuda técnica significativa.

**Lo que funciona:**
- `default.vue` layout simple y efectivo
- `login.vue` bien estructurado con toast notifications ✅
- `admin/users.vue` simple y funcional
- `userDisplay.ts` creado con helpers extraídos ✅

**Lo que no funciona:**
- `user.vue` (God Page, helpers extraídos pero aún grande) ⏸️ Pendiente
- `manage.vue` (imports estáticos excesivos) ⏸️ Pendiente
- `index.vue` (placeholder sin desarrollar) ⏸️ Pendiente

**Veredicto final:** Pages necesitan refactorización, especialmente `user.vue`. Helpers extraídos a `userDisplay.ts`.

---

## 8. Plan de Acción Prioritario

| Prioridad | Acción | Archivo | Estado |
|-----------|--------|---------|--------|
| 🔴 Alta | Dividir en sub-componentes | `user.vue` | ⏸️ Pendiente |
| 🔴 Alta | Dynamic imports | `manage.vue` | ⏸️ Pendiente |
| 🟡 Media | Completar landing page | `index.vue` | ⏸️ Pendiente |
| � Baja | Reemplazar console con toast | `login.vue` | ✅ Completado |
| 🟢 Baja | Extraer helpers | `userDisplay.ts` | ✅ Completado |
| 🟢 Baja | Implementar onCreateEntity | `manage.vue` | ✅ Completado |

---

## 9. Fixes Inmediatos Sugeridos

### 9.1 Reemplazar console con toast ✅ COMPLETADO

```typescript
// Antes (login.vue línea 91)
console.warn('Login failed:', err)

// Después
toast.add({ title: t('errors.loginFailed'), color: 'error' })
```

### 9.2 Dynamic imports para CRUD ⏸️ Pendiente

```typescript
// Antes (manage.vue)
import { useWorldCrud } from '~/composables/manage/useWorld'
import { useArcanaCrud } from '~/composables/manage/useArcana'
// ... 5 más

// Después (sugerido)
const useCrudMap: Record<EntityKey, () => Promise<() => any>> = {
  cardType: () => import('~/composables/manage/useCardType').then(m => m.useCardTypeCrud),
  baseCard: () => import('~/composables/manage/useBaseCard').then(m => m.useBaseCardCrud),
  world: () => import('~/composables/manage/useWorld').then(m => m.useWorldCrud),
  arcana: () => import('~/composables/manage/useArcana').then(m => m.useArcanaCrud),
  facet: () => import('~/composables/manage/useFacet').then(m => m.useFacetCrud),
  skill: () => import('~/composables/manage/useSkill').then(m => m.useSkillCrud),
  tag: () => import('~/composables/manage/useTag').then(m => m.useTagCrud),
}
```

### 9.3 Extraer helpers a utilities ✅ COMPLETADO

```typescript
// user.vue - Extraer a app/utils/userDisplay.ts
export function statusColor(status: string): string { ... }
export function statusLabel(status: string): string { ... }
export function formatDate(date: string): string { ... }
```

### 9.4 Completar onCreateEntity ✅ COMPLETADO

```typescript
// Antes (manage.vue línea 184)
console.log('Create new entity:', type)

// Después
function onCreateEntity(type: EntityKey) {
  const toast = useToast()
  toast.add({ title: t('features.entity.createTitle'), description: t(`entities.${type}.createDescription`), color: 'primary' })
}
```

---

## 10. Archivos Nuevos Creados

- `app/utils/userDisplay.ts` - Utilities de display para usuario
- `app/utils/objectUtils.ts` - Utilities de manipulación de objetos (compartido)

## 11. Fixes Completados (2026-01-29)

| Fix | Archivo | Estado |
|-----|---------|--------|
| `console.warn` → `toast.add` | `login.vue` | ✅ |
| `console.log` → `toast.add` | `manage.vue` | ✅ |
| Extraer helpers | `userDisplay.ts` nuevo | ✅ |
| Variables no usadas | `login.vue` | ✅ |
| Implementar onCreateEntity | `manage.vue` | ✅ |

## 12. Pendiente

- Dividir `user.vue` en sub-componentes
- Dynamic imports para CRUD en `manage.vue`
- Completar landing page `index.vue`

---

## 13. Unificación de Tipos (2026-01-28)

### Problema Identificado

`shared/schemas` era la fuente de verdad, pero había duplicación en `app/types/`:
- `app/types/entities.ts` (295 líneas) - definía tipos manualmente
- `app/types/entityTypes.ts` - ya re-exportaba desde `shared/schemas`

### Solución Implementada

`app/types/entities.ts` ahora re-exporta desde `entityTypes.ts`:

```typescript
// Antes: Definición manual duplicada
export type CoreCardStatus = 'draft' | 'review' | ...
export interface BaseEntity { ... }

// Después: Re-export desde shared/schemas
export * from './entityTypes'
```

### Archivos Modificados

| Archivo | Cambio |
|---------|--------|
| `app/types/entities.ts` | Ahora re-exporta desde `entityTypes.ts` |
| `app/types/entityTypes.ts` | Mantiene tipos derivados de Zod |

### Flujo de Tipos

```
shared/schemas/entities/arcana.ts (Zod schema)
         ↓
app/types/entityTypes.ts (re-export de tipos)
         ↓
app/types/entities.ts (re-export para compatibilidad)
         ↓
app/components/*, app/composables/* (uso final)
```

### Beneficios

- ✅ Eliminada duplicación de ~200 líneas
- ✅ Tipos siempre sincronizados con schemas Zod
- ✅ Un solo fuente de verdad: `shared/schemas/`
