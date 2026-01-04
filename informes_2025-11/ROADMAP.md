# 🚀 ROADMAP TAROT2 — Versión 1.1

**Última actualización:** 26 Nov 2025
**Estado:** Activo
**Documento maestro para Windsurf y para desarrollo humano**

---

# 0. Estado tras ajustes manuales

Este roadmap parte del estado **actual** del proyecto después de una serie de ajustes manuales donde:

* Se han corregido inconsistencias visuales.
* Se han alineado estilos y estructuras internas.
* Se ha estabilizado la arquitectura tras auditorías Nuxt y Nuxt UI.
* Se definió una base sólida para migrar componentes legacy de forma ordenada.
* Se actualizaron todos los informes técnicos (Components, Global, Server, Routes, Entities, Composables).

Este documento sustituye toda versión previa del roadmap.

---

# 1. Principios de diseño y restricciones (obligatorios)

Windsurf **debe seguir estos principios al editar código**:

### 1.1 Tablas unificadas

✔️ Solo se permiten tablas a través de:

* `ManageTableBridge`
* `AdminTableBridge`
* `CommonDataTable`

⛔ Está **prohibido** crear `<table>` manuales o `<UTable>` sueltos.

---

### 1.2 Formularios preseteados

✔️ Todo formulario CRUD debe implementarse con:

* `FormModal`
* `entityFieldPresets`
* `useEntityFormPreset` (si aplica)

⛔ Queda **prohibido** crear formularios manuales en Admin.

---

### 1.3 Previews centralizados

✔️ Todo preview debe usar:

* `EntityInspectorDrawer`

⛔ Prohibido crear modales de preview (`PreviewModal` legacy será eliminado).

---

### 1.4 Seguridad

✔️ Los handlers CRUD deben usar:
`createCrudHandlers`, `buildFilters`, `translatableUpsert`, `deleteLocalizedEntity`.

⛔ Prohibido modificar lógica SQL de `_crud.ts` sin pruebas explícitas.

---

### 1.5 No duplicar abstracciones

✔️ Siempre se debe reutilizar lo existente en `common/`, `utils/`, `composables/`.

⛔ No crear nuevos bridges, nuevas tablas ad-hoc ni nuevos pipelines paralelos.

---

# 2. Pre-flight Checklist (antes de cambios grandes)

Windsurf **debe comprobar** estas condiciones:

* [ ] Ningún componente contiene `<table>` sin Bridge asociado.
* [ ] No quedan `$fetch` en componentes SSR (solo en libs internas).
* [ ] `scripts/missed-i18n.mjs` produce 0 claves nuevas.
* [ ] Los presets en `entityFieldPresets` no generan warnings.
* [ ] No existen componentes duplicados en `components/manage/view/`.
* [ ] No persiste ningún modal con `:model-value`; todos usan `v-model:open`.

---

# 3. Resumen por área (estado actual)

### 3.1 Frontend

* Manage → 90% migrado a patrones modernos.
* Admin → Mezcla de Legacy + Moderno (principal foco de trabajo).
* Common → Estable, especialmente `CommonDataTable`.

### 3.2 Composables

* `useEntity`, `useListMeta`, `useQuerySync`, `useEntityCapabilities` → Estables.
* Falta crear `useTableSelection` unificado.

### 3.3 Backend

* CRUD consolidado.
* Falta: Rate limit + Logout seguro + Helper SQL para tags.

### 3.4 I18n

* Cobertura completa en EN/ES.
* Scripts de mantenimiento funcionan perfecto.

---

# 4. Fases del Roadmap

## 🏗️ **Fase 0 · Cimientos y Securización (Inmediata)**

**Objetivo:** Saneamiento de seguridad y SSR antes de tocar UI profunda.

### Tareas

| Tarea                                               | Impacto | Archivo                                      |
| --------------------------------------------------- | ------- | -------------------------------------------- |
| Implementar `02.rate-limit` en login/logout/publish | 🔥 Alta | `/server/middleware/02.rate-limit.ts`        |
| Limpiar cookie en `/api/auth/logout`                | 🔥 Alta | `/server/api/auth/logout.post.ts`            |
| QA accesibilidad modales y drawers                  | Media   | `FormModal.vue`, `EntityInspectorDrawer.vue` |
| Migrar `$fetch` residual a `useApiFetch`            | Alta    | Buscar en Admin                              |

---

## 🎨 **Fase 1 · Convergencia UI**

**Objetivo:** Unificar UI Admin y eliminar legacy.**

Se divide en dos subfases para evitar cambios gigantes:

---

### 🎨 **Fase 1A · Convergencia Admin (Core)**

| Tarea                                               | Impacto | Archivo                                     |
| --------------------------------------------------- | ------- | ------------------------------------------- |
| Migrar `VersionList.vue` → `AdminTableBridge`       | Alta    | `/components/admin/VersionList.vue`         |
| Migrar `RevisionsTable.vue` (tabla manual → bridge) | Alta    | `/components/admin/RevisionsTable.vue`      |
| Eliminar `PreviewModal.vue` (migrar a Drawer)       | Alta    | `/components/manage/modal/PreviewModal.vue` |
| Normalizar todos los `USelectMenu` a `v-model`      | Media   | Admin & Manage                              |

---

### 🎨 **Fase 1B · Convergencia Admin (Completo)**

| Tarea                                         | Impacto | Archivo                                 |
| --------------------------------------------- | ------- | --------------------------------------- |
| Migrar `UserTable.vue` → AdminTableBridge     | Media   | `/components/admin/users/UserTable.vue` |
| Migrar `RoleForm.vue` → `FormModal + presets` | Media   | `/components/admin/RoleForm.vue`        |
| Añadir `BulkActionsBar` sticky                | Medio   | `/components/admin/*`                   |
| Expandir `StatusBadge` a Admin                | Baja    | `StatusBadge.vue`                       |

---

## 👁️ **Fase 2 · Observabilidad & Performance**

**Objetivo:** Instrumentación ligera y mejoras de rendimiento.**

| Tarea                                    | Impacto | Archivo                     |
| ---------------------------------------- | ------- | --------------------------- |
| Implementar `useRequestMetrics`          | Media   | `/composables/common`       |
| Añadir `requestId` a logs backend        | Media   | `/server/plugins/logger.ts` |
| Optimizar preview SSR con lazy-load real | Media   | `useEntityPreviewFetch.ts`  |
| Medir ratio 304/200                      | Baja    | Logs + Dashboard            |

---

## 📚 **Fase 3 · Expansión narrativa**

**Objetivo:** Nuevos sistemas de contenido y paneles.**

| Tarea                                | Impacto | Archivo                 |
| ------------------------------------ | ------- | ----------------------- |
| Effect System 2.0 (editor guiado)    | Alta    | `FormModal`             |
| Metadata extendida para mundos/mazos | Media   | `world_card`            |
| Dashboard i18n                       | Media   | `/admin/i18n-dashboard` |

---

# 5. Backlog general (no prioritario todavía)

### UI / Componentes

* Skeletons reutilizables para tablas + cards.
* Toolbar declarativa por entidad.
* Chips y badges unificados en Admin.

### Backend

* Helper SQL tags AND/ANY.
* Endurecer import/export.
* Mejorar logging de publish/revert.

### I18n

* Radar de cobertura i18n.
* Sugerencias automáticas de traducción faltante.

---

# 6. Reglas de edición estrictas para Windsurf

### ❌ Prohibido

* Crear nuevas tablas o componentes CRUD fuera de Bridges.
* Crear formularios manuales en Admin.
* Alterar SQL complejo de `_crud.ts` sin permiso explícito.
* Usar `$fetch` fuera de utilidades internas.
* Crear nuevos componentes en `common/` sin justificación documentada.

### ✔️ Permitido

* Migrar componentes legacy → Bridges.
* Reemplazar modales legacy → Drawer.
* Añadir `aria-*` o `v-model`.
* Crear presets nuevos en `entityFieldPresets`.
* Mejorar accesibilidad.

---

# 7. Uso práctico del ROADMAP en Windsurf

Cuando solicites cambios a Windsurf:

1. **Indica la fase exacta y la tarea**, ejemplo:

   > Ejecuta la Fase 1A, tarea "Migrar VersionList.vue a AdminTableBridge".

2. Windsurf **debe consultar este documento** como autoridad.

3. Si hay conflicto entre este roadmap y un informe viejo → **gana el roadmap**.

4. Si algo no está descrito, debe preguntarte antes de modificar código.

---

# 8. Regeneraciones recomendadas

Después de cada fase completada:

* Regenerar `COMPONENTS.md`, `GLOBAL.md`, `SERVER.md`, `COMPOSABLES.md`.
* Ejecutar scripts i18n.
* Actualizar codemaps MCP.
* Revisar auditoría Nuxt & Nuxt UI.

