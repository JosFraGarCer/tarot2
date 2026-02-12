# Tarot2 — TTRPG Card Model

> This document defines what a "card" represents mechanically in Tarot2,
> how base cards relate to world cards and effects,
> and what information must exist for a card to be mechanically valid.

---

## 1. What Is a Card?

In Tarot2, a **card** is the fundamental unit of game content. It is not a character sheet, a monster stat block, or a spell slot — it is a **self-contained game element** that declares:

- **What it is** (type, family, identity)
- **What it does** (effects — mechanical and/or narrative)
- **Where it belongs** (arcana/facet taxonomy, world context)
- **What state it's in** (editorial status, version)

A card is closer to a Magic: The Gathering card or a Gloomhaven ability card than to a D&D spell entry. It is a **discrete, portable, composable unit of game design**.

---

## 2. Card Taxonomy

### 2.1 Base Card

The canonical, world-independent definition of a game element.

| Field | Purpose |
|---|---|
| `code` | Unique machine identifier (e.g., `fire_strike`) |
| `card_type_id` | FK to `base_card_type` — what kind of card (spell, item, creature, trap, etc.) |
| `card_family` | Free-text grouping within a type (e.g., "elemental", "divine", "martial") |
| `status` | Editorial status (`draft` → `published`) |
| `is_active` | Soft-delete / availability toggle |
| `legacy_effects` | Boolean: use narrative effects or structured effects |
| `effects` | JSONB: narrative effects (Markdown per language) |
| `metadata` | JSONB: arbitrary additional properties |
| `content_version_id` | FK to global content version (release pinning) |
| `image` | Visual representation |

**Translations** (`base_card_translations`):
- `name` — display name per language
- `short_text` — brief description / flavor text
- `description` — full rules text / lore

**Structured effects** (`card_effects`):
- Linked via `entity_type = 'base_card'` and `entity_id = base_card.id`
- Multiple effects per card, with hierarchy (`parent_id`)

### 2.2 World Card

A world-specific variant of a base card, or a world-original card.

| Field | Purpose |
|---|---|
| `world_id` | FK to `world` — which setting this belongs to |
| `base_card_id` | FK to `base_card` — nullable. If set, this is a variant. If null, this is world-original. |
| `is_override` | Boolean: does this replace the base card's behavior in this world? |
| `code` | Unique within the world (`world_id + code` is unique) |
| `legacy_effects`, `effects` | Same dual system as base card |
| `status`, `is_active`, `metadata`, `content_version_id` | Same editorial fields |

**Key design implications**:

- A world card with `base_card_id` set and `is_override = true` **replaces** the base card in that world.
- A world card with `base_card_id` set and `is_override = false` **extends** or **supplements** the base card.
- A world card with `base_card_id = null` is a **world-original** card with no base equivalent.
- Effects on a world card are **independent** from the base card's effects — there is no automatic inheritance or merging.

### 2.3 Base Card Type

A categorical classifier for cards.

| Field | Purpose |
|---|---|
| `code` | Unique identifier (e.g., `spell`, `item`, `creature`, `trap`) |
| `sort` | Display ordering |
| `metadata` | JSONB: type-specific properties (e.g., default cost, slot requirements) |

**What it does NOT define**: Card types currently have no mechanical implications. A card of type "spell" behaves identically to a card of type "item" at the data level. The type is purely organizational.

**What it SHOULD define** (future): Card types should eventually carry mechanical constraints — e.g., "spells require a mana cost", "items have durability", "creatures have HP". This is a critical gap (see Section 5).

---

## 3. Card Identity and Relationships

### 3.1 Hierarchy

```
Base Card Type (spell, item, creature, ...)
  └── Base Card (fire_strike, healing_potion, ...)
       └── World Card (fire_strike in "Dark Realm", ...)

Arcana (Fire, Nature, Shadow, ...)
  └── Facet (Destruction, Protection, Illusion, ...)
       └── Base Skill (Fireball, Shield, Invisibility, ...)
```

Cards and skills are **separate entity types** that share the same effects system. A base card is not a skill, but both can have `card_effects`. The relationship between cards and skills is currently **implicit** — there is no FK from `base_card` to `base_skills` or vice versa.

### 3.2 Tags

Any entity can be tagged via `tag_links`. Tags provide:

- **Semantic classification** (e.g., "elemental", "healing", "crowd-control")
- **Filtering and search** (by category, by tag hierarchy)
- **Cross-entity grouping** (a tag can link cards, skills, facets, and arcana)

Tags are **editorial metadata**, not mechanical. They do not affect game behavior.

### 3.3 Effects Binding

Effects are bound to entities via polymorphic reference:

```
card_effects.entity_type = 'base_card' | 'world_card' | 'base_skills' | 'facet'
card_effects.entity_id = <entity PK>
```

This means:
- A base card can have N structured effects.
- A world card can have N structured effects (independent of its base card).
- A skill can have N structured effects.
- A facet can have N structured effects (typically passive/aura effects).

---

## 4. What Makes a Card Mechanically Valid?

Currently, the editorial workflow checks three content guards before allowing publication:

1. **`hasBaseContent`** — Always true (hardcoded). This should check that the card has a code, a type, and a family.
2. **`hasAtLeastOneTranslation`** — At least one translation row exists (name in at least one language).
3. **`hasEffectsDefined`** — Either structured effects exist in `card_effects`, OR legacy effects are enabled with non-empty `effects` JSONB.

### What Is Missing From "Mechanically Valid"

The current guards ensure **editorial completeness** but not **mechanical correctness**. A card can be published with:

- **Contradictory effects** (e.g., "deals 10 fire damage" + "heals target for 10 fire damage" on the same card)
- **Undefined references** (e.g., `effect_target_id` pointing to an inactive or draft target)
- **No cost or resource requirement** (a card with powerful effects but no balancing cost)
- **Incomplete formulas** (e.g., `formula = 'half_of_parent_damage'` with no parent effect)
- **Orphaned world cards** (a world card whose `base_card_id` points to a deleted or archived base card)
- **Type-inappropriate effects** (e.g., a "creature" card with no HP-related effects)

### Proposed Validity Levels

| Level | Name | What It Checks |
|---|---|---|
| 1 | **Schema Valid** | Zod schema passes, required fields present |
| 2 | **Editorially Complete** | Has translation, has effects, has status ≥ approved |
| 3 | **Mechanically Consistent** | Effects reference active types/targets, formulas are parseable, no contradictions |
| 4 | **Balance Reviewed** | Cost/power budget is within acceptable range, reviewed by game designer |
| 5 | **Publish Ready** | All of the above + version pinned + no open feedback |

Currently, only levels 1 and 2 are enforced. Levels 3–5 are the gap.

---

## 5. Critical Gaps in the Card Model

### 5.1 No Mechanical Meaning for Card Types

`base_card_type` is purely organizational. There is no way to say "all cards of type 'spell' must have a mana cost" or "all cards of type 'creature' must define HP". This means:

- Card types cannot enforce structural constraints.
- Balance review cannot be automated per type.
- The game engine cannot make assumptions based on type.

**Primitive needed**: A `type_constraints` or `type_schema` field on `base_card_type` that defines what fields/effects are required for cards of that type.

### 5.2 No Cost or Resource Model

No card has a cost. There is no mana, stamina, action points, or any other resource currency. This means:

- Balance is purely subjective.
- Deck-building constraints cannot be formalized.
- Power budgets cannot be computed.

**Primitive needed**: A cost model — either as a field on `base_card` or as a dedicated `card_costs` table with resource type + amount.

### 5.3 No Rarity or Tier System

There is no rarity, power tier, or level requirement on cards. This means:

- Progression cannot be formalized.
- Draft/sealed formats cannot be balanced.
- Encounter difficulty cannot be computed.

**Primitive needed**: A `tier` or `rarity` field on `base_card`, with a defined scale.

### 5.4 No Explicit Inheritance for World Cards

When a world card overrides a base card, the override is **total** — there is no mechanism to say "inherit all effects from the base card, but change the fire damage value from 2d8 to 3d6". Effects must be fully redeclared.

**Primitive needed**: An inheritance model — either "copy-on-write" (world card starts as a copy of base card effects) or "delta" (world card declares only the differences).

### 5.5 No Card Composition

Cards cannot reference other cards. There is no "this card summons creature X" or "this item grants the bearer card Y". The `ref_type` / `ref_id` fields on `card_effects` allow referencing other entities, but this is at the effect level, not the card level.

**Primitive needed**: A `card_references` or `card_components` table for card-to-card relationships (summons, grants, requires, counters).

---

## 6. Summary

| Aspect | Status |
|---|---|
| Card identity (code, type, family) | **Defined** |
| Card translations (name, text, description) | **Defined** |
| Card effects (structured + legacy) | **Defined** |
| Card editorial workflow | **Enforced** |
| Card versioning and revisions | **Enforced** |
| Card tagging | **Defined** |
| World-level overrides | **Partially defined** (no inheritance) |
| Card type constraints | **Missing** |
| Card cost / resource model | **Missing** |
| Card rarity / tier | **Missing** |
| Card-to-card references | **Missing** |
| Mechanical validity checks | **Missing** |
| Balance framework | **Missing** |
