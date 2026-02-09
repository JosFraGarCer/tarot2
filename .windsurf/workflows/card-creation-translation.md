# 🃏 Tarot2 — Editorial Card Creation & Translation Workflow

---

auto_execution_mode: 0
description: Describe the canonical lifecycle for creating, editing and translating cards in the Tarot2 Editor
--------------------------------------------------------------------------------------------------------------

> **Purpose**: This workflow documents how **editorial cards** are created, edited, translated and published in Tarot2.
>
> It explains the **domain flow and invariants**, not a specific UI implementation.
> The UI may evolve, but the lifecycle described here must remain valid.

---

## 1. Scope

This workflow applies to:

* `base_card`
* `world_card`

It covers:

* initial creation
* translation handling
* editing and revisions
* publication readiness

It does **not** cover:

* gameplay effects
* runtime overrides
* balance or system rules

---

## 2. Core Principles

1. **Cards are editorial content**
   A card exists independently of any game session.

2. **Structure and language are separated**
   Non-translatable fields and translatable fields follow different lifecycles.

3. **Zod-first validation is mandatory**
   All card data is validated through shared Zod schemas.

4. **Translations are additive, not destructive**
   Adding or editing a translation must never erase others.

---

## 3. Entities Involved

* **Card entity** (`base_card` / `world_card`)

  * non-translatable fields
  * editorial status

* **Translation entities** (`*_translations`)

  * language-specific content

* **Revisions / Versions**

  * track editorial changes over time

---

## 4. Card Creation Flow (English-First Invariant)

### 4.1 Initial Creation (Mandatory English)

1. **English as Source**: All entities (`base_card`, `world_card`, `arcana`, etc.) MUST be created in English (`en`) first. This is the canonical source of truth for all subsequent localizations.
2. **Draft Baseline**: The initial creation establishes the non-translatable structure (code, type, IDs) and the primary English content.
3. **Implicit Fallback**: By forcing English-first creation, the system guarantees a baseline for the `buildTranslationSelect` and `translatableUpsert` logic to work with.

### 4.2 Translation as an Editorial Assistant Flow

1. **Contextual Translation**: Localization is NOT a bulk import, but an editorial action. When an editor switches to another language (e.g., `es`), the system provides the English values as fallbacks.
2. **Assisted Editing**: The editor sees the English text in the UI (via the fallback mechanism) and provides the translated version.
3. **Persistence**: Only when the editor explicitly saves the translation is the localized record created/updated. `translatableUpsert` manages this "lazy" localization without corrupting the base English record.

---

### 4.2 Validation Rules

* A card **must** have at least one translation to be previewable.
* Missing optional fields must not break preview or listing.
* Invalid translations must block save for that language only.

---

## 5. Translation & Fallback Flow

### 5.1 Fallback Principles

* **English is the universal fallback**: If a requested locale is missing, the system retrieves the English content.
* **Non-destructive assisted editing**: When an editor translates a card, `translatableUpsert` ensures that the base structure remains consistent while adding the new locale data.
* **Audit Fields**: Fields like `created_by` and `updated_by` in translation tables are placeholders for the future **Admin Surface**. They are not currently populated in the editorial flow.

---

### 5.2 Editing a Translation

* Editing is always locale-scoped.
* Saving a translation does not alter base card fields.
* Validation errors apply only to the active locale.

---

### 5.3 Fallback Behaviour

* If a requested locale is missing:

  * fallback locale may be displayed
  * missing content must be visually indicated
* Fallbacks must never be persisted as real translations.

---

## 6. Editing Existing Cards

### 6.1 Draft Cards

While in **draft** status:

* all base fields may be edited
* all translations may be edited or removed

---

### 6.2 Published Cards

Once published:

* base fields may be restricted
* edits may require creating a **new revision**
* translations may still be corrected (depending on policy)

Exact permissions depend on editorial rules but must be explicit.

---

## 7. Revision & Versioning

* Significant changes create a new revision.
* Revisions preserve:

  * previous base data
  * all translations
* Rollback restores both structure and translations.

Translations are versioned together with the card revision.

---

## 8. Publication Readiness

A card is considered ready for publication when:

* base schema is valid
* at least one valid translation exists
* required editorial fields are filled

Missing optional translations do not block publication.

---

## 9. Common Pitfalls (Avoid)

* **Breaking English-first**: Trying to create an entity in a language other than English without an existing English record.
* **Over-engineering CRUD types**: Forcing rigid TypeScript generics that ignore the dynamic nature of editorial fallbacks and multi-surface (Manage vs Admin) evolution.
* **Premature Audit Enforcement**: Expecting `created_by` / `updated_by` to be populated in translation tables before the Admin Surface is implemented.
* Assuming a translation exists for every locale
* Mixing translatable and non-translatable fields
* Overwriting translations when editing base fields
* Persisting fallback content as real translations
* Skipping Zod validation for translations

---

## 10. Relationship to Other Systems

* World assignment (`world_card`) uses the same lifecycle
* Gameplay systems consume **published cards only**
* Runtime overrides must never mutate editorial data

---

## Final Note

> This workflow documents **how the editor works**, not how it looks.
> If the UI changes, this lifecycle must still be respected.
