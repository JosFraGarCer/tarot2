# Tarot2 — Combat and Resolution Analysis

> This document analyzes what Tarot2 needs for a usable combat and resolution system,
> what is missing today, and what constraints the current schema imposes.
> It does NOT design the system — it defines the problem space.

---

## 1. Current State: No Resolution System Exists

Tarot2 currently has:

- A **vocabulary** for effects (types, targets, operators, values, durations, conditions, scopes).
- A **storage model** for effect instances (card_effects with hierarchy, stacking, formulas).
- An **editorial pipeline** for managing game content lifecycle.

Tarot2 currently does **not** have:

- A way to **resolve** what happens when a card is played.
- A way to **calculate** damage, healing, or modifier application.
- A way to **sequence** actions in time (turns, phases, initiative).
- A way to **determine** success or failure (dice, probability, deterministic comparison).
- A way to **track** game state (HP, conditions, active effects, resources).

The effects system is a **declaration language** — it says what effects exist. It is not an **execution engine** — it cannot say what happens when those effects are applied.

---

## 2. Required Domain Primitives

The following primitives are required for any combat/resolution system. Each is analyzed for what the current schema provides and what is missing.

### 2.1 Stat Model

**What it is**: The set of numeric attributes that define a game entity's capabilities and state.

**What the schema provides**: Nothing explicit. There is no `stats` table, no `attributes` table, no HP/armor/mana fields on any entity. The `metadata` JSONB field on cards could theoretically hold stats, but this is unstructured and unvalidated.

**What is needed**:
- A canonical list of stats (HP, armor, attack, defense, speed, mana, etc.)
- Whether stats are per-card, per-character, per-creature, or per-encounter
- Whether stats are fixed or derived (base + modifiers)
- How effects modify stats (the `operator` field on `effect_type` implies this, but there is no stat to operate on)

**Schema constraint**: The `effect_target` table could serve as the stat registry if its codes are formalized (e.g., `resource.health`, `stat.attack`, `stat.defense`). But currently, target codes are free-text with no enforced vocabulary.

### 2.2 Action Economy

**What it is**: The rules governing what a participant can do on their turn — how many actions, what types, and in what order.

**What the schema provides**: Nothing. There is no concept of turns, actions, reactions, bonus actions, or free actions. The `mode` field on `card_effects` (e.g., `on_hit`, `on_cast`, `passive`) hints at timing but is free-text.

**What is needed**:
- Turn structure (phases: start, main, combat, end)
- Action types (standard action, reaction, free action, passive)
- Action costs (does playing a card consume an action?)
- Initiative or turn order determination

**Schema constraint**: The `mode` field could be formalized into an enum of action phases. The `duration` field already has `turn` as a value, implying turns exist conceptually.

### 2.3 Targeting Rules

**What it is**: How effects select their targets — who or what is affected.

**What the schema provides**: Partial.
- `card_effects.scope`: `self`, `ally`, `enemy`, `area`, `global`
- `effect_target.target_scope`: same values
- No range, no line-of-sight, no target count, no target selection rules

**What is needed**:
- Range model (melee, short, medium, long, or numeric distance)
- Target count (single, multiple, all-in-area)
- Target selection (random, chosen, nearest, weakest)
- Area shapes (cone, line, radius, single)
- Line-of-sight / cover rules (if applicable)

**Schema constraint**: The `metadata` JSONB on `effect_target` could hold range/area data, but this is unstructured. A `range` or `area` field on `card_effects` would be more appropriate.

### 2.4 Duration and Timing Model

**What it is**: How long effects last and when they tick, expire, or trigger.

**What the schema provides**: Partial.
- `effect_type.default_duration`: `instant`, `turn`, `combat`, `session`, `permanent`
- `card_effects.duration`: override of the default (free-text)
- No tick model, no phase triggers, no expiration tracking

**What is needed**:
- Duration units (instant, N turns, until end of combat, until dispelled, permanent)
- Tick timing (start of turn, end of turn, on damage taken, on action)
- Expiration rules (automatic vs. manual removal)
- Concentration / maintenance (does the effect require ongoing cost?)

**Schema constraint**: The `duration` field is a varchar, not a structured type. It cannot express "3 turns" vs "until end of combat" in a machine-readable way without a parser.

### 2.5 Effect Resolution Order

**What it is**: When multiple effects apply simultaneously, which one resolves first?

**What the schema provides**: Nothing explicit.
- `card_effects` has no `priority` or `order` field.
- `effect_group` provides semantic grouping but not resolution ordering.
- `parent_id` implies parent-before-child, but this is hierarchy, not priority.

**What is needed**:
- Resolution phases (damage → modifiers → conditions → triggers)
- Priority within a phase (higher priority resolves first)
- Conflict resolution (if two effects contradict, which wins?)
- Replacement vs. stacking rules (already partially modeled via `is_stackable` / `stack_group`)

**Schema constraint**: Adding a `priority` integer to `card_effects` would be straightforward. The `stack_group` mechanism already handles some conflict resolution.

### 2.6 Randomness Model

**What it is**: How chance is introduced — dice, probability tables, deterministic modifiers.

**What the schema provides**: Hints only.
- `effect_type.value_type` includes `dice` as a possible value.
- `effect_type.operator` includes `roll` as a possible operator.
- No dice grammar, no probability model, no random seed tracking.

**What is needed**:
- Dice notation parser (e.g., `2d8+4`, `1d20`, `4d6kh3`)
- Probability distribution model (for balance analysis)
- Deterministic vs. random resolution choice (some systems are diceless)
- Critical hit / fumble rules (if dice-based)

**Schema constraint**: The `value` field is `numeric` — it cannot hold `2d8`. Dice expressions would need to go in `formula` or a dedicated `dice_expression` field.

### 2.7 Condition System

**What it is**: Named states that modify behavior — stunned, poisoned, burning, invisible, etc.

**What the schema provides**: Partial.
- `effect_type.category` includes `condition` as a value.
- `card_effects.condition` is a free-text field for trigger conditions.
- No condition catalog, no condition state machine, no condition interactions.

**What is needed**:
- A formal condition catalog (like `effect_type` but for states)
- Condition application rules (how conditions are applied and removed)
- Condition interactions (does "immune to fire" prevent "burning"?)
- Condition stacking (can you be double-stunned?)

**Schema constraint**: The `effect_type` catalog with `category = 'condition'` could serve as the condition catalog. But `card_effects.condition` is overloaded — it means "trigger condition" (when does this effect activate), not "game condition" (what state does this apply). These are two different concepts sharing one field.

---

## 3. What the Current Schema Constrains

The existing schema makes certain design choices implicitly. These are not bugs — they are constraints that any future resolution system must respect or explicitly migrate away from.

### 3.1 Effects Are Per-Entity, Not Per-Encounter

`card_effects` are defined at design time, not at play time. There is no concept of "this card was played in encounter X and its effects are currently active on target Y." The schema models **card definitions**, not **game state**.

**Implication**: A separate runtime/game-state layer will be needed for actual play. The editor manages templates; the game engine manages instances.

### 3.2 Values Are Static, Not Dynamic

`card_effects.value` is a fixed numeric. It cannot express "damage equals the caster's attack stat" without using the `formula` field, which has no parser.

**Implication**: Any system that needs derived values must implement a formula engine. The schema supports this via the `formula` field, but the engine does not exist.

### 3.3 Scope Is Coarse

`scope` has five values: `self`, `ally`, `enemy`, `area`, `global`. There is no "the nearest enemy", "up to 3 allies", or "all creatures within 5m".

**Implication**: Fine-grained targeting will require either extending the scope vocabulary or adding targeting fields to `card_effects`.

### 3.4 Duration Is Unstructured

`duration` is a varchar. "3 turns", "until end of combat", and "permanent" are all strings with no machine-readable distinction.

**Implication**: Duration parsing or a structured duration model (type + count) will be needed.

### 3.5 No Game Clock

There is no concept of rounds, turns, phases, or time progression in the schema. Effects have durations but nothing to count them against.

**Implication**: The resolution system must introduce its own time model. The editor does not need to know about game time — it only needs to know that durations are valid.

---

## 4. Design Decisions That Must Be Made

Before implementing a resolution system, the following decisions must be made. These are **game design decisions**, not engineering decisions.

### 4.1 Deterministic vs. Probabilistic

Does the system use dice? If yes:
- What dice notation? (NdX, NdXkHY, exploding dice, etc.)
- What is the core resolution mechanic? (roll vs. target number, opposed rolls, dice pools)
- Are there critical successes/failures?

If no (deterministic):
- How is variance introduced? (card draw, resource management, positioning)
- How are ties resolved?

### 4.2 Symmetric vs. Asymmetric

Do all participants (players, NPCs, monsters) use the same rules?
- **Symmetric**: All use cards, all have the same stat model.
- **Asymmetric**: Players use cards, monsters use stat blocks, environment uses triggers.

The current schema supports symmetric design (all entities can have effects), but this is not enforced.

### 4.3 Real-Time vs. Turn-Based

Is combat turn-based or real-time?
- **Turn-based**: Requires initiative, turn order, action economy.
- **Real-time**: Requires timing, cooldowns, simultaneous resolution.

The `duration` values (`turn`, `combat`) imply turn-based design.

### 4.4 Card-Driven vs. Stat-Driven

Are outcomes determined primarily by cards played or by character stats?
- **Card-driven**: The card's effects are the primary determinant (like Gloomhaven).
- **Stat-driven**: Character stats modify card effects (like D&D with spell slots).
- **Hybrid**: Cards provide base effects, stats modify them.

The current schema supports card-driven design (effects are on cards, not on characters). A stat model would need to be added for stat-driven or hybrid approaches.

---

## 5. Minimum Viable Resolution

If the goal is to have a **minimum viable combat system** that the editor can validate, the following primitives are the absolute minimum:

| Primitive | Purpose | Schema Impact |
|---|---|---|
| **Stat registry** | Formalize `effect_target` codes as the canonical stat list | Data seeding, no schema change |
| **Dice grammar** | Parse `2d8+4` in `formula` or `value` | Application code only |
| **Duration enum** | Replace free-text `duration` with structured type + count | Schema migration or metadata convention |
| **Resolution phase order** | Define when effects resolve relative to each other | `priority` field on `card_effects` |
| **Condition catalog** | Subset of `effect_type` with `category = 'condition'` | Data seeding, no schema change |

Everything else (action economy, targeting, game state tracking) belongs to the **game engine**, not the **editor**. The editor's job is to ensure that cards are mechanically valid and internally consistent. The game engine's job is to resolve what happens when cards are played.

---

## 6. Summary

| Aspect | Current State | Needed For Resolution |
|---|---|---|
| Effect vocabulary | Defined | Sufficient |
| Effect storage | Defined | Sufficient |
| Stat model | Missing | Required |
| Action economy | Missing | Required for play, not for editing |
| Targeting | Partial (scope only) | Needs range/count/selection |
| Duration | Partial (free-text) | Needs structured model |
| Resolution order | Missing | Needs priority field |
| Randomness | Hinted (value_type=dice) | Needs dice parser |
| Conditions | Overloaded field | Needs separation of trigger vs. state |
| Game state | Not modeled | Required for play, not for editing |
| Formula engine | Field exists, no parser | Required for derived values |
