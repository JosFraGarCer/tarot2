# Tarot2 — Effect Validation Rules

> This document defines the first domain-aware validation layer for `card_effects`.
> It specifies what makes an effect structurally valid, incomplete, or invalid,
> and provides a deterministic algorithm for computing `validation_state`.
>
> This is NOT a combat system, resolution engine, or balance framework.
> It is a **structural correctness layer** for the editorial pipeline.

---

## 1. Definitions

| Term | Meaning |
|---|---|
| **Valid** | The effect is structurally complete, all references resolve, no forbidden states. Ready for review and publication. |
| **Warning** | The effect is usable but has potential issues that a reviewer should examine. Does not block `draft → review`. Blocks `approved → published`. |
| **Error** | The effect is structurally broken. Missing required data, dangling references, or forbidden field combinations. Blocks any forward editorial transition. |

These map directly to the existing `validation_state` column on `card_effects`:

```sql
validation_state varchar(20) DEFAULT 'valid' NOT NULL
-- Allowed values: 'valid', 'warning', 'error'
```

---

## 2. Input and Output

### Input

A single `card_effects` row, plus the resolved `effect_type` and `effect_target` rows it references (if any).

```
EffectRow {
  id, entity_type, entity_id,
  effect_type_id, effect_target_id,
  value, formula,
  mode, duration, condition, scope,
  parent_id, effect_group,
  ref_type, ref_id,
  is_stackable, max_stack, stack_group,
  metadata, validation_state
}

ResolvedType? {
  id, code, category, operator, value_type,
  default_duration, is_active, status
}

ResolvedTarget? {
  id, code, target_scope, is_active, status
}

ParentEffect? {
  id, entity_type, entity_id
}
```

### Output

```
ValidationResult {
  state: 'valid' | 'warning' | 'error'
  reasons: string[]   // human-readable, one per rule violation
  codes: string[]     // machine-readable rule codes (e.g., 'E_NO_TYPE')
}
```

The final `state` is the **worst** of all individual rule outcomes:
- Any `error` rule → `state = 'error'`
- No errors, any `warning` rule → `state = 'warning'`
- No errors, no warnings → `state = 'valid'`

---

## 3. Validation Rules

Rules are organized by severity. Each rule has:
- **Code**: Machine-readable identifier
- **Severity**: `error` or `warning`
- **Condition**: When the rule fires
- **Reason**: Human-readable explanation

### 3.1 Error Rules (Hard Failures)

These indicate structurally broken effects that cannot be resolved by the game engine.

---

#### E_NO_TYPE — Missing effect type

| | |
|---|---|
| **Severity** | error |
| **Condition** | `effect_type_id IS NULL` |
| **Reason** | "Effect has no type. Every effect must reference an effect_type." |

Every structured effect must declare what kind of effect it is. An effect without a type is meaningless to the rules engine.

---

#### E_NO_TARGET — Missing effect target

| | |
|---|---|
| **Severity** | error |
| **Condition** | `effect_target_id IS NULL` |
| **Reason** | "Effect has no target. Every effect must reference an effect_target." |

Every structured effect must declare what it applies to. An effect without a target cannot be resolved.

---

#### E_TYPE_INACTIVE — Effect type is inactive

| | |
|---|---|
| **Severity** | error |
| **Condition** | `ResolvedType.is_active = false` |
| **Reason** | "Effect references inactive effect_type '{code}'. Reactivate the type or choose a different one." |

An effect referencing a deactivated type is broken — the type was disabled for a reason.

---

#### E_TARGET_INACTIVE — Effect target is inactive

| | |
|---|---|
| **Severity** | error |
| **Condition** | `ResolvedTarget.is_active = false` |
| **Reason** | "Effect references inactive effect_target '{code}'. Reactivate the target or choose a different one." |

Same logic as E_TYPE_INACTIVE.

---

#### E_TYPE_DANGLING — Effect type does not exist

| | |
|---|---|
| **Severity** | error |
| **Condition** | `effect_type_id IS NOT NULL` AND no matching row in `effect_type` |
| **Reason** | "Effect references effect_type_id={id} which does not exist." |

The FK constraint with `ON DELETE SET NULL` means a deleted type sets the FK to null (caught by E_NO_TYPE). But if the FK is non-null and the row is missing, the DB constraint would prevent this. This rule exists as a defense-in-depth application-level check.

---

#### E_TARGET_DANGLING — Effect target does not exist

| | |
|---|---|
| **Severity** | error |
| **Condition** | `effect_target_id IS NOT NULL` AND no matching row in `effect_target` |
| **Reason** | "Effect references effect_target_id={id} which does not exist." |

Same defense-in-depth logic as E_TYPE_DANGLING.

---

#### E_NO_VALUE — Missing value for non-derived effect

| | |
|---|---|
| **Severity** | error |
| **Condition** | `ResolvedType.value_type` IN (`flat`, `percent`, `dice`) AND `value IS NULL` AND `formula IS NULL` |
| **Reason** | "Effect type '{code}' expects a value (value_type='{value_type}') but neither value nor formula is provided." |

If the effect type declares it needs a numeric value (flat, percent, or dice), the effect instance must provide one — either as a literal `value` or as a `formula`.

Exception: `value_type = 'derived'` effects are allowed to have null value (they compute it from context).

---

#### E_PARENT_CROSS_ENTITY — Parent effect belongs to a different entity

| | |
|---|---|
| **Severity** | error |
| **Condition** | `parent_id IS NOT NULL` AND `ParentEffect.entity_type != EffectRow.entity_type` OR `ParentEffect.entity_id != EffectRow.entity_id` |
| **Reason** | "Child effect belongs to {entity_type}:{entity_id} but parent effect belongs to {parent_entity_type}:{parent_entity_id}. Parent and child must be on the same entity." |

Compound effects (parent/child) must belong to the same entity. A child effect on card A cannot have a parent on card B.

---

#### E_PARENT_DANGLING — Parent effect does not exist

| | |
|---|---|
| **Severity** | error |
| **Condition** | `parent_id IS NOT NULL` AND no matching row in `card_effects` |
| **Reason** | "Effect references parent_id={id} which does not exist." |

The FK with `ON DELETE CASCADE` should prevent this, but application-level defense-in-depth.

---

#### E_REF_INCOMPLETE — Partial cross-reference

| | |
|---|---|
| **Severity** | error |
| **Condition** | (`ref_type IS NOT NULL` AND `ref_id IS NULL`) OR (`ref_type IS NULL` AND `ref_id IS NOT NULL`) |
| **Reason** | "Cross-reference is incomplete: ref_type and ref_id must both be set or both be null." |

A cross-reference must be complete. Having a type without an ID (or vice versa) is always a data error.

---

#### E_STACK_WITHOUT_GROUP — Stackable effect without stack group

| | |
|---|---|
| **Severity** | error |
| **Condition** | `is_stackable = true` AND `stack_group IS NULL` |
| **Reason** | "Effect is stackable but has no stack_group. Stackable effects must declare which group they belong to." |

The stacking system needs a group identifier to determine which effects compete for the same stack slot. A stackable effect without a group is ambiguous.

---

#### E_SCOPE_INVALID — Scope value not recognized

| | |
|---|---|
| **Severity** | error |
| **Condition** | `scope NOT IN ('self', 'ally', 'enemy', 'area', 'global')` |
| **Reason** | "Scope '{scope}' is not a recognized value. Must be one of: self, ally, enemy, area, global." |

The scope column has a default of `'self'` but no CHECK constraint. This rule enforces the vocabulary at the application level.

---

### 3.2 Warning Rules (Soft Failures)

These indicate potential issues that deserve reviewer attention but do not make the effect structurally broken.

---

#### W_TYPE_DRAFT — Effect type is not approved/published

| | |
|---|---|
| **Severity** | warning |
| **Condition** | `ResolvedType.status NOT IN ('approved', 'published')` |
| **Reason** | "Effect references effect_type '{code}' which is in '{status}' status. Consider using an approved type." |

An effect referencing a draft or review-stage type is risky — the type definition may change.

---

#### W_TARGET_DRAFT — Effect target is not approved/published

| | |
|---|---|
| **Severity** | warning |
| **Condition** | `ResolvedTarget.status NOT IN ('approved', 'published')` |
| **Reason** | "Effect references effect_target '{code}' which is in '{status}' status. Consider using an approved target." |

Same logic as W_TYPE_DRAFT.

---

#### W_SCOPE_MISMATCH — Effect scope contradicts target scope

| | |
|---|---|
| **Severity** | warning |
| **Condition** | `ResolvedTarget.target_scope IS NOT NULL` AND `scope != ResolvedTarget.target_scope` AND neither is `'global'` or `'area'` |
| **Reason** | "Effect scope is '{scope}' but target '{code}' has default scope '{target_scope}'. Verify this is intentional." |

If an effect targets `damage.fire` (which defaults to `enemy` scope) but the effect's scope is `self`, this is likely a mistake. However, it's a warning, not an error — there are legitimate reasons to override (e.g., self-inflicted damage).

The exception for `global` and `area` is because these scopes are inherently flexible.

---

#### W_VALUE_AND_FORMULA — Both value and formula provided

| | |
|---|---|
| **Severity** | warning |
| **Condition** | `value IS NOT NULL` AND `formula IS NOT NULL` |
| **Reason** | "Effect has both a literal value ({value}) and a formula ('{formula}'). Which one is authoritative? Prefer one or the other." |

Having both is ambiguous. The rules engine must decide which takes precedence. This should be resolved by the designer.

---

#### W_DURATION_ON_INSTANT — Duration set on instant effect

| | |
|---|---|
| **Severity** | warning |
| **Condition** | `ResolvedType.default_duration = 'instant'` AND `duration IS NOT NULL` AND `duration != 'instant'` |
| **Reason** | "Effect type '{code}' defaults to instant, but effect overrides duration to '{duration}'. Verify this is intentional." |

An instant effect with a non-instant duration override is unusual and should be reviewed.

---

#### W_MAX_STACK_EXTREME — Unusually high max stack

| | |
|---|---|
| **Severity** | warning |
| **Condition** | `max_stack IS NOT NULL` AND `max_stack > 10` |
| **Reason** | "max_stack is {max_stack}, which is unusually high. Verify this is intentional." |

A sanity check. Most TTRPG stacking systems cap at 3–5. Values above 10 are likely data entry errors.

---

#### W_ORPHAN_GROUP — Effect group with single member

| | |
|---|---|
| **Severity** | warning |
| **Condition** | `effect_group IS NOT NULL` AND only one effect on this entity has this `effect_group` value |
| **Reason** | "Effect group '{effect_group}' has only one member on this entity. Groups are meant for compound effects." |

An effect group with a single member is pointless. Either the group label is wrong, or other effects in the group are missing.

**Note**: This rule requires querying sibling effects on the same entity. It is the only rule that looks beyond the single effect row.

---

#### W_CONDITION_NO_TRIGGER — Condition set but mode is passive

| | |
|---|---|
| **Severity** | warning |
| **Condition** | `condition IS NOT NULL` AND `mode = 'passive'` |
| **Reason** | "Effect has a trigger condition ('{condition}') but mode is 'passive'. Passive effects are always active — the condition may never be evaluated." |

A passive effect with a trigger condition is contradictory. Either the effect should have a trigger mode (e.g., `on_hit`, `on_cast`) or the condition should be removed.

---

## 4. Algorithm

### 4.1 Pseudocode

```
function validateEffect(effect: EffectRow): ValidationResult {
  reasons = []
  codes = []

  // --- Resolve references ---
  type = effect.effect_type_id ? fetchEffectType(effect.effect_type_id) : null
  target = effect.effect_target_id ? fetchEffectTarget(effect.effect_target_id) : null
  parent = effect.parent_id ? fetchCardEffect(effect.parent_id) : null

  // --- Error rules ---
  if effect.effect_type_id is null:
    add E_NO_TYPE

  if effect.effect_target_id is null:
    add E_NO_TARGET

  if effect.effect_type_id is not null and type is null:
    add E_TYPE_DANGLING

  if effect.effect_target_id is not null and target is null:
    add E_TARGET_DANGLING

  if type and type.is_active = false:
    add E_TYPE_INACTIVE

  if target and target.is_active = false:
    add E_TARGET_INACTIVE

  if type and type.value_type in ('flat','percent','dice')
     and effect.value is null and effect.formula is null:
    add E_NO_VALUE

  if effect.parent_id is not null and parent is null:
    add E_PARENT_DANGLING

  if effect.parent_id is not null and parent is not null
     and (parent.entity_type != effect.entity_type
          or parent.entity_id != effect.entity_id):
    add E_PARENT_CROSS_ENTITY

  if (effect.ref_type is null) != (effect.ref_id is null):
    add E_REF_INCOMPLETE

  if effect.is_stackable = true and effect.stack_group is null:
    add E_STACK_WITHOUT_GROUP

  if effect.scope not in VALID_SCOPES:
    add E_SCOPE_INVALID

  // --- Warning rules (only if no errors on the same field) ---
  if type and type.status not in ('approved','published'):
    add W_TYPE_DRAFT

  if target and target.status not in ('approved','published'):
    add W_TARGET_DRAFT

  if target and target.target_scope is not null
     and effect.scope != target.target_scope
     and effect.scope not in ('global','area')
     and target.target_scope not in ('global','area'):
    add W_SCOPE_MISMATCH

  if effect.value is not null and effect.formula is not null:
    add W_VALUE_AND_FORMULA

  if type and type.default_duration = 'instant'
     and effect.duration is not null and effect.duration != 'instant':
    add W_DURATION_ON_INSTANT

  if effect.max_stack is not null and effect.max_stack > 10:
    add W_MAX_STACK_EXTREME

  if effect.condition is not null and effect.mode = 'passive':
    add W_CONDITION_NO_TRIGGER

  // W_ORPHAN_GROUP requires sibling query — run separately
  if effect.effect_group is not null:
    siblingCount = countEffectsInGroup(
      effect.entity_type, effect.entity_id, effect.effect_group
    )
    if siblingCount <= 1:
      add W_ORPHAN_GROUP

  // --- Compute final state ---
  if any code starts with 'E_':
    state = 'error'
  else if any code starts with 'W_':
    state = 'warning'
  else:
    state = 'valid'

  return { state, reasons, codes }
}
```

### 4.2 Properties

- **Deterministic**: Same input always produces same output. No randomness, no external state beyond the referenced rows.
- **Idempotent**: Running validation twice produces the same result.
- **Non-destructive**: Validation reads data, never writes. The caller decides whether to persist `validation_state`.
- **Single-row scoped**: All rules operate on one effect row, except W_ORPHAN_GROUP which queries siblings. No cross-entity validation.

### 4.3 Batch Validation

For validating all effects on an entity (e.g., before a status transition):

```
function validateEntityEffects(entity_type, entity_id): AggregateResult {
  effects = fetchAllEffects(entity_type, entity_id)
  results = effects.map(e => validateEffect(e))

  worstState = max(results.map(r => r.state))  // error > warning > valid
  allReasons = flatten(results.map(r => r.reasons))
  allCodes = flatten(results.map(r => r.codes))

  return { state: worstState, reasons: allReasons, codes: allCodes, count: effects.length }
}
```

The aggregate result is what feeds into `buildEditorialContext`.

---

## 5. Integration Points

### 5.1 When to Run Validation

| Trigger | Scope | Action |
|---|---|---|
| **Effect created or updated** | Single effect | Validate the effect, persist `validation_state` |
| **Effect type or target updated** | All effects referencing that type/target | Re-validate affected effects, persist `validation_state` |
| **Entity status transition** | All effects on the entity | Run `validateEntityEffects`, feed result into `buildEditorialContext` |

### 5.2 Editorial Workflow Integration

The aggregate validation result feeds into `buildEditorialContext` as a new field:

```typescript
interface EditorialContext {
  hasBaseContent: boolean
  hasAtLeastOneTranslation: boolean
  hasEffectsDefined: boolean
  effectsValidationState: 'valid' | 'warning' | 'error'  // NEW
}
```

The `canTransition` function then uses this field:

| Transition | Current Guard | New Guard |
|---|---|---|
| `draft → pending_review` | `canEditContent` | + `effectsValidationState != 'error'` |
| `review → approved` | `canReview` | + `effectsValidationState = 'valid'` |
| `approved → published` | `canPublish`, has translation, has effects | + `effectsValidationState = 'valid'` |

This means:
- **Drafts with errors** can still be saved (you can work on incomplete effects).
- **Drafts with errors cannot enter review** (reviewer's time is not wasted on broken effects).
- **Cards with warnings cannot be approved** (reviewer must resolve all warnings before approving).
- **Only fully valid cards can be published**.

### 5.3 Publish Readiness

The existing `hasEffectsDefined` check (presence) is augmented, not replaced:

```
publishReady = hasEffectsDefined
            AND effectsValidationState = 'valid'
            AND hasAtLeastOneTranslation
```

A card with effects that are present but invalid is not publish-ready.

### 5.4 Agent Integration (Future)

Agents can use the validation output to:

1. **Auto-fix simple errors**: E_NO_VALUE → suggest a default value based on effect type.
2. **Flag review items**: W_SCOPE_MISMATCH → create a content_feedback entry for reviewer.
3. **Batch audit**: Run `validateEntityEffects` across all entities, produce a report of broken effects.
4. **Migration assistance**: Identify legacy effects that need structured equivalents (effects where `legacy_effects = true` and no `card_effects` rows exist).

The `codes` array in the validation result is machine-readable and stable — agents can switch on specific codes without parsing human-readable reasons.

---

## 6. Allowed Values Reference

For clarity, the recognized values for free-text fields used in validation:

### scope (card_effects)

```
'self' | 'ally' | 'enemy' | 'area' | 'global'
```

### value_type (effect_type)

```
'flat' | 'percent' | 'dice' | 'derived'
```

### operator (effect_type)

```
'add' | 'multiply' | 'replace' | 'set' | 'roll' | 'scale'
```

### default_duration (effect_type)

```
'instant' | 'turn' | 'combat' | 'session' | 'permanent'
```

### category (effect_type)

```
'modifier' | 'condition' | 'trigger' | 'heal' | 'damage' | 'generic'
```

### validation_state (card_effects, effect_target)

```
'valid' | 'warning' | 'error'
```

These are not enforced by DB CHECK constraints today. The validation algorithm treats unrecognized values as warnings or errors depending on the field.

---

## 7. Rules NOT Included (and Why)

| Rule | Why Excluded |
|---|---|
| **Balance checks** (value too high/low for tier) | Requires a balance framework that does not exist yet. |
| **Formula parsing** (is the formula syntactically valid?) | Requires a formula parser that does not exist yet. Add as E_FORMULA_INVALID when parser is built. |
| **Dice expression validation** (is "2d8+4" valid?) | Requires a dice grammar. Add as E_DICE_INVALID when grammar is defined. |
| **Cross-entity effect conflicts** (does this card's effect conflict with another card?) | Requires a resolution engine. Out of scope for structural validation. |
| **Cost/budget validation** (is this effect too powerful for its cost?) | Requires a cost model. Out of scope. |
| **Condition semantics** (is the condition string meaningful?) | Requires a condition catalog. Add as W_CONDITION_UNKNOWN when catalog exists. |
| **Duration semantics** (is "3 turns" a valid duration?) | Requires a structured duration model. Add as W_DURATION_UNKNOWN when model exists. |

Each excluded rule has a clear prerequisite. When that prerequisite is met, the rule should be added to this document and the validation algorithm.

---

## 8. Summary

| Rule Code | Severity | What It Catches |
|---|---|---|
| E_NO_TYPE | error | Effect without a type |
| E_NO_TARGET | error | Effect without a target |
| E_TYPE_INACTIVE | error | Reference to deactivated type |
| E_TARGET_INACTIVE | error | Reference to deactivated target |
| E_TYPE_DANGLING | error | Reference to non-existent type |
| E_TARGET_DANGLING | error | Reference to non-existent target |
| E_NO_VALUE | error | Missing value for non-derived effect |
| E_PARENT_CROSS_ENTITY | error | Parent effect on different entity |
| E_PARENT_DANGLING | error | Parent effect does not exist |
| E_REF_INCOMPLETE | error | Partial cross-reference (type without id or vice versa) |
| E_STACK_WITHOUT_GROUP | error | Stackable without stack_group |
| E_SCOPE_INVALID | error | Unrecognized scope value |
| W_TYPE_DRAFT | warning | Type not yet approved/published |
| W_TARGET_DRAFT | warning | Target not yet approved/published |
| W_SCOPE_MISMATCH | warning | Effect scope contradicts target's default scope |
| W_VALUE_AND_FORMULA | warning | Both value and formula set (ambiguous) |
| W_DURATION_ON_INSTANT | warning | Duration override on instant effect |
| W_MAX_STACK_EXTREME | warning | Unusually high max_stack (>10) |
| W_ORPHAN_GROUP | warning | Effect group with single member |
| W_CONDITION_NO_TRIGGER | warning | Condition on passive effect |

**12 error rules. 8 warning rules. 0 balance rules. 0 execution rules.**

This is the minimum viable validation layer. It catches structural defects without making game design decisions.
