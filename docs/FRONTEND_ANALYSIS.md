# Tarot2 Frontend Analysis — Editorial Alignment

> **Date**: 2026-02-12
> **Scope**: Nuxt 3 + Tailwind + NuxtUI frontend (`app/`)
> **Context**: 7 core entities with `editorial_state` + `translation_state` now consistent in API LIST+DETAIL

---

## A) Diagnóstico Estructural (Arquitectura de UI)

### Superficies

| Surface | Path | Auth | Purpose |
|---|---|---|---|
| **Home** | `/` | Public | Placeholder (`<h1>Tarot</h1>`) |
| **Login** | `/login` | Public | Auth form |
| **Deck** | `/deck/*` | Public | Read-only entity browser (6 tabs, no world_card) |
| **Manage** | `/manage` | Staff+ | Editorial CRUD for 7 entities + tags (tabbed) |
| **Dashboard** | `/manage/dashboard` | Staff+ | Editorial overview (drafts, review, blocked, feedback) |
| **Admin** | `/admin/*` | Admin | Users, versions, feedback, database |
| **User** | `/user` | User+ | Profile page |

### Component Architecture

```
pages/manage.vue
  └─ EntityBase.vue (909 lines — GOD COMPONENT)
       ├─ EntityFilters.vue (520 lines)
       ├─ ManageTableBridge.vue → CommonDataTable.vue (table view)
       ├─ EntityCards.vue / EntityCardsClassic.vue / EntityCarta.vue (card views)
       ├─ EntityInspectorDrawer.vue (preview slideover, read-only)
       ├─ EntitySlideover.vue (918 lines — full editor)
       ├─ FormModal.vue (quick create/edit modal)
       ├─ DeleteDialogs (base delete vs translation delete)
       ├─ EntityTagsModal.vue
       ├─ FeedbackModal.vue
       └─ ImportJson.vue
```

### Data Flow

```
useEntity.ts (generic CRUD composable)
  ├─ useApiFetch → /api/<entity>
  ├─ Reactive: items, current, filters, pagination, lang
  └─ Per-entity wrappers: useBaseCardCrud, useArcanaCrud, etc.
       └─ EntityBase.vue consumes via props.useCrud()
```

### Key Observations

1. **`EntityBase.vue` is a 909-line god component** — it orchestrates 4 view modes, 6 modals, pagination, selection, import/export, deletion, feedback, tags, slideover navigation, and optimistic status updates. All entity-specific behavior is delegated through composables, but the orchestration surface is enormous.

2. **Two editing surfaces coexist**: `FormModal` (quick edit, modal) and `EntitySlideover` (full editor, slideover). Both can edit the same entity. The FormModal uses `useEntityFormPreset` for field definitions; the Slideover hardcodes its own field layout.

3. **`entityRows.ts` is a 342-line defensive mapper** — it normalizes any API shape into `EntityRow` using cascading `pickString()` calls with 10+ fallback candidates per field. This suggests the API shape has been historically unstable.

4. **Capabilities system is well-designed** — `useEntityCapabilities` provides a clean, injectable, per-entity feature flag system (translatable, hasTags, hasPreview, hasRevisions, hasStatus, hasReleaseStage).

5. **`editorial_state` is now available in LIST** (backend change just landed) but **the frontend doesn't consume it yet** — no column, no badge, no indicator in any view mode.

6. **`editorial` (computed transitions)** is consumed only in:
   - `EntitySlideover.vue` → `EditorialWorkflow.vue` (transition buttons)
   - `FormModal.vue` → inline `EditorialWorkflow` when editing status field
   - `manage/dashboard.vue` → blocked content section reads `editorial.blockingReasons`

7. **`translation_state`** is **not consumed anywhere in the frontend**. The `translationStatus` field in `entityRows.ts` resolves from `entity.translation_status` (a field that doesn't exist in the API). The Slideover computes its own translation meta from fallback detection.

---

## B) Diagnóstico UX (Journeys y Fricción)

### Journey 1: Crear entidad + traducción inicial
| Step | Action | Clicks |
|---|---|---|
| 1 | Navigate to `/manage` | 1 (nav link) |
| 2 | Select entity tab (e.g., "Arcana") | 1 |
| 3 | Click "Create" button | 1 |
| 4 | Fill FormModal fields, submit | 2 (fill + save) |
| 5 | Entity created in EN. **No feedback about translation state.** | — |
| **Total** | | **5 clicks** |

**Friction**: After creation, the user has no visual cue that the entity needs FR/ES translations. The FormModal closes and the user is back at the list with no next-step guidance.

### Journey 2: Añadir traducción (FR) y ver su estado
| Step | Action | Clicks |
|---|---|---|
| 1 | From list, click row (opens FormModal for quick edit) | 1 |
| 2 | **Problem**: FormModal has no language selector. Cannot add FR translation here. | — |
| 3 | Must double-click row to open EntitySlideover | 1 |
| 4 | Scroll to "Translations" section | 0 (scroll) |
| 5 | Select "FR" from language dropdown | 1 |
| 6 | Fill name/description, save | 2 |
| 7 | Translation status badge updates in Slideover header | — |
| **Total** | | **5+ clicks, requires knowing to double-click** |

**Friction**: Single-click opens FormModal (no translation support). Double-click opens Slideover (has translations). This is **undiscoverable** — no tooltip, no visual cue distinguishes the two actions. The "Full editor" button (expand icon) in the actions column is small and unlabeled.

### Journey 3: Revisar estado editorial desde listado
| Step | Action | Clicks |
|---|---|---|
| 1 | Look at entity list | 0 |
| 2 | **Problem**: No editorial status column in table. Only `status` badge is visible via StatusBadge in card views. | — |
| 3 | Must open each entity individually to see editorial state | 1 per entity |
| **Total** | | **N+1 clicks for N entities** |

**Friction**: `editorial_state` is now in the API LIST response but **not rendered anywhere**. The editor cannot scan the list to find entities needing attention. The Dashboard partially addresses this (drafts, pending review, blocked) but requires navigating to a separate page and doesn't show all entities.

### Journey 4: Listado → detalle → acción siguiente
| Step | Action | Clicks |
|---|---|---|
| 1 | Click row in table | 1 (opens FormModal) |
| 2 | FormModal shows fields + EditorialWorkflow (if editing) | — |
| 3 | Click transition button (e.g., "Send to Review") | 1 |
| 4 | **Problem**: FormModal emits transition but doesn't actually call API — it just sets `form.status`. User must also click "Save". | 1 |
| 5 | Or: double-click → Slideover → EditorialWorkflow → click transition → auto-saves | 2 |
| **Total** | | **3 clicks (modal) or 3 clicks (slideover)** |

**Friction**: In FormModal, editorial transitions are **misleading** — clicking a transition button doesn't execute it, it just pre-selects the status. The user must still save. In Slideover, transitions are immediate (API call on click). **Inconsistent mental model.**

### Journey 5: Borrado de traducción vs borrado base
| Step | Action | Clicks |
|---|---|---|
| 1 | Click delete icon on entity row | 1 |
| 2 | `useEntityDeletion` decides: if locale=EN or fallback → base delete dialog; if locale=FR → translation delete dialog | — |
| 3 | Confirm in dialog | 1 |
| **Total** | | **2 clicks** |

**Friction**: The delete behavior depends on the **current UI locale**, not the entity's language. If the user is browsing in FR and clicks delete, they get a "delete FR translation" dialog. If browsing in EN, they get "delete entire entity". This is **implicit and dangerous** — no preview of what will be deleted. No mention of cascading effects (editorial_state, translation_state cleanup).

---

## C) Pain Points Priorizados

### P0 — Critical (blocks editorial workflow)

1. **`editorial_state` invisible in list views** — The API now returns it, but no view mode (table, cards, classic, carta) renders it. Editors cannot scan for editorial health without opening each entity.

2. **Translation workflow undiscoverable** — Single-click = FormModal (no translations). Double-click = Slideover (has translations). No visual cue distinguishes them. New editors will never find the translation panel.

3. **FormModal editorial transitions are misleading** — Clicking a transition button doesn't execute it; it pre-selects status. User must also save. This violates the principle of least surprise.

### P1 — High (significant friction)

4. **No translation status in list** — `translation_state` per language is available via API but not rendered. Editors can't see which entities need FR/ES translations without opening each one.

5. **EntityBase.vue is a 909-line god component** — Every new feature (editorial indicators, translation status columns, bulk editorial actions) requires modifying this single file. High risk of regressions.

6. **Delete behavior depends on UI locale** — Implicit, dangerous. No preview of what will be deleted.

7. **Dashboard fetches all entities N×M times** — `useEditorialDashboard` makes 6 endpoints × N statuses = 12+ API calls on mount. No aggregation endpoint.

### P2 — Medium (polish and consistency)

8. **`entityRows.ts` defensive mapping** — 342 lines of fallback chains suggest API shape instability. Now that DTO is standardized, most fallbacks are dead code.

9. **4 view modes with duplicated rendering logic** — EntityCards, EntityCardsClassic, EntityCarta, EntityTable all render status/tags/actions independently. No shared "entity row renderer" component.

10. **Deck surface doesn't show world_card** — 6 entities in deck tabs, but world_card is missing.

11. **Home page is a placeholder** — Just `<h1>Tarot</h1>`.

12. **`useManageColumns` doesn't include editorial columns** — Column definitions are hardcoded per entity with no editorial_state or translation status columns.

---

## D) Oportunidades de Simplificación (Quick Wins)

### QW1: Add `editorial_state` badge to table rows
- **Effort**: Small (add column to `useManageColumns`, render via `StatusBadge`)
- **Impact**: P0 resolved — editors see editorial health at a glance
- **Files**: `useManageColumns.ts`, `ManageTableBridge.vue` (cell slot)

### QW2: Add "Full Editor" as primary row action
- **Effort**: Small (swap click/dblclick handlers in EntityBase)
- **Impact**: P0 partially resolved — translation panel becomes discoverable
- **Files**: `EntityBase.vue` (handleRowClick → openFullEditor)

### QW3: Make FormModal transitions execute immediately
- **Effort**: Small (emit 'transition' event that calls API directly)
- **Impact**: P0 resolved — consistent transition behavior
- **Files**: `FormModal.vue`, `EntityBase.vue`

### QW4: Add translation completeness indicator to list
- **Effort**: Medium (need to compute from `translation_state` or add API field)
- **Impact**: P1 resolved — editors see translation gaps
- **Files**: `useManageColumns.ts`, new `TranslationIndicator.vue`

### QW5: Simplify `entityRows.ts` fallback chains
- **Effort**: Medium (remove dead fallbacks now that DTO is stable)
- **Impact**: P2 resolved — reduced maintenance burden
- **Files**: `entityRows.ts`

---

## E) Propuesta de Dirección de Diseño

### Principio: "Editorial Status at Every Level"

The editorial workflow should be visible at **every zoom level**:

| Zoom | What the editor sees | Current | Proposed |
|---|---|---|---|
| **Dashboard** | Aggregated counts by status | ✅ Exists | Add translation completeness summary |
| **List** | Per-entity editorial health | ❌ Missing | `editorial_state` badge + translation indicator |
| **Row actions** | Next available action | ❌ Hidden in slideover | Primary action button in row |
| **Detail** | Full editorial workflow | ✅ Exists in Slideover | Keep, improve discoverability |

### Component Pattern: `EntityEditorialIndicator`

A small, reusable component that renders editorial health from `editorial_state`:

```
[draft ●] [2/3 langs] [→ review]
```

- Status dot (color-coded)
- Translation completeness fraction
- Next suggested action (from `editorial.allowedTransitions[0]`)

Usable in: table cells, card headers, slideover headers, dashboard items.

### Component Pattern: `EntityRowActions` (refactored)

Replace the current 7-button action column with a prioritized layout:

```
[Edit ▼] [→ Next Status] [...more]
```

- **Edit**: Opens Slideover (not FormModal) — single entry point
- **Next Status**: Most likely transition, one-click
- **More**: Delete, feedback, tags, export in dropdown

### Architecture Direction

1. **Extract EntityBase orchestration** into smaller composables:
   - `useEntityOrchestrator` (modal/slideover state machine)
   - `useEntityBulkActions` (selection + batch operations)
   - Keep EntityBase as a thin template

2. **Unify row rendering** across view modes:
   - Shared `EntityRowContent.vue` component
   - View modes only control layout (grid vs table vs list)

3. **Deprecate FormModal for entity editing**:
   - Keep FormModal only for **create** (simple, focused)
   - All editing goes through Slideover (translations, editorial, metadata)

---

## F) Plan de Sketches en `/pages/sketches`

### Sketch 1: `editorial-list.vue`
**Objective**: Table view with editorial_state column and translation indicators.

- Render `editorial_state.status` as colored dot in a new column
- Render translation completeness as `2/3` badge
- Filter by editorial status (draft, review, published)

**Success criteria**: Editor can identify all entities needing review without opening any. Click count for "find entities needing FR translation" goes from N+1 to 1.

### Sketch 2: `entity-row-actions.vue`
**Objective**: Redesigned row actions with editorial-first layout.

- Primary: "Edit" (opens Slideover)
- Secondary: Next editorial transition (one-click, calls API)
- Overflow: delete, feedback, tags

**Success criteria**: "Send entity to review" goes from 3 clicks to 1. No more FormModal/Slideover confusion.

### Sketch 3: `editorial-indicator.vue`
**Objective**: Reusable editorial health component.

- Consumes `editorial_state` + `editorial` (when available)
- Renders: status dot, translation fraction, next action hint
- Works in table cell, card header, and dashboard item

**Success criteria**: Component renders correctly with `editorial_state: null` (graceful degradation). Accessible (aria-label describes state).

### Sketch 4: `create-flow.vue`
**Objective**: Improved entity creation with post-create guidance.

- After create: toast with "Add FR translation" action button
- Or: auto-open Slideover on the new entity's translation section
- Show translation completeness immediately

**Success criteria**: "Create entity + add FR translation" goes from 5+ clicks (with discovery problem) to 3 clicks (guided).

### Sketch 5: `delete-preview.vue`
**Objective**: Delete confirmation with explicit impact preview.

- Show what will be deleted: base entity, N translations, editorial_state
- Distinguish "delete FR translation only" vs "delete entire entity"
- Language-independent: always show both options

**Success criteria**: User always knows exactly what will be deleted. No implicit behavior based on UI locale.

### Sketch 6: `dashboard-v2.vue`
**Objective**: Editorial dashboard that uses `editorial_state` from list endpoints.

- Single API call per entity (list with `editorial_state` eager-loaded)
- Group by editorial status across all entity types
- Show translation completeness per entity type

**Success criteria**: Dashboard loads in <1s (currently 12+ API calls). Shows cross-entity editorial health.

---

## Summary of Priorities

| Priority | Item | Type | Effort |
|---|---|---|---|
| **P0** | editorial_state visible in list | QW1 + Sketch 1 | Small |
| **P0** | Translation workflow discoverable | QW2 + Sketch 2 | Small |
| **P0** | FormModal transitions consistent | QW3 | Small |
| **P1** | Translation status in list | QW4 + Sketch 3 | Medium |
| **P1** | EntityBase decomposition | Sketch 2 pattern | Large |
| **P1** | Delete preview | Sketch 5 | Medium |
| **P1** | Dashboard optimization | Sketch 6 | Medium |
| **P2** | entityRows.ts cleanup | QW5 | Medium |
| **P2** | View mode unification | Architecture | Large |
