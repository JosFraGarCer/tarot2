# Tarot2 — TTRPG Effects System

> This document explains how effects work in Tarot2,
> the difference between legacy and structured effects,
> and what a correct effects system must guarantee.

---

## 1. Two Systems, One Purpose

Tarot2 has two parallel representations for effects:

| System | Storage | Purpose | Machine-Readable |
|---|---|---|---|
| **Legacy (Narrative)** | `effects` JSONB + `legacy_effects = true` | Human-readable Markdown descriptions per language | No |
| **Structured (Semantic)** | `card_effects` table + `effect_type` + `effect_target` catalogs | Relational, typed, translatable effect instances | Yes |

Both systems exist on the same entities: `base_card`, `world_card`, `base_skills`, `facet`.

The `legacy_effects` boolean on each entity determines which system is active:
- `true` → the `effects` JSONB field is authoritative (narrative mode)
- `false` → the `card_effects` rows are authoritative (structured mode)

### Why Two Systems?

This is intentional, not technical debt:

1. **Rapid prototyping**: Game designers can write natural-language effects before formalizing them.
2. **Narrative-first design**: Some effects are better expressed as prose ("The wielder feels a chill" is flavor, not mechanics).
3. **Incremental migration**: Existing content can be migrated from legacy to structured without breaking the editorial workflow.
4. **Dual audiences**: Players read narrative text; the rules engine reads structured data.

### The Boundary Problem

The dual system creates a critical question: **when must an effect be structured?**

Currently, this is not formalized. A card can be published with `legacy_effects = true` and purely narrative effects, even if those effects have clear mechanical implications ("deals 2d8 fire damage"). This means:

- The rules engine cannot process the card.
- Balance tools cannot analyze the card.
- Agents cannot validate the card's mechanical correctness.

**Rule that should exist**: Any effect that modifies a game-mechanical value (damage, HP, armor, conditions, modifiers) MUST have a structured `card_effects` representation. Legacy effects should be reserved for pure flavor or for cards in early design stages (draft/review status only).

---

## 2. Structured Effects Architecture

### 2.1 Effect Type Catalog (`effect_type`)

Defines **what kind of effect** exists in the system.

| Field | Purpose | Example Values |
|---|---|---|
| `code` | Unique identifier | `bonus.flat`, `damage.fire`, `heal.basic`, `condition.stun` |
| `category` | Functional classification | `modifier`, `condition`, `trigger`, `heal`, `damage` |
| `operator` | How the value is applied | `add`, `multiply`, `replace`, `set`, `roll`, `scale` |
| `default_duration` | How long the effect lasts by default | `instant`, `turn`, `combat`, `session`, `permanent` |
| `value_type` | What kind of value is expected | `flat`, `percent`, `dice`, `derived` |
| `template_text` | Rendering template | `+{value} to {target}` |
| `metadata` | JSONB for additional behavior | Triggers, conditions, special rules |
| `status` | Editorial status | Uses `card_status` enum |
| `is_active` | Availability toggle | |

**Translations** (`effect_type_translations`): `name`, `template_text`, `description` per language.

### 2.2 Effect Target Catalog (`effect_target`)

Defines **what an effect applies to**.

| Field | Purpose | Example Values |
|---|---|---|
| `code` | Unique identifier | `attack.melee`, `damage.fire`, `resource.health`, `defense.armor` |
| `target_scope` | Default scope | `self`, `ally`, `enemy`, `area`, `global` |
| `tag` | Semantic grouping | `combat`, `elemental`, `resource` |
| `metadata` | JSONB for parameters | Range, element, linked facet |
| `status` | Editorial status | Uses `card_status` enum |
| `validation_state` | Visual validation hint | `valid`, `warning`, `error` |

**Translations** (`effect_target_translations`): `name`, `description` per language.

### 2.3 Effect Instances (`card_effects`)

The actual effects applied to entities. Each row is one effect on one entity.

| Field | Purpose |
|---|---|
| `entity_type` + `entity_id` | Polymorphic reference to the owning entity |
| `effect_type_id` | FK to `effect_type` — what kind of effect |
| `effect_target_id` | FK to `effect_target` — what it applies to |
| `value` | Numeric value (constrained to -9999..9999) |
| `formula` | Expression for derived values (e.g., `half_of_parent_damage`) |
| `mode` | Application mode (free-text, e.g., `on_hit`, `on_cast`, `passive`) |
| `duration` | Override of `effect_type.default_duration` |
| `condition` | Trigger condition (free-text, e.g., `target_below_50_hp`) |
| `scope` | Who is affected: `self`, `ally`, `enemy`, `area`, `global` |
| `parent_id` | FK to another `card_effects` row — enables hierarchical/compound effects |
| `effect_group` | Semantic label grouping related effects (e.g., `vampiric_attack`) |
| `ref_type` + `ref_id` | Polymorphic reference to another entity (for cross-entity effects) |
| `is_stackable` | Whether this effect can stack |
| `max_stack` | Maximum stack count (only valid if `is_stackable = true`) |
| `stack_group` | Which effects compete for the same stack slot |
| `metadata` | JSONB for additional data |
| `validation_state` | Visual validation hint: `valid`, `warning`, `error` |
| `created_by` + `created_at` | Authorship tracking |

### 2.4 Compound Effects

The `parent_id` field enables hierarchical effects:

```
vampiric_attack (parent)
  ├── damage.fire → enemy (value: 2d8)
  └── heal.basic → self (formula: half_of_parent_damage)
```

This is powerful but introduces complexity:
- Child effects depend on parent resolution.
- Deleting a parent cascades to children (FK constraint).
- The `effect_group` label provides semantic grouping independent of hierarchy.

---

## 3. What the Current System Can Express

| Concept | Expressible? | How |
|---|---|---|
| Flat bonus (+2 to attack) | Yes | `effect_type.operator = 'add'`, `value = 2` |
| Percentage modifier (+10% damage) | Yes | `value_type = 'percent'`, `operator = 'multiply'` |
| Dice roll (2d8 fire damage) | Partially | `value_type = 'dice'` exists but no dice parser |
| Conditional effect (if target < 50% HP) | Partially | `condition` field exists but is free-text |
| Duration (lasts 3 turns) | Partially | `duration` field exists but is free-text |
| Area effect (all enemies in 10m) | Partially | `scope = 'area'` but no range/radius model |
| Stacking (max 3 stacks of poison) | Yes | `is_stackable`, `max_stack`, `stack_group` |
| Compound effect (damage + heal) | Yes | `parent_id` hierarchy |
| Cross-entity reference (grants skill X) | Partially | `ref_type` + `ref_id` but no formal semantics |
| Passive aura (allies gain +1 armor) | Partially | `scope = 'ally'`, `mode = 'passive'` but no aura resolution |

---

## 4. What a Correct Effects System Must Guarantee

### 4.1 Referential Integrity

- Every `effect_type_id` must point to an **active, published** effect type.
- Every `effect_target_id` must point to an **active, published** effect target.
- Every `parent_id` must point to an effect on the **same entity**.
- Every `ref_type` + `ref_id` must point to an **existing, non-archived** entity.

**Current state**: FK constraints exist but do not check `status` or `is_active`. A card can reference a draft or inactive effect type.

### 4.2 Formula Validity

- Every `formula` must be parseable by the rules engine.
- Variable references in formulas must resolve to known values.
- Circular references (A depends on B depends on A) must be detected and rejected.

**Current state**: `formula` is a free-text field with no validation. The string `half_of_parent_damage` has no parser.

### 4.3 Scope Consistency

- An effect with `scope = 'self'` should not have `effect_target` with `target_scope = 'enemy'`.
- An effect with `scope = 'area'` should define a range or radius (currently not modeled).

**Current state**: No cross-validation between effect scope and target scope.

### 4.4 Stacking Correctness

- If `is_stackable = false`, `max_stack` must be null (enforced by DB constraint).
- Effects in the same `stack_group` should have compatible types and targets.
- Stack overflow behavior is undefined (what happens at max_stack?).

**Current state**: The DB constraint prevents `max_stack` without `is_stackable`, but stack group compatibility is not validated.

### 4.5 Hierarchy Consistency

- Child effects must belong to the same entity as their parent.
- Circular parent references must be impossible (currently prevented by FK to same table, but not by application logic).
- Orphaned children after parent deletion are handled by CASCADE, which is correct.

**Current state**: Mostly correct via DB constraints. No application-level validation of same-entity requirement.

### 4.6 Completeness

- A structured effect should have at minimum: `effect_type_id`, `entity_type`, `entity_id`.
- An effect with `value_type = 'dice'` should have a parseable dice expression in `value` or `formula`.
- An effect with `duration != 'instant'` should have a defined expiration mechanism.

**Current state**: No completeness validation beyond DB NOT NULL constraints.

---

## 5. Legacy Effects: What They Are and What They Are Not

### What They Are

- **Human-readable descriptions** of what a card does.
- **Markdown-formatted** text, organized by language.
- **Flavor and rules text** combined in natural language.

### What They Are Not

- **Machine-readable rules**. No parser can reliably extract mechanics from "Deals **2d8 fire damage** to an *enemy* within 10m."
- **Validated data**. There is no schema for the content of legacy effects beyond "it's a JSON object or array."
- **Authoritative for the rules engine**. If `legacy_effects = true`, the rules engine has no data to work with.

### Migration Path

The intended migration path is:

1. Card starts in **legacy mode** (rapid prototyping, narrative design).
2. Game designer formalizes effects into **structured mode** (adds `card_effects` rows).
3. Card switches to `legacy_effects = false`.
4. Legacy `effects` JSONB is retained as flavor text / fallback but is no longer authoritative.

**What is missing**: There is no tooling or validation to ensure that structured effects match the intent of legacy effects. This is a manual review step that should be part of the editorial workflow.

---

## 6. Effect System Gaps (Prioritized)

### Critical (blocks rules engine)

1. **No formula parser**: `formula` field is free-text with no evaluation rules.
2. **No dice expression model**: `value_type = 'dice'` exists but no dice grammar (e.g., `2d8+4`).
3. **No condition catalog**: `condition` field is free-text with no formal condition definitions.
4. **No duration tick model**: `duration` is a string with no phase/turn/round resolution.

### Important (blocks balance and validation)

5. **No cross-validation**: Effect scope vs target scope, effect type vs value type.
6. **No active-status check on references**: Effects can reference draft/inactive types and targets.
7. **No completeness validation**: Effects can be saved with missing required fields.
8. **No effect cost model**: Effects have power but no cost — balance cannot be computed.

### Desirable (improves design workflow)

9. **No effect templates**: Common effect patterns (e.g., "standard damage spell") cannot be reused.
10. **No effect diffing**: When effects change, there is no structured diff (only full snapshot in revisions).
11. **No effect simulation**: Cannot preview "what would happen if this card is played."

---

## 7. Relationship to Editorial Workflow

Effects currently participate in the editorial workflow only through the `hasEffectsDefined` content guard:

- If the entity's table is in `TABLES_WITH_EFFECTS` (base_card, world_card, facet, base_skills):
  - Check if `card_effects` rows exist for this entity, OR
  - Check if `legacy_effects = true` and `effects` JSONB is non-empty.

This is a **presence check**, not a **correctness check**. A card with a single malformed effect passes this guard.

### What Should Change

The editorial workflow should be **domain-aware** for effects:

| Guard | Current | Should Be |
|---|---|---|
| Has effects | Presence check | Presence + completeness check |
| Effects reference valid types | Not checked | Must reference active, published types |
| Effects reference valid targets | Not checked | Must reference active, published targets |
| Formulas are parseable | Not checked | Must pass formula validation |
| Legacy effects have structured equivalent | Not checked | Required for status ≥ approved |

See `editorial-rules-for-game-design.md` for the full editorial implications.
