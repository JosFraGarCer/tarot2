# Tarot2 — TTRPG Domain Overview

> This document describes what kind of TTRPG system Tarot2 is becoming,
> what design philosophy it embodies, and what vocabulary it uses.
> It is intended to guide developers, game designers, and future agents.

---

## 1. What Kind of System Is Tarot2?

Tarot2 is implicitly becoming a **hybrid narrative-mechanical TTRPG card system**.

It is not purely rules-light (it has structured effects, operators, stacking, formulas).
It is not purely crunchy (it has narrative Markdown effects, no explicit stat blocks, no action economy).

The current data model reveals a system that:

- **Organizes game content as cards** — not as character sheets, monster stat blocks, or encounter tables.
- **Uses Arcana → Facet → Skill hierarchies** — suggesting a domain/school/ability taxonomy similar to magic schools or skill trees.
- **Supports two parallel effect representations** — structured (mechanical) and narrative (legacy), indicating a design that values both machine-readable rules and human-readable flavor.
- **Allows world-level overrides** — `world_card` can override or extend `base_card`, meaning the base system is designed to be reskinned or rebalanced per setting.

### Design Tension

The system sits at a crossroads:

| Direction | Evidence For | Evidence Against |
|---|---|---|
| **Narrative-first** | Legacy effects in Markdown, no stat model, no dice schema | Structured effects with operators, stacking, formulas |
| **Mechanical-first** | `card_effects` with `value`, `operator`, `duration`, `scope`, `condition` | No combat resolution, no action economy, no HP/armor model |
| **Hybrid** | Both systems coexist, `legacy_effects` toggle per entity | No formal contract for when to use which |

**Assessment**: Tarot2 is a hybrid system that currently leans narrative because the mechanical layer is defined but not yet connected to a resolution engine. The structured effects system is a *vocabulary* for mechanics, not yet a *grammar* for resolution.

---

## 2. Core Vocabulary

### Entity Hierarchy

```
World
  └── World Card (override of Base Card, world-specific)

Arcana (school / domain / power source)
  └── Facet (aspect / sub-domain)
       └── Base Skill (ability tied to a facet)

Base Card Type (category: spell, item, creature, etc.)
  └── Base Card (generic card in the system)
       └── World Card (world-specific variant)
```

### Key Terms

- **Base Card**: A generic game card that exists independently of any world. Has a type, family, effects, and editorial status. This is the canonical definition of a game element.
- **World Card**: A world-specific variant of a base card. Can override effects, text, or behavior. Linked to a `world` and optionally to a `base_card` via `base_card_id`. The `is_override` flag indicates whether it replaces or extends the base.
- **Arcana**: A top-level classification (school, domain, element). Organizes facets.
- **Facet**: A sub-domain within an arcana. Organizes skills.
- **Base Skill**: An ability or technique tied to a facet. Has its own effects.
- **Base Card Type**: A categorical classifier for cards (e.g., "spell", "item", "trap", "creature"). Determines what kind of game element a card represents.
- **Effect**: A mechanical or narrative modification that a card, skill, or facet applies. Can be structured (`card_effects`) or narrative (`effects` JSONB).
- **Effect Type**: A catalog entry defining what kind of effect exists (damage, heal, modifier, condition, trigger). Includes operator, duration, value type, and template.
- **Effect Target**: A catalog entry defining what an effect applies to (melee attack, fire damage, health, armor). Includes scope and semantic tag.
- **Tag**: A semantic label applied to any entity for classification, filtering, and grouping. Tags have categories, translations, and hierarchies (`parent_id`).

### Editorial Terms

- **Status**: Every game entity has an editorial status (`draft` → `published`). This controls visibility and validity.
- **Content Version**: A global release milestone (semver). Entities can be pinned to a version.
- **Content Revision**: A per-entity snapshot of changes, used for rollback and audit.

---

## 3. Design Philosophy

### 3.1 Explicit Over Implicit

The system favors explicit, declared structures over convention:

- Effects are declared, not inferred from text.
- Transitions are enforced by a state machine, not by UI hints.
- Permissions are checked per-transition, not per-role.
- Schemas are shared between frontend and backend via Zod.

### 3.2 Editorial Integrity Over Speed

The editorial workflow prioritizes correctness:

- Status transitions are guarded by content checks (has translation, has effects).
- Audit logs track every transition.
- Revisions are auto-created on status changes.
- Batch operations cannot bypass the editorial state machine.

### 3.3 Base + Override Architecture

The `base_card` → `world_card` pattern implies a **template + specialization** model:

- Base cards define the canonical version of a game element.
- World cards can override or extend for a specific setting.
- This is analogous to D&D's "base rules + setting-specific variants" or MTG's "core set + expansion" model.

### 3.4 Dual Representation

The legacy/structured effects duality is intentional:

- **Legacy mode** allows rapid prototyping and narrative-first design.
- **Structured mode** enables machine-readable effects for rules engines, balance tools, and agents.
- The `legacy_effects` boolean is a per-entity toggle, not a global setting.

This is a strength, not a debt — **as long as the boundary is formalized** (see `ttrpg-effects-system.md`).

---

## 4. What Is Currently Well-Defined

- **Entity taxonomy**: Arcana → Facet → Skill, Card Type → Base Card → World Card.
- **Effect catalog**: `effect_type` and `effect_target` with translations, operators, durations.
- **Effect instances**: `card_effects` with value, formula, scope, condition, stacking, hierarchy.
- **Editorial workflow**: Full state machine with permission-based guards.
- **Internationalization**: All entities and effects are translatable.
- **Versioning**: Content versions (global releases) and content revisions (per-entity snapshots).
- **Tagging**: Semantic tags with categories, hierarchies, and entity links.

---

## 5. What Is Currently Undefined or Underspecified

- **Stat model**: No explicit HP, armor, attributes, or resource definitions.
- **Action economy**: No turns, actions, reactions, or initiative.
- **Combat resolution**: No dice system, no attack/defense resolution, no damage calculation.
- **Targeting rules**: `scope` exists (self, ally, enemy, area, global) but has no formal targeting resolution.
- **Duration and timing**: `duration` exists as a string (instant, turn, combat, session, permanent) but has no tick/phase model.
- **Effect resolution order**: No priority, no stack resolution, no conflict rules.
- **Balance framework**: No cost model, no power budget, no rarity/tier system.
- **Condition system**: `condition` exists as a varchar but has no formal condition catalog or state machine.
- **Formula engine**: `formula` field exists but has no parser, no evaluation rules, no variable bindings.

These gaps are analyzed in detail in `ttrpg-combat-and-resolution.md`.

---

## 6. Relationship to Other Documents

| Document | Focus |
|---|---|
| `ttrpg-card-model.md` | What a card is mechanically and what makes it valid |
| `ttrpg-effects-system.md` | How effects work, legacy vs structured, correctness guarantees |
| `ttrpg-combat-and-resolution.md` | What's missing for combat and how the schema constrains it |
| `editorial-rules-for-game-design.md` | What editors must check beyond schema validity |
