---
trigger: always_on
---
# 🧩 TAROT2 — ADDITIONAL RULES (GUIDED, NON-BLOCKING)

> **Purpose**: These rules refine and support `tarot2.md`.
> They exist to **reduce common Windsurf failure modes** without freezing evolution.
>
> These rules are **advisory but enforceable** when they protect consistency, accessibility or data integrity.

---

## 0. How to Read These Rules

* These rules **do not override** the core axioms or invariants.
* They focus on **DX, clarity and safety**.
* When a rule conflicts with an explicit design change, the design change wins — **but the intent must be preserved**.

---

## ⭐ 1. Anti-Confusion Rule — Component Reality Check

### Objective

Avoid accidental use of non-existent or non-global components.

### Invariants

* Nuxt auto-imports composables, **not all components**.
* Components must exist and be importable at the usage site.

### Rule

> Never assume a component is globally available unless explicitly documented.
> If a component does not exist, create it explicitly following existing patterns.

### Forbidden

* Using components based on name similarity or intuition
* Relying on undocumented auto-import behavior

---

## ⭐ 2. Modal Rules — Accessibility First

### Objective

Ensure all modals remain accessible and predictable.

### Invariants

* Keyboard navigation must always work
* Focus must be trapped and restored
* Screen readers must identify modal context

### Rule

> All modals must:
>
> * use `UModal`
> * declare `role="dialog"` and `aria-modal="true"`
> * manage focus correctly (trap + restore)

### Note

Implementation details may evolve, but **accessibility guarantees must not**.

---

## ⭐ 3. Async Safety Rule

### Objective

Maintain consistent async control flow.

### Invariants

* Async logic must be readable and predictable

### Rule

> Prefer `async/await` for all async operations.
> Avoid `.then()` / `.catch()` unless the file already uses that style.

---

## ⭐ 4. Clean Output Rule

### Objective

Prevent debug noise from leaking into production.

### Rule

> No `console.log`, `console.warn`, `debugger`, or temporary logs in final code.
> Backend logging must use the structured logging system.

---

## ⭐ 5. Component Tree Stability

### Objective

Protect architectural anchor points.

### Invariants

The following components are **structural** and must not be renamed or moved:

* `CommonDataTable`
* `ManageTableBridge`
* `AdminTableBridge`
* `EntityBase`
* `EntityInspectorDrawer`
* `FormModal`
* `EntitySlideover`

### Rule

> Internal refactors are allowed.
> Renaming, moving or repurposing these components requires explicit approval.

---

## ⭐ 6. Zod & Schema Discipline

### Objective

Guarantee end-to-end data integrity.

### Invariants

* Zod schemas in `shared/schemas` are the **canonical definition** of domain data

### Rule

> Any new field introduced in the UI must:
>
> * exist in a shared Zod schema
> * be validated in frontend and backend
> * be mapped through presets and payloads

### Forbidden

* UI-only fields without schema backing
* Backend-only fields not reflected in schemas

---

## ⭐ 7. Performance Discipline

### Objective

Avoid accidental reactivity overhead.

### Invariants

* Reactivity must be intentional

### Rule

> Avoid `watch` / `watchEffect` unless strictly necessary.
> Prefer computed properties and explicit triggers.

---

## ⭐ 8. Anti-Duplication Rule

### Objective

Prevent logic fragmentation.

### Rule

> Before creating a new utility or helper, search:
>
> * `utils/`
> * `composables/`
> * CodeMaps

### Forbidden

* Reimplementing existing helpers
* Slight variations of the same utility

---

## ⭐ 9. Route Consistency Rule

### Objective

Keep backend APIs predictable.

### Invariants

* Entity APIs follow `/server/api/<entity>` patterns

### Rule

> New entity routes must:
>
> * use `createCrudHandlers`
> * define Zod schemas for query and body
> * respect filters and pagination contracts

---

## ⭐ 10. Cross-Surface Awareness

### Objective

Prevent invisible breaking changes.

### Rule

> Changes to shared modules must be reviewed in both:
>
> * Manage
> * Admin

Affected areas include:

* table bridges
* entity rows
* capabilities
* form infrastructure

---

## ⭐ 11. PR & Change Hygiene

### Objective

Keep changes reviewable and intentional.

### Rule

> Prefer small, focused PRs.
> Each PR should document:
>
> * intent
> * affected areas
> * invariants preserved

---

## ⭐ 12. Manual QA Reminder

### Objective

Compensate for lack of automated tests.

### Rule

> Before finalizing a PR, manually verify:
>
> * CRUD flows
> * bulk actions
> * previews
> * filters & pagination
> * console cleanliness

This checklist should be included in the PR description.

---

## ⭐ 13. Backend Query Optimization Rule

### Objective

Prevent N+1 queries and expensive joins in hot paths.

### Invariants

* Auth hydration must fetch only essential user data
* Tags and relations must use batch fetching via `eagerTags` utility
* Avoid json_agg/LEFT JOIN in auth middleware and session validation

### Rule

> Auth middleware should never perform heavy joins for roles or permissions.
> Use targeted queries or cached lookups instead.

---

## ⭐ 14. UI/Logic Separation Rule

### Objective

Keep data fetching logic decoupled from presentation components.

### Invariants

* Filter options → `useFilterOptions` composable
* Entity preview → `useEntityPreviewFetch` composable

### Rule

> Never mix API calls directly in Vue components.
> Extract fetching into composables that return reactive state.

---

## ⭐ 15. Explicit Zod Rule

### Objective

Avoid brittle schema introspection in forms.

### Invariants

* Forms receive explicit `fields` prop from presets
* No runtime schema field inference in FormModal

### Rule

> Schemas define structure; presets define UI behavior.
> Forms must not infer fields from Zod schema at runtime.

---

## ⭐ 16. Module Scope Initialization Rule

### Objective

Prevent per-request overhead from module-level initialization.

### Invariants

* Encoders/decoders (JWT, etc.) instantiated at module scope
* Database clients and adapters reused, not recreated

### Rule

> Heavy initialization must happen once per module load, not per request.
> Use lazy initialization with caching when needed.

---

## Final Note

> These rules exist to **support evolution, not prevent it**.
> If a rule becomes an obstacle, reassess its intent — not just its wording.
