# Executive Summary
- **Filters key mismatch** between UI and composables breaks server filtering (tags/facet/type/status names differ from API params). Fixing this is a P0 to make filtering work.
- **Create/Edit/Tags/Status flows are stubbed**; `ManageEntity` handlers only log. Add modals/forms and composable actions for status and tags.
- **Permissions via v-can are used but not enforced in composables**; add server errors → UI handling and disabled/hidden control patterns.
- **i18n strategy is good** (create in EN, read in current locale) but missing UI controls for translations (create default EN, edit current).
- **Pagination is wired SSR-safely**; ensure totalItems meta alignment and array envelope variations are already handled.
- **Status UI absent**; add inline controls for cards/tables with optimistic updates and rollback.
- **Inconsistent filter config naming** across [/pages/manage.vue](cci:7://file:///home/bulu/work/devel/tarot2/app/pages/manage.vue:0:0-0:0), composables and [EntityFilters.vue](cci:7://file:///home/bulu/work/devel/tarot2/app/components/manage/EntityFilters.vue:0:0-0:0).
- **Missing useCardStatus helper**; propose a minimal utility to standardize status label/color/variant across views.
- **A11y & performance**: add labels/aria, keyboard support, debounce search, and optional virtualization if needed.

Priority plan:
- P0 (must-fix): Filters key mapping; wire CRUD actions (create/edit/delete); status/tag actions in composables; error handling; v-can disabled/hide semantics; search debounce.
- P1 (should): Translations UI flow; status chip/control; optimistic updates; add `useCardStatus`; refactor `ManageEntity` props/emit contracts; add tests on [useEntity](cci:1://file:///home/bulu/work/devel/tarot2/app/composables/manage/useEntity.ts:80:0-294:1).
- P2 (nice): Virtualized lists for large datasets; skeleton loaders; improve image loading and defer; advanced batch actions.

# Architecture & Data Flow
- /app/pages/manage.vue → EntityBase (ManageEntity) → Filters/View (EntityFilters/EntityCardsView/EntityCarta/Table) → useXCrud → useEntity → useApiFetch → server/api/*

ASCII:
- manage.vue
  - selects `selectedTab` → computes config → passes `useCrud`, [filtersConfig](cci:1://file:///home/bulu/work/devel/tarot2/app/components/manage/EntityBase.vue:104:2-104:27), `viewMode`, `entity`
  - ViewControls controls `viewMode` and `templateKey`
- EntityBase.vue
  - constructs `crud = useCrud()`, calls [crud.fetchList()](cci:1://file:///home/bulu/work/devel/tarot2/app/composables/manage/useEntity.ts:168:2-173:3)
  - renders Filters, View, PaginationControls
- EntityFilters.vue
  - binds to `crud.filters.*` (search/tags/facet/type/status/isActive)
- Views
  - EntityCardsView/EntityCardsView2/EntityCarta render cards
  - Actions component emits edit/delete/feedback/tags events
- useXCrud composables
  - wrap [useEntity](cci:1://file:///home/bulu/work/devel/tarot2/app/composables/manage/useEntity.ts:80:0-294:1) with resourcePath, zod schemas, and base filters
- useEntity.ts
  - builds `listKey` from resource, filters, pagination, lang
  - SSR-safe `useAsyncData` with GET params
  - create uses `body: { lang: 'en', ... }`, update/delete with params.lang
- i18n injected via `useI18n().locale` into [useEntity](cci:1://file:///home/bulu/work/devel/tarot2/app/composables/manage/useEntity.ts:80:0-294:1) params and Create defaults to EN
- Pagination injected from `crud.pagination` into PaginationControls
- Permissions enforced in UI via `v-can` (edit/translate/publish/tags/delete buttons and create button). Server still must enforce.

# Type & Schema Alignment
Cross-check types: /app/types/entities.ts
- CoreCardStatus matches Zod enums (world.ts lines 4–14)
- Entities:
  - CardType: CoreCard (+ no extra fields)
  - BaseCard: CoreCard + card_type_id, List has card_type_* fields
  - World: CoreCard
  - Arcana: CoreCard
  - Facet: CoreCard + arcana_id (+ WithEffects)
  - Skill: CoreCard + card_type_id (+ WithEffects) but list references facet_* fields (check: SkillList includes facet_code/name/language_code — composable filters want facetId)
  - Tag: separate model with category, parent_id, etc.

UI fields ↔ DTO fields (List/Create/Update) summary:
- CardType
  - UI: name, code, isActive, status, image
  - DTO: CoreCardList/CoreCardCreate/CoreCardUpdate fields
- BaseCard
  - UI: name, code, isActive, image, cardType (selection), tags
  - DTO: BaseCardList/BaseCardCreate has card_type_id; tags handled via separate endpoints or embedded?
- World
  - UI: name, code, isActive, image, tags
  - DTO: WorldList/CoreCardCreate
- Arcana
  - UI: name, code, isActive, tags
- Facet
  - UI: name, code, isActive, arcana (selection), tags
  - DTO: FacetCreate has arcana_id
- Skill
  - UI: name, code, isActive, facet (selection), tags
  - DTO: SkillCreate currently has card_type_id in types; but list references facet_*; likely Skill should relate to `facet_id` not `card_type_id`. This is a gap.
- Tag
  - UI: code, category, name, parent, isActive

Gaps/inconsistencies and proposed fixes:
- Skill type inconsistency:
  - In /app/types/entities.ts lines 112–121, [Skill](cci:2://file:///home/bulu/work/devel/tarot2/app/types/entities.ts:111:0-113:1) uses `card_type_id`; but filters and list imply relation to [facet](cci:7://file:///home/bulu/work/devel/tarot2/server/api/home/bulu/work/devel/tarot2/server/api/facet:0:0-0:0). Proposed change:
    - Replace `card_type_id` with `facet_id: number`.
    - Update SkillList relation fields to `facet_*` (already present).
    - Breaking change: Adjust server DTOs and endpoints accordingly, or introduce both and deprecate `card_type_id`.
- Filter keys mismatch:
  - UI binding uses `crud.filters.tags/facet/type/status/isActive`
  - Composables initialize with `tagIds/facetId/cardTypeId/isActive`
  - Proposal: In UI, map v-models to underlying keys (computed getters/setters) to write to correct `crud.filters.*Id(s)` fields.
- Zod schemas exist for all entities; verify fields:
  - arcana.ts, basecard.ts, cardtype.ts, facet.ts, skill.ts, tag.ts, world.ts: Ensure they mirror DTOs in types. Skill schema should use `facet_id` instead of `card_type_id` per proposed type fix.

# Composables Review (useEntity + wrappers)
- Correctness:
  - SSR-safe: useAsyncData with key watching ✅ (/app/composables/manage/useEntity.ts lines 119–135)
  - Envelope tolerant: handles ApiResponse or array ✅ lines 147–155
  - i18n: includes params.lang and create body lang: 'en' ✅ lines 121–129, 203–206
- Validation path:
  - Create/Update parse via optional zod ✅ lines 201–206, 222–227
- Pagination/filter reactivity:
  - `listKey` includes JSON.stringify(filters) and pagination/locale ✅ lines 111–116
  - [normalizeFilters](cci:1://file:///home/bulu/work/devel/tarot2/app/composables/manage/useEntity.ts:60:0-69:1) drops defaults and true flags; good, but only if keys map correctly.
- Race/caching:
  - `watch: [listKey]` prevents duplicate manual watchers; refresh method exposed.
- Code smells:
  - Missing import of `reactive` in useEntity.ts (used at line 90). Add import from vue. P0.
  - [normalizeFilters](cci:1://file:///home/bulu/work/devel/tarot2/app/composables/manage/useEntity.ts:60:0-69:1) ignores value === true (line 66) which is fine for flags, but current UI sets arrays/numbers; mapping needed.
  - Create sets params.lang to current locale and body.lang = 'en'—OK, but ensure server expects both.
  - Errors: toErrorMessage compact; mirror list error to string ✅ lines 158–164.

Suggested patches:
- /app/composables/manage/useEntity.ts
  - Add `import { reactive } from 'vue'` at top.
- Add tag/status helpers: `addTags/removeTags/updateStatus` actions to [useEntity](cci:1://file:///home/bulu/work/devel/tarot2/app/composables/manage/useEntity.ts:80:0-294:1) to be optionally used by entity UIs (P1).

# Components Review (ManageEntity, Filters, Table, Cards)
- Props/Emits:
  - [EntityBase.vue](cci:7://file:///home/bulu/work/devel/tarot2/app/components/manage/EntityBase.vue:0:0-0:0) props minimal and good, but `entity` used to resolve image paths; OK.
  - Emits handled in local handlers but only console.log; wire to modals/composables.
- State flow:
  - `crud = useCrud()` inside; avoids prop drilling. Good.
- View modes:
  - 'tarjeta', 'tarjeta2' present; 'carta' implemented via EntityCarta. 'tabla' currently commented out; ViewControls includes it. Provide table later.
- Filters UX:
  - [EntityFilters.vue](cci:7://file:///home/bulu/work/devel/tarot2/app/components/manage/EntityFilters.vue:0:0-0:0) shows flags based on [config](cci:1://file:///home/bulu/work/devel/tarot2/app/components/manage/EntityFilters.vue:88:2-88:20) but binds wrong keys; options lists are empty (placeholders); add sources and `clear` button.
- Accessibility:
  - Buttons have icons, some aria-labels present in table view; add `aria-label` consistently; keyboard focus order OK; ensure labels for inputs/selects.
- Visual performance:
  - Consider skeleton cards and `loading="lazy"` on images (present in Cards2); align for Cards1; add `v-memo` or `key` stability.

# Permissions & Security
- v-can usage at:
  - EntityActions.vue lines 32–66 for edit/translate/feedback/tags/delete
  - EntityFilters.vue line 64 (create button) with v-can.disable
- Edge cases:
  - Disable vs hide: For delete, uses v-can.disable—user sees button disabled; for others uses v-can permit; standardize:
    - Edit/Tags: hide when not allowed; Delete: show disabled tooltip.
- Server enforcement:
  - UI must handle 403/401 gracefully. In [useEntity](cci:1://file:///home/bulu/work/devel/tarot2/app/composables/manage/useEntity.ts:80:0-294:1), catch 403 and set a friendly message; expose error to components to show toast.
- Token/cookie:
  - `useApiFetch` includes credentials; [useAuth](cci:1://file:///home/bulu/work/devel/tarot2/app/composables/auth/useAuth.ts:5:0-87:1) includes credentials for auth calls; store persists user; ensure CSRF/secure cookies documented in SECURITY.md (exists). Show error hygiene in components (toast).

# Status & Workflow Controls
- Status read/changed:
  - No UI to change status; `useCardStatus` missing. Add a utility and inline status change in cards and table row.
- Missing transitions/guardrails:
  - Enforce only valid transitions per role if needed (P1); otherwise backend guards.
- Suggested UI:
  - Add a UDropdown on status chip with options based on permissions; patch calls `updateStatus(id, nextStatus)` in composable.
- Optimistic updates:
  - Update local item status, rollback on failure, show toast. [useEntity](cci:1://file:///home/bulu/work/devel/tarot2/app/composables/manage/useEntity.ts:80:0-294:1) can expose helper.

# Tags & Translations Management
- Tags:
  - DTOs include tags array in card list items; no API or UI to add/remove. Add endpoints usage (assumed: POST/DELETE /{resource}/{id}/tags).
  - In UI, add a modal to pick tags (USelectMenu multi) and call composable actions.
- Translations:
  - Create in EN via [create](cci:1://file:///home/bulu/work/devel/tarot2/app/composables/manage/useEntity.ts:195:2-214:3) body.lang enforced; add UI to create translation in current locale if missing (copy from EN).
  - Editing: show fields in current locale; detect `language_code` vs `locale`.
  - Conflict resolution: if existing translation in current locale, update; else create translation endpoint if backend requires it; otherwise PATCH with `language_code: current`.

# Pagination, Filters & Performance
- Server pagination:
  - `totalItems` handled via meta.totalItems or meta.count; else fallback to array length. Good.
- Filter encoding:
  - Arrays vs scalar: need to encode `tagIds: number[]`, `facetId`, `cardTypeId`, `status`, [isActive](cci:1://file:///home/bulu/work/devel/tarot2/app/components/manage/view/EntityCarta.vue:118:0-120:1).
  - Current UI uses `tags/facet/type/status/isActive`; fix mapping.
- Debounce search:
  - Add 300ms debounce on `crud.filters.search`.
- Batching changes:
  - Use watch to recompute only when needed (already via `listKey`).
- Performance risks:
  - N+1 UI calls not evident; ensure selects for filters are loaded once and cached.

# Error Handling & Empty States
- Errors:
  - `useEntity.error` exists; components don’t display it. Add an alert/toast above lists.
- Loading:
  - Skeletons for cards; show `UPagination` only when items loaded; disable controls while loading.
- Empty:
  - Show empty state with CTA “Create” if permitted.

# i18n & A11y Checklist
- All labels via t(): mostly OK, add missing aria-labels.
- Language badge: implemented in cards; ensure consistent key fallback.
- Keyboard: ensure buttons focusable, add title/aria-label; fix USelectMenu labels with `placeholder`.

# DX & Testing Strategy
- Unit tests:
  - [useEntity](cci:1://file:///home/bulu/work/devel/tarot2/app/composables/manage/useEntity.ts:80:0-294:1): listKey behavior, normalizeFilters, create/update lang behavior, error mapping, pagination meta mapping.
- Component tests:
  - `EntityBase`: pagination events change `crud.pagination`; view switching; emits wired.
  - `EntityFilters`: filter mapping to correct keys and API params.
  - Actions: v-can hide/disable semantics.
- Contract tests:
  - Types ↔ schemas: Zod parse against sample DTOs.

# Concrete Recommendations (Prioritized)
P0
- /app/composables/manage/useEntity.ts
  - Add missing import
    - Before line 10:
      - import { reactive } from 'vue'
- /app/components/manage/EntityFilters.vue
  - Map UI models to composable filter keys:
    - Replace v-models:
      - tags → computed that reads/writes `crud.filters.tagIds`
      - facet → computed for `crud.filters.facetId`
      - type → computed for `crud.filters.cardTypeId`
      - status → `crud.filters.status` (string or null)
      - isActive → [crud.filters.isActive](cci:1://file:///home/bulu/work/devel/tarot2/app/components/manage/view/EntityCarta.vue:118:0-120:1)
  - Add debounced input for search.
  - Provide option sources:
    - Tag options from `/api/tag?isActive=true`
    - Facet options from `/api/facet?isActive=true`
    - Type options from `/api/card_type?isActive=true`
- /app/components/manage/EntityBase.vue
  - Wire emits to actionable handlers:
    - onEdit → openEditModal with [crud.update](cci:1://file:///home/bulu/work/devel/tarot2/app/composables/manage/useEntity.ts:216:2-235:3)
    - onDelete → confirm then [crud.remove(id)](cci:1://file:///home/bulu/work/devel/tarot2/app/composables/manage/useEntity.ts:237:2-255:3) with refresh and toast
    - onTags → openTagModal using `crud.addTags/removeTags`
    - onFeedback → openFeedbackModal (stub P1)
- /app/pages/manage.vue
  - Ensure `filters-config` matches UI keys:
    - cardType: { search, isActive, type: true }
    - baseCard: { search, isActive, type: true, tags: true }
    - world/arcana: { search, isActive, tags: true }
    - facet: { search, isActive, tags: true, facet: false } (facet doesn’t filter by itself)
    - skill: { search, isActive, tags: true, facet: true }
    - tag: { search, isActive, category: true, parentId: true } → this one needs custom UI; for now hide tags facet/type in filters.
- v-can directive usage
  - Standardize delete as `v-can.disable` and others as `v-can` to hide.
- Error display
  - In EntityBase.vue, above views, show `<UAlert v-if="crud.error" :title="t('common.error')" :description="crud.error" color="error" />`

P1
- Add `useCardStatus` helper at `/app/utils/status.ts`:
  - Expose `label(status)`, `color(status)`, `variant(status)`, `options()` (i18n)
- Add status control in cards:
  - Add dropdown per item to change status if `v-can('canPublish'|'canReview')`.
  - [crud.update(id, { status })](cci:1://file:///home/bulu/work/devel/tarot2/app/composables/manage/useEntity.ts:216:2-235:3) with optimistic update.
- Add tag management composable helpers in [useEntity](cci:1://file:///home/bulu/work/devel/tarot2/app/composables/manage/useEntity.ts:80:0-294:1):
  - `async addTags(id, tagIds: number[])`, `removeTags` using `/resource/:id/tags` if available; fallback to [update(id, { tag_ids })](cci:1://file:///home/bulu/work/devel/tarot2/app/composables/manage/useEntity.ts:216:2-235:3).
- Translations:
  - Add `openTranslateModal(item)` to create missing translation in current locale (`PATCH` with `language_code: current` and fields).
- Implement `ManageEntityTable` view for 'tabla' basic columns and status inline controls.

P2
- Virtualization: If `totalItems > 200`, switch to virtual-scroller list.
- Skeletons: show while `crud.loading`.
- Defer images: add lazy + placeholder, serve `/img/{entity}/` with `loading="lazy"` consistently.

Acceptance criteria examples:
- Filters: Selecting 2 tags and one facet triggers GET with `tagIds=[..]&facetId=<id>`.
- Status: Changing to `published` updates badge color and persists.
- Tags: Adding a tag via modal shows immediately; persists after refresh.
- Translations: Editing in ES updates fields for ES.

# Incremental Adoption Plan
- Phase 1 (P0): Fix filters mapping + missing import; wire delete/edit modals; show errors. Risk low; rollback by reverting component changes.
- Phase 2 (P1): Add status helper and UI; tag management; translations modal. Risk medium; feature-flag status changes behind permission checks; rollback by hiding controls.
- Phase 3 (P2): Performance polish (virtualization, skeletons); a11y refinements; tests. Risk low; iterative PRs.

Success metrics:
- Filtered requests match expected query params.
- Error rate declines; lower 4xx on forbidden actions.
- Time-to-first-content for /manage unchanged or improved.
- Test coverage for [useEntity](cci:1://file:///home/bulu/work/devel/tarot2/app/composables/manage/useEntity.ts:80:0-294:1) ≥ 80% critical paths.

# Appendix
- Suggested Zod schemas updates (Skill example)
```ts
// /app/schemas/entities/skill.ts (proposed change)
export const skillCreateSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  facet_id: z.number().int(), // was card_type_id
  short_text: z.string().max(1000).optional().nullable(),
  description: z.string().max(10000).optional().nullable(),
  language_code: z.string().min(2).max(10).optional().nullable(),
  image: z.string().url().optional().nullable(),
  is_active: z.boolean().optional(),
  sort: z.number().int().optional().nullable(),
  status: statusEnum.optional(),
  created_by: z.number().int().optional().nullable(),
  content_version_id: z.number().int().optional().nullable(),
})
export const skillUpdateSchema = skillCreateSchema.partial().extend({ name: z.string().min(1) })
```

- Types updates (breaking)
```ts
// /app/types/entities.ts
export interface Skill extends CoreCard, WithEffects {
  facet_id: number // replace card_type_id
}
export interface SkillList extends Skill {
  facet_code?: string | null
  facet_name?: string | null
  facet_language_code?: string | null
}
```

- EntityFilters mapping snippet
```ts
// inside <script setup> of EntityFilters.vue
const tagIdsModel = computed<number[]>({
  get: () => crud.filters.tagIds ?? [],
  set: v => (crud.filters.tagIds = v ?? []),
})
const facetIdModel = computed<number | null>({
  get: () => crud.filters.facetId ?? null,
  set: v => (crud.filters.facetId = v ?? null),
})
const cardTypeIdModel = computed<number | null>({
  get: () => crud.filters.cardTypeId ?? null,
  set: v => (crud.filters.cardTypeId = v ?? null),
})
const statusModel = computed<string | null>({
  get: () => crud.filters.status ?? null,
  set: v => (crud.filters.status = v ?? null),
})
const isActiveModel = computed<boolean | null>({
  get: () => crud.filters.isActive ?? null,
  set: v => (crud.filters.isActive = v),
})
// template: bind v-model to these models instead of crud.filters.tags/facet/type
```

- Example payloads
  - Create BaseCard (always EN)
```json
POST /api/base_card?lang=es
{ "lang": "en", "code": "BC_FIREBALL", "name": "Fireball", "card_type_id": 2, "is_active": true }
```
  - Update status
```json
PATCH /api/base_card/12?lang=es
{ "status": "published" }
```
  - Add tags (if endpoint exists)
```json
POST /api/base_card/12/tags
{ "tag_ids": [3, 5, 9] }
```

- Reusable helper signatures
```ts
// openCreateModal(entity: string, onSubmit: (payload) => Promise<any>)
type OpenModal = (entity: string, initial?: any) => Promise<void>
const openCreateModal: OpenModal = async (entity) => { /*...*/ }
const openEditModal: (entity: any) => Promise<void> = async (row) => { /*...*/ }
const openTagModal: (entityId: number, current: number[]) => Promise<void> = async () => {}
```

# Architecture & Data Flow (lines)
- manage.vue lines 19–35 (tabs and ManageEntity), 73–127 (entityConfigs)
- EntityBase.vue lines 113–121 (crud init), 68–77 (pagination binding)
- EntityFilters.vue lines 6–13 (search), 14–62 (filters), 64–72 (create with v-can)
- EntityCardsView.vue lines 28–37 (actions), 52–58 (active badge)
- useEntity.ts lines 111–116 (listKey), 119–135 (useAsyncData), 147–155 (envelope tolerance), 196–215 (create), 217–236 (update), 238–256 (remove)

# Findings
- **P0 filter mismatch** is the largest functional gap. Fixing this will make filters usable across all entities.
- **Action handlers are stubs**; implement actual flows for core operations.
- **Minor bug**: missing `reactive` import in [useEntity.ts](cci:7://file:///home/bulu/work/devel/tarot2/app/composables/manage/useEntity.ts:0:0-0:0).
- **Status feature missing**; add helper + UI.
- **Skill type/schemas** likely misaligned with actual domain (facet relationship). Propose correction.

# Recommended Actions
- **[P0] Fix filters mapping in EntityFilters.vue**
- **[P0] Import reactive in useEntity.ts**
- **[P0] Implement edit/delete/tag actions in EntityBase.vue**
- **[P1] Add status helper and inline controls**
- **[P1] Add translations flow for current locale**
- **[P1] Add error display and search debounce**
- **[P2] Performance polish and a11y enhancements**




---
---
---
---




# Executive Summary
- Align manage module to backend translation model: PATCH upserts translation in requested `lang`; DELETE should differentiate entity vs translation deletion.
- Add translation helpers to create/edit/delete per-locale without losing EN fallback. Show a clear UI “Edit in locale” vs “Delete translation”.
- Introduce a shared `useCardStatus.ts` to normalize [CoreCardStatus](cci:2://file:///home/bulu/work/devel/tarot2/app/types/entities.ts:8:0-17:14) labels/colors and provide permissible transitions.
- Implement inline status change controls (cards/table) with optimistic update and rollback.
- Keep tags embedded in GET; update tags via PATCH `tag_ids: number[]`. Provide `TagPickerModal.vue` and composable helpers.
- Complete Skill migration from `card_type_id` to `facet_id` in types/schemas/composables (server already exposes facet joins).
- Strengthen UX: global alerts/toasts for CRUD, explicit flows for translation vs entity deletion, locale badges.
- Enforce permissions consistently (`v-can` hide vs disable) and map 401/403/422 to user-friendly messages.
- Preserve SSR safety: `useAsyncData` keys, i18n `lang`, and pagination remain intact.

Roadmap:
- P0: Translation helpers and UI, status utility + inline change, tag update flow, Skill `facet_id` migration wiring, error/toast layer.
- P1: Table view status actions, TagPicker modal polishing, translation delete confirmation, tests for [useEntity](cci:1://file:///home/bulu/work/devel/tarot2/app/composables/manage/useEntity.ts:80:0-294:1).
- P2: Optimizations (skeletons, lazy images), deeper a11y, virtualization for large lists.

# Translations Alignment
Backend pattern (reference: server uses `lang` to upsert translations during PATCH, e.g., /server/api/facet/[id].patch.ts lines 16–66):
- PATCH with `?lang=<locale>` updates base fields and upserts translation row for that `lang`.
- Translation read resolves to requested language with EN fallback (`language_code_resolved`).

Required frontend helpers
- Create `useTranslationActions()` to encapsulate per-locale operations on any resource.

Example: /app/composables/manage/useTranslationActions.ts
```ts
import { useI18n } from '#imports'
import { useApiFetch } from '~/utils/fetcher'

export function useTranslationActions(resourcePath: string) {
  const { locale } = useI18n()
  const $fetch = useApiFetch

  async function upsert(id: number, fields: { name: string; short_text?: string | null; description?: string | null }, lang?: string) {
    const res = await $fetch(`${resourcePath}/${id}`, {
      method: 'PATCH',
      params: { lang: lang ?? String(locale.value) },
      body: fields,
    })
    return res
  }

  // Prefer dedicated endpoint if backend provides it (recommended):
  // DELETE `${resourcePath}/${id}/translation?lang=xx`
  async function deleteTranslation(id: number, lang?: string) {
    // Fallback approach if no translation DELETE exists: clear the translation fields
    return upsert(id, { name: '', short_text: null, description: null }, lang)
  }

  return { upsert, deleteTranslation }
}
```

Integration in ManageEntity
- In [EntityBase.vue](cci:7://file:///home/bulu/work/devel/tarot2/app/components/manage/EntityBase.vue:0:0-0:0):
  - Add buttons/actions:
    - “Edit in <currentLocale>” → open edit modal prefilled with current values; save calls `translation.upsert(id, fields)`.
    - “Delete translation” (if current item `language_code_resolved !== 'en'`) → confirmation → `translation.deleteTranslation(id)`, then refresh.
  - Show a small badge indicating current translation vs fallback:
    - If `item.language_code_resolved !== currentLocale`, show “EN fallback” badge.

UI notes
- New actions can live inside [EntityActions.vue](cci:7://file:///home/bulu/work/devel/tarot2/app/components/manage/EntityActions.vue:0:0-0:0) behind `v-can="['canTranslate','canEditContent']"`.
- Add confirmation text clarifying difference between delete translation and delete entity.

# Status Workflow
Utility: /app/utils/status.ts (new)
```ts
import type { CoreCardStatus } from '@/types/entities'

type StatusMeta = { labelKey: string; color: 'neutral'|'primary'|'warning'|'success'|'error'; variant: 'subtle'|'soft'|'outline' }
const map: Record<CoreCardStatus, StatusMeta> = {
  draft: { labelKey: 'status.draft', color: 'neutral', variant: 'subtle' },
  review: { labelKey: 'status.review', color: 'warning', variant: 'soft' },
  pending_review: { labelKey: 'status.pending_review', color: 'warning', variant: 'soft' },
  changes_requested: { labelKey: 'status.changes_requested', color: 'warning', variant: 'outline' },
  translation_review: { labelKey: 'status.translation_review', color: 'warning', variant: 'soft' },
  approved: { labelKey: 'status.approved', color: 'primary', variant: 'soft' },
  published: { labelKey: 'status.published', color: 'success', variant: 'soft' },
  rejected: { labelKey: 'status.rejected', color: 'error', variant: 'soft' },
  archived: { labelKey: 'status.archived', color: 'neutral', variant: 'outline' },
}

export function useCardStatus() {
  const all: CoreCardStatus[] = Object.keys(map) as CoreCardStatus[]
  const meta = (s?: CoreCardStatus) => (s && map[s]) || map.draft
  const options = () => all.map(s => ({ value: s, ...map[s] }))
  const labelKey = (s?: CoreCardStatus) => meta(s).labelKey
  const color = (s?: CoreCardStatus) => meta(s).color
  const variant = (s?: CoreCardStatus) => meta(s).variant
  return { options, labelKey, color, variant }
}
```

UI inline dropdown (cards/table)
- Cards (e.g., /app/components/manage/view/EntityCardsView.vue):
  - Next to the active badge, render a `UDropdown` showing all `useCardStatus().options()`.
  - Permission guard: `v-can="['canPublish','canReview']"`.
  - On select:
    - Optimistically set `item.status = newStatus`.
    - Call [crud.update(item.id, { status: newStatus })](cci:1://file:///home/bulu/work/devel/tarot2/app/composables/manage/useEntity.ts:216:2-235:3).
    - On error: rollback and show error toast.

Optimistic update pattern
```ts
async function onChangeStatus(item: any, next: CoreCardStatus) {
  const prev = item.status
  item.status = next
  try {
    await crud.update(item.id, { status: next })
    toast.success(t('status.updated'))
  } catch (e) {
    item.status = prev
    toast.error(crud.error || t('errors.update_failed'))
  }
}
```

# Tags Integration
Contract
- Keep tags in list payloads.
- Update via PATCH with `tag_ids: number[]` to replace associations atomically.

Composable helpers (extend useEntity)
```ts
async function updateTags(id: number, tagIds: number[]) {
  error.value = null
  actionPending.value = true
  try {
    const res = await $fetch<ApiResponse<unknown>>(`${options.resourcePath}/${id}`, {
      method: 'PATCH',
      params: { lang: lang.value },
      body: { tag_ids: tagIds },
    })
    await refresh()
    return res
  } catch (e) { error.value = toErrorMessage(e); throw e }
  finally { actionPending.value = false }
}
```

UI: TagPickerModal.vue (concept)
- USelectMenu multiple with remote items from `/api/tag?is_active=true&category=...`.
- Props: `modelValue: number[]`, `options: { label, value }[]`.
- Emits `save(tagIds: number[])`; parent calls `crud.updateTags(id, tagIds)`.
- Used via [EntityActions.vue](cci:7://file:///home/bulu/work/devel/tarot2/app/components/manage/EntityActions.vue:0:0-0:0) “Tags” button (hidden with `noTags` or `!v-can('canAssignTags')`).

# Type & Schema Corrections
Skill type fix
- Already applied in /app/types/entities.ts (facet_id change).
- Update schema to reflect `facet_id`.

Diff: /app/schemas/entities/skill.ts
```diff
-  card_type_id: z.number().int(),
+  facet_id: z.number().int(),
```

Composables
- Filters already converted to `facet_id` by you; keep `resourcePath: '/api/skill'` unchanged.

No breaking changes for other entities (CardType, BaseCard, World, Arcana, Facet, Tag) beyond using snake_case in filters and PATCH payloads.

# Composables & Components Refactor
useEntity.ts
- Import missing `reactive` to avoid runtime error.
- Add new helpers: `updateTags`, and consider `updateStatus` thin wrapper for clarity.

Minimal patch sketch:
/app/composables/manage/useEntity.ts
```diff
- import { ref, computed, watch, watchEffect  } from 'vue'
+ import { ref, computed, watch, watchEffect, reactive } from 'vue'
```
Add to return:
```ts
return {
  // ...
  update, remove,
  updateTags, // new
  // helpers...
}
```

ManageEntity.vue (/app/components/manage/EntityBase.vue)
- Wire emits to real actions:
  - edit → open modal and call [crud.update(id, payload)](cci:1://file:///home/bulu/work/devel/tarot2/app/composables/manage/useEntity.ts:216:2-235:3)
  - delete → confirm, [crud.remove(id)](cci:1://file:///home/bulu/work/devel/tarot2/app/composables/manage/useEntity.ts:237:2-255:3), refresh, toast
  - tags → open TagPickerModal, call `crud.updateTags(id, tagIds)`
  - feedback → stub
- Display global error alert if `crud.error`.

Example handlers
```ts
function onDelete(row: any) {
  if (!confirm(t('common.confirmDelete'))) return
  crud.remove(row.id).then(() => toast.success(t('common.deleted'))).catch(() => toast.error(crud.error || t('errors.delete_failed')))
}

async function onTags(row: any) {
  const next = await openTagPicker({ selected: (row.tags || []).map((t:any)=>t.id) })
  if (next) await crud.updateTags(row.id, next)
}
```

EntityActions.vue
- Keep v-can usage; ensure:
  - Edit/Tags/Feedback: hidden when unauthorized (`v-can`).
  - Delete: `v-can.disable` to show but disabled, with tooltip.

Cards views
- Add translation badge using `language_code_resolved` vs `locale`.
- Add status dropdown (see Status Workflow) with optimistic update.

# Error & UX Enhancements
- Add `UAlert` at top of [EntityBase.vue](cci:7://file:///home/bulu/work/devel/tarot2/app/components/manage/EntityBase.vue:0:0-0:0) when `crud.error`.
- Toasts for success/error after CRUD actions (`@nuxt/ui` UToast or composable).
- Empty state:
  - If no items and not loading: show neutral message and “Create” CTA (guarded by permissions).
- Visual translation indicators:
  - Badge on cards “EN” or the fallback code when not current locale.
  - Tooltip explaining fallback behavior.

# Security & Permissions
- v-can patterns:
  - Use `v-can` to hide Edit/Tags/Feedback when not allowed.
  - Use `v-can.disable` for Delete to show disabled affordance with tooltip (dangerous action).
- Server error mapping:
  - 401/403 → “Not allowed to perform this action.”
  - 422 → show validation messages from Zod.
  - 500 → generic “Something went wrong.”
- Implement mapping in [toErrorMessage()](cci:1://file:///home/bulu/work/devel/tarot2/app/composables/manage/useEntity.ts:49:0-58:1) and surface via alert/toast.

# Priority Roadmap
| Priority | Task | File(s) | Expected Outcome |
|----------|------|---------|------------------|
| P0 | Import `reactive` and expose `updateTags` | /app/composables/manage/useEntity.ts | Stable filters state; ability to PATCH tag_ids |
| P0 | Add `useCardStatus.ts` | /app/utils/status.ts | Consistent status labels/colors/options |
| P0 | Wire actions in ManageEntity | /app/components/manage/EntityBase.vue, EntityActions.vue | Working edit/delete/tags with toasts |
| P0 | Translation helpers | /app/composables/manage/useTranslationActions.ts | Per-locale upsert/delete flows aligned to backend |
| P0 | Skill `facet_id` schema update | /app/schemas/entities/skill.ts | Frontend schema matches backend relationship |
| P1 | Inline status dropdown | Cards views + Table | Quick status changes with optimistic UX |
| P1 | TagPicker modal | /app/components/manage/TagPickerModal.vue | Manage tags via modal, PATCH tag_ids |
| P1 | Global alert & toast layer | ManageEntity.vue | Clear feedback on CRUD and errors |
| P1 | Translation delete confirmation | EntityActions.vue | Prevent accidental entity deletion |
| P2 | Skeletons & lazy images | Cards views | Smoother perceived performance |
| P2 | A11y polish | Filters, Actions | Better labels, aria, keyboard nav |
| P2 | Tests for useEntity | New tests | Confidence in pagination, errors, lang behavior |

# Translations: Examples
- Upsert translation (ES)
```ts
const translation = useTranslationActions('/api/base_card')
await translation.upsert(12, { name: 'Bola de Fuego', short_text: '...' }, 'es')
```
- Delete translation (ES)
```ts
await translation.deleteTranslation(12, 'es') // uses dedicated endpoint if added; fallback clears fields via PATCH
```

# Status change: Example
```ts
const { options, labelKey, color, variant } = useCardStatus()
<UDropdown :items="options().map(o => ({ label: t(o.labelKey), value: o.value }))" @select="(v)=>onChangeStatus(item, v.value)" />
```

# Tags update: Example
```ts
await crud.updateTags(item.id, selectedTagIds)
```

# Notes on SSR & i18n
- Keep `useAsyncData` key stable by including `lang`, pagination, and filters (already implemented).
- Keep create with body `{ lang: 'en', ... }` so EN exists by default; edit others via PATCH for current locale.
- Ensure [useEntity.create](cci:1://file:///home/bulu/work/devel/tarot2/app/composables/manage/useEntity.ts:195:2-214:3) and [update](cci:1://file:///home/bulu/work/devel/tarot2/app/composables/manage/useEntity.ts:216:2-235:3) always send `params: { lang: locale }`.

# Closing
This plan delivers translation-aware CRUD, inline status management, tag updates via PATCH, and the Skill `facet_id` correction, while preserving SSR and i18n behavior. Excluded: filters mapping (already handled).