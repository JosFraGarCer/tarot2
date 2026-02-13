# Sketch → /manage Integration Plan

> Incremental integration of editorial UX sketches into the production `/manage` surface.
> Each PR is small, focused, and independently shippable. No large refactors.

---

## 1. Components to Promote

| Sketch component | Target location | Notes |
|---|---|---|
| `EntityEditorialIndicator.vue` | `components/common/EntityEditorialIndicator.vue` | Clean prop API: `editorial_state`, `translation_coverage {current, total}`, `next_action?`. Replaces ad-hoc StatusBadge usage for editorial contexts. |
| Delete impact summary pattern | Inline in `useEntityDeletion` refactor | Not a standalone component — the 2-step flow + impact table becomes part of the deletion composable/modal. |
| Row actions pattern | Inline in `ManageTableBridge` / `EntityBase` | Primary Edit + Next Transition + Overflow menu replaces the 7-icon column. |

**Not promoted** (remain sketch-only for now):
- `mockData.ts` — replaced by real API data via `useEntity.ts`
- `EditorialIndicator.vue` (old) — superseded by `EntityEditorialIndicator.vue`

---

## 2. EntityBase Changes (No Massive Refactor)

Target: `app/components/manage/EntityBase.vue`

| Change | Scope | Risk |
|---|---|---|
| Remove double-click row handler | Delete 1 event binding | Low — no functionality depends on it exclusively |
| Add `editorial_state` column via `useManageColumns` | Column config only | Low — data already present in API response |
| Replace 7-icon action column with 3-action pattern | Template change in row slot | Medium — test all 7 entities |
| Post-create toast with "Add Translations" action | Add to `handleCreate` success path | Low — additive |
| Replace delete confirmation with 2-step flow | Modify `useEntityDeletion` call | Medium — test base + translation delete for all entities |

**Explicitly NOT changed in this phase:**
- `EntitySlideover.vue` internal structure
- `FormModal.vue` field rendering
- `EntityFilters.vue` layout
- Tab structure in `manage.vue`

---

## 3. Minimal Changes to useManageColumns / useEntity

### useManageColumns.ts

Add two new columns after the entity-specific switch block, before `updated_at`:

```ts
// After the switch block, before updated_at:
add({
  id: 'editorial_state',
  header: t('ui.fields.editorialState'),
  // Cell renders EntityEditorialIndicator (compact mode)
})

add({
  id: 'translation_coverage',
  header: t('ui.fields.translations'),
  // Cell renders coverage badge from entity.translations
})
```

These columns are **conditional** on `capabilities.hasStatus` (all 7 core entities have it).

### useEntity.ts

**No changes needed.** The `editorial_state` field is already present in list responses (eager-loaded in `_crud.ts` for all 7 entities). The composable passes through all API fields.

### entityRows.ts

Add two computed fields to the `EntityRow` mapping:

```ts
// In mapToEntityRow or equivalent:
editorial_state: item.editorial_state ?? null,
translation_coverage: {
  current: item.translations?.filter(t => t.has_translation && !t.is_fallback).length ?? 0,
  total: item.translations?.length ?? 0,
},
```

---

## 4. Feature Flags / Capabilities

Extend `EntityCapabilities` in `useEntityCapabilities.ts`:

```ts
export interface EntityCapabilities {
  // ... existing
  hasEditorialState?: boolean    // Show editorial_state column + indicator
  hasTranslationCoverage?: boolean  // Show translation coverage column
  hasEditorialTransitions?: boolean // Show "Next transition" row action
}
```

### Per-entity defaults:

| Entity | hasEditorialState | hasTranslationCoverage | hasEditorialTransitions |
|---|---|---|---|
| base_card | ✅ | ✅ | ✅ |
| arcana | ✅ | ✅ | ✅ |
| facet | ✅ | ✅ | ✅ |
| world | ✅ | ✅ | ✅ |
| world_card | ✅ | ✅ | ✅ |
| skill | ✅ | ✅ | ✅ |
| card_type | ✅ | ✅ | ✅ |
| tag | ❌ | ❌ | ❌ |
| content_version | ✅ | ❌ | ✅ |
| feedback | ❌ | ❌ | ❌ |

This allows gradual rollout: enable per entity, verify, move to next.

---

## 5. UX Metrics to Validate

### Journey: "Find entities needing FR translation"
- **Before:** Open entity list → scan rows → open each entity → check translations tab → count = N+1 clicks
- **After:** Filter "Missing FR" → scan table → count = 1 click
- **Target:** ≤ 2 clicks

### Journey: "Send entity to review"
- **Before:** Double-click row → wait for Slideover → find editorial section → click transition → count = 4 clicks
- **After:** Click "Pending Review" button in row → count = 1 click
- **Target:** ≤ 1 click

### Journey: "Create entity + add FR translation"
- **Before:** Click Create → fill form → submit → navigate back to list → find entity → double-click → find translation tab → add FR → count = 7+ clicks
- **After:** Click Create → fill form → submit → click toast action → fill FR → save → count = 4 clicks
- **Target:** ≤ 4 clicks

### Journey: "Delete entity with confidence"
- **Before:** Click delete → generic "Are you sure?" → no impact preview → count = 2 clicks but low confidence
- **After:** Click Delete → see impact summary (base/translations/editorial_state/tags) → confirm → count = 3 clicks with full confidence
- **Target:** 3 clicks, 0 surprise deletions

### Journey: "Scan editorial health of all entities"
- **Before:** Open dashboard → 12+ API calls → wait → scan grouped lists → count = 1 page but slow
- **After:** Open entity list → editorial_state + coverage visible in table → count = 0 extra clicks
- **Target:** 0 extra navigation, < 1s load

---

## 6. Ordered PR List

### PR 1: `feat(manage): promote EntityEditorialIndicator to common`
- Move `EntityEditorialIndicator.vue` to `components/common/`
- Add i18n keys for status labels
- Add unit-level smoke test (renders with null state, renders with full state)
- **Affected:** No existing components changed
- **Risk:** None

### PR 2: `feat(manage): add editorial_state + translation columns`
- Add `hasEditorialState` and `hasTranslationCoverage` to `EntityCapabilities`
- Add columns to `useManageColumns.ts` (conditional on capabilities)
- Add `editorial_state` and `translation_coverage` to `entityRows.ts` mapping
- Use `EntityEditorialIndicator` (compact) in column cells
- **Affected:** `useManageColumns.ts`, `entityRows.ts`, `useEntityCapabilities.ts`
- **Risk:** Low — additive columns, no existing columns changed
- **QA:** Verify all 7 entities show correct editorial_state and coverage

### PR 3: `feat(manage): editorial status filter`
- Add editorial_state status filter to `EntityFilters.vue`
- Add "Missing [lang]" toggle filter
- Wire to `useManageFilters` / `buildFilters`
- **Affected:** `EntityFilters.vue`, `useManageFilters.ts`
- **Risk:** Low — additive filter, existing filters unchanged
- **QA:** Filter by draft, published, missing FR — verify correct results

### PR 4: `feat(manage): redesign row actions`
- Replace 7-icon column with: Edit (primary) + Next Transition + Overflow menu
- Remove double-click handler from `EntityBase.vue`
- Edit always opens `EntitySlideover` (not `FormModal`)
- Add `hasEditorialTransitions` capability check
- **Affected:** `EntityBase.vue` (row template), `ManageTableBridge.vue`
- **Risk:** Medium — changes user interaction pattern
- **QA:** Test Edit, Next Transition, Delete, Tags, Feedback for all 7 entities

### PR 5: `feat(manage): post-create translation guidance`
- After `FormModal` create success, show toast with "Add Translations" action
- Toast action opens `EntitySlideover` on translation section
- **Affected:** `EntityBase.vue` (handleCreate callback)
- **Risk:** Low — additive behavior
- **QA:** Create entity → verify toast → click action → verify Slideover opens on translations

### PR 6: `feat(manage): 2-step delete with impact preview`
- Replace `useEntityDeletion` confirmation with 2-step flow
- Step 1: choose base vs translation
- Step 2: impact summary table + confirm
- **Affected:** `useEntityDeletion.ts`, delete modal template
- **Risk:** Medium — changes delete UX
- **QA:** Delete base entity (verify cascade), delete single translation (verify fallback), cancel at each step

### PR 7 (optional): `feat(manage): dashboard v2 using list endpoints`
- Replace `useEditorialDashboard` with list-based approach
- Group by `editorial_state.status` client-side
- Add translation coverage summary per entity type
- **Affected:** `dashboard.vue`, `useEditorialDashboard.ts`
- **Risk:** Medium — replaces dashboard data source
- **QA:** Verify all status groups populated, verify translation percentages

---

## Invariants Preserved

Per project rules, every PR must preserve:

- ✅ Zod schemas remain single source of truth (no new UI-only fields)
- ✅ `createCrudHandlers` pipeline unchanged
- ✅ `editorial_state` comes from existing eager-loaded API response
- ✅ Capabilities-based behavior (no hard-coded role checks)
- ✅ Structural components (`CommonDataTable`, `ManageTableBridge`, `EntityBase`, `EntitySlideover`, `FormModal`) not renamed or moved
- ✅ Accessibility: keyboard navigation, focus management, ARIA labels
- ✅ No `console.log` or debug noise in final code

---

## Manual QA Checklist (per PR)

- [ ] CRUD flows work for all 7 entities
- [ ] Bulk actions still functional
- [ ] Previews render correctly
- [ ] Filters and pagination work
- [ ] Console is clean (no warnings/errors)
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Screen reader announces status changes
