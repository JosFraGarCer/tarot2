---
trigger: always_on
---
# 🧠 TAROT2 — WINDSURF PROJECT RULES

> **Purpose**: This document defines the **editorial and architectural constitution** of the Tarot2 project.
> It exists to **protect stability, consistency and data integrity** while still allowing **guided evolution** of the UI and internal structure.
>
> These rules apply primarily to the **Tarot Editor application**.
> Gameplay, simulation and system exploration are governed by **separate documents**.

---

## 0. Scope & Intent (IMPORTANT)

### What this document IS

* A **constitutional layer** for the Tarot Editor
* A safety framework for Windsurf-assisted development
* A set of **non-negotiable invariants**

### What this document is NOT

* A game design document
* A combat or rules system specification
* A sandbox for experimentation

> **Rule of separation**:
> Editorial stability and gameplay experimentation must never share the same rule space.

---

## Weakly Typed Zones (Intentional)

Certain backend layers are intentionally weakly typed due to Kysely/Postgres limitations.

These include:
- DB result rows
- JSONB columns
- numeric / timestamp fields
- Selectable<T> outputs

In these zones:
- Type casts are allowed
- `unknown` / `any` are acceptable
- Linters may be suppressed locally
- Zod validation MUST follow immediately

Windsurf must NOT attempt to “fix” typing in these areas.

---

## UX Intentionality Rule

UI changes must be guided by:
- user intent
- task frequency
- cognitive load
- accessibility constraints

Visual redesigns must not be driven by aesthetics alone.
Each structural UI change must map to a clearer user journey.

---

## Accessibility Baseline — Nuxt UI & Tailwind

Nuxt UI components are the default accessibility baseline.

Custom components must:
- preserve keyboard navigation
- preserve focus management
- preserve ARIA semantics

If deviating from Nuxt UI patterns, accessibility guarantees must be reimplemented explicitly.

---

## Visual Change Justification

Visual or layout changes should be justified by:
- reduced steps
- clearer hierarchy
- reduced errors
- improved discoverability

Purely cosmetic changes should be avoided during editorial redesign.
---

## 1. Project Axioms (Always True)

### Axiom 1 — Zod is the Single Source of Truth

All domain data structures, inputs and outputs are defined in **shared Zod schemas**.

* Zod schemas live in `shared/schemas`
* TypeScript types are **always inferred from Zod**
* Frontend and backend **must consume the same schemas**
* Database schemas are **not** a source of runtime truth
* No duplicated domain typing is allowed

---

### Axiom 2 — Shared Schemas Are Cross-App Contracts

The `shared/schemas` layer is the **canonical contract** between:

* Tarot Editor (frontend + backend)
* Tarot Game (future)
* Simulation / Agents

These schemas define:

* API input/output shapes
* Form validation rules
* Domain invariants

Changes in this layer have **global impact** and require explicit intent.

---

### Axiom 3 — Boundaries Must Be Validated

* Raw DB rows are **never** returned directly
* All boundary crossings (DB → backend → frontend) must pass through Zod validation
* Backend validates incoming and outgoing data using shared schemas
* Frontend never trusts API payloads without schema validation

---

### Axiom 4 — Domains Are Separated by Intent

* **Editorial** ≠ **Gameplay** ≠ **Simulation**
* Rules for one domain do not automatically apply to another
* This document governs **editorial behavior only**

---

## 2. Windsurf Operating Mode

### Role Definition

Windsurf acts as a **senior engineer on Tarot2**, allowed to:

* refactor
* unify patterns
* improve UX
* reduce duplication

…but **never at the cost of breaking invariants**.

---

### Sources of Truth (Consult Before Editing)

1. CodeMaps (architecture, domain, UI patterns)
2. MCP Nuxt
3. MCP Nuxt UI
4. `SCHEMA POSTGRES.TXT`

If something contradicts these sources, **migrate toward the documented architecture**.

---

## 3. Structural Invariants (Non-Negotiable)

### 3.1 Editorial Data Flow

* CRUD operations must use `createCrudHandlers`
* Filters must go through `buildFilters`
* Responses must use `{ success, data, meta }`
* Pagination must use `createPaginatedResponse`

No ad-hoc CRUD pipelines are allowed.

---

### 3.2 Capabilities-Based Behavior

All conditional behavior must be derived from:

* `useEntityCapabilities`

No hard-coded role or status checks in components.

---

## 4. Framework Source of Truth — Nuxt & Nuxt UI

Nuxt and Nuxt UI APIs must be treated as authoritative.

### Rule
Before using or proposing:
- a Nuxt feature
- a Nuxt UI component (`U*`)
- a prop, slot or event

Windsurf must validate it against:
- the Nuxt MCP
- the Nuxt UI MCP

### Invariants
- Do not invent or guess undocumented APIs
- Do not rely on deprecated syntax
- Prefer documented patterns over assumptions

### Note
This rule ensures correctness and forward compatibility.
It does not mandate the use of specific components when a custom solution is more appropriate.

---

### 4.1 Tables & Listings

#### Objective

Provide consistent, accessible, and predictable entity listings.

#### Invariants

* Sorting, filtering and pagination are unified
* Bulk actions are handled centrally
* Capabilities control column visibility

#### Current Reference Implementation (Non-Binding)

* `CommonDataTable.vue`
* `ManageTableBridge.vue`
* `AdminTableBridge.vue`

#### Forbidden

* Ad-hoc `<table>` usage
* Entity-specific table logic duplication

---

### 4.2 Previews

#### Objective

Allow **non-blocking inspection** of entity data without disrupting the editing flow.

#### Invariants

* Previews must be:

  * lazy-loaded
  * read-only
  * non-destructive
* Status and tags must always be visible
* Preview logic must be reusable

#### Current Reference Implementation (Non-Binding)

* `EntityInspectorDrawer.vue`
* `useEntityPreviewFetch`

#### Forbidden

* Blocking preview modals
* Duplicated preview logic per entity

---

### 4.3 Forms & Editing

#### Objective

Ensure all editing flows are **validated, accessible and consistent**.

#### Invariants

* All fields must be validated via Zod schemas
* Form logic must not be duplicated ad-hoc
* Safe cancel / submit behavior is mandatory

#### Current Reference Implementation (Non-Binding)

* `FormModal.vue`
* Unified presets (`useEntityFormPreset`)

#### Migration Guidance

Legacy forms (e.g. `RoleForm.vue`, snapshot modals) should converge toward the current system or its future replacement.

#### Forbidden

* Forms without schema validation
* One-off entity-specific form logic

---

## 5. Backend Rules — Stability First

### 5.1 Critical Zones (Change With Extreme Care)

* CRUD core (`createCrudHandlers.ts`)
* Editorial pipelines (`content_versions`, `revisions`, `feedback`)
* Auth & security middleware

Changes here require **explicit justification**.

---

### 5.2 Allowed Improvements

* Extract duplicated logic
* Normalize filtering and tagging
* Improve logging
* Increase clarity without changing contracts

---

## 6. Database Rules

* Windsurf cannot modify the real DB schema
* Enums and domains are **sacred**
* Translation tables and effect schemas are highly sensitive

DB structure is treated as **immutable input**.

---

## 7. Migration Philosophy

If you touch a file using a legacy pattern:

* Propose or apply a migration **inside that file**
* Preserve functional parity
* Avoid large cross-cutting refactors

Incremental improvement > large rewrites.

---

## 8. Explicitly Allowed Creative Work

* UI cleanup and simplification
* Pattern unification
* Accessibility improvements
* DX improvements
* Safe refactors

Creativity is welcome **inside the invariants**.

---

## 9. Explicitly Out of Scope

Windsurf must not:

* design gameplay systems
* balance combat
* invent card mechanics
* modify simulation logic

These belong to **separate documents and phases**.

---

## 10. Final Rule

> **If a change improves clarity, safety and consistency without breaking invariants, it is allowed.**
> **If it introduces ambiguity at domain boundaries, it is not.**
