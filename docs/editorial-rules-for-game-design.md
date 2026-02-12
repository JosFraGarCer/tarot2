# Tarot2 — Editorial Rules for Game Design

> This document defines editorial rules specific to TTRPG content.
> It explains what editors and reviewers must check beyond schema validity,
> and what should block publication even if the data is technically "valid."
>
> This is not a generic CMS editorial guide. It is specific to the domain of
> designing, reviewing, and publishing game-mechanical content.

---

## 1. Game Design Is Not Content Editing

Generic content editing asks: "Is this text correct, complete, and well-written?"

Game design editing asks all of that, **plus**:

- "Is this mechanically consistent with the rest of the system?"
- "Is this balanced relative to other cards of the same tier?"
- "Can this effect be resolved unambiguously by the rules engine?"
- "Does this card interact safely with every other published card?"

A card can pass every Zod schema, have complete translations, have structured effects, and be editorially "approved" — and still be **broken** from a game design perspective.

**The editorial workflow must become domain-aware.** Schema validity is necessary but not sufficient.

---

## 2. What Editors Must Check (Beyond Schema)

### 2.1 Effect Completeness

| Check | Question | Blocks |
|---|---|---|
| Effect type reference | Does every `effect_type_id` point to an active, published effect type? | Approval |
| Effect target reference | Does every `effect_target_id` point to an active, published effect target? | Approval |
| Value presence | Does every effect with `value_type != 'derived'` have a non-null `value` or `formula`? | Approval |
| Formula validity | Is every `formula` string parseable and free of undefined references? | Approval |
| Scope consistency | Does the effect's `scope` make sense with its target's `target_scope`? | Review |

### 2.2 Card Structural Integrity

| Check | Question | Blocks |
|---|---|---|
| Type appropriateness | Does this card's effects match what its `card_type` implies? (e.g., a "creature" card should define HP-related effects) | Review |
| Family consistency | Are cards in the same `card_family` mechanically coherent? | Review |
| World card base alignment | If this world card overrides a base card, are the overrides intentional and documented? | Approval |
| Orphan detection | Does this world card's `base_card_id` point to a non-archived base card? | Approval |

### 2.3 Effect Interactions

| Check | Question | Blocks |
|---|---|---|
| Self-contradiction | Does this card have effects that cancel each other out? (e.g., +5 damage and -5 damage to the same target) | Review |
| Compound completeness | If this card has compound effects (parent + children), are all children present and consistent? | Approval |
| Stack group conflicts | If this card's effects use `stack_group`, do they conflict with other published cards in the same group? | Review |
| Cross-reference validity | If effects use `ref_type`/`ref_id`, do the referenced entities exist and are they published? | Approval |

### 2.4 Legacy-to-Structured Alignment

| Check | Question | Blocks |
|---|---|---|
| Mode declaration | Is `legacy_effects` explicitly set (not relying on default)? | Review |
| Structured coverage | If `legacy_effects = false`, do `card_effects` rows exist? | Approval |
| Narrative fallback | If `legacy_effects = false`, does the `effects` JSONB still contain readable flavor text? | Review (not blocking) |
| Migration completeness | If this card was previously legacy and is now structured, do the structured effects match the narrative intent? | Approval |

---

## 3. What Should Block Publication

The following conditions should prevent a card from reaching `published` status, even if the editorial state machine technically allows the transition.

### 3.1 Hard Blocks (Must Be Enforced)

These are objective, automatable checks:

- **Missing effect type/target references**: Any `card_effects` row with null or inactive `effect_type_id` or `effect_target_id`.
- **Orphaned world card**: `base_card_id` points to a deleted or archived base card.
- **Empty structured effects**: `legacy_effects = false` but no `card_effects` rows exist.
- **Unparseable formula**: `formula` field contains a string that the formula engine cannot parse (once a parser exists).
- **Invalid stacking**: `max_stack` set without `is_stackable = true` (already enforced by DB constraint, but should also be checked at the application level).

### 3.2 Soft Blocks (Should Be Flagged for Review)

These require human judgment:

- **No cost defined**: A card with powerful effects but no resource cost (once a cost model exists).
- **Extreme values**: `value` outside expected range for the effect type (e.g., +100 to attack when typical is +1 to +5).
- **Unbalanced compound effects**: A compound effect where the total power exceeds the expected budget for the card's tier.
- **Scope mismatch**: An effect targeting `self` with a target that implies `enemy` (e.g., `scope = 'self'` + `effect_target = 'damage.fire'`).
- **Duration without expiration**: A non-instant effect with no clear expiration mechanism.
- **Legacy mode on approved+ cards**: A card at `approved` or higher status still using `legacy_effects = true` for mechanically significant effects.

### 3.3 Information Blocks (Should Be Visible but Not Blocking)

- **No tags assigned**: Card has no semantic tags (reduces discoverability but doesn't affect mechanics).
- **No image**: Card has no visual representation.
- **Single-language only**: Card has translations in only one language.
- **No description**: Card has `name` but no `description` or `short_text`.

---

## 4. The `validation_state` Field

Both `card_effects` and `effect_target` have a `validation_state` field with values: `valid`, `warning`, `error`.

This field is currently **visual only** — it is set manually or by UI logic and has no backend enforcement. It should become the primary mechanism for communicating effect validity:

| State | Meaning | Editorial Impact |
|---|---|---|
| `valid` | Effect passes all checks | No block |
| `warning` | Effect has potential issues (soft blocks) | Flagged for reviewer attention |
| `error` | Effect has definite problems (hard blocks) | Blocks approval and publication |

### Proposed Validation Flow

1. **On effect save**: Run automated checks, set `validation_state` accordingly.
2. **On card status transition to `review`**: Aggregate all effect `validation_state` values. If any are `error`, block the transition.
3. **On card status transition to `approved`**: All effects must be `valid`. `warning` effects require explicit reviewer acknowledgment.
4. **On card status transition to `published`**: All effects must be `valid`. No warnings allowed.

This does not exist today. It is the single most important editorial improvement for game design integrity.

---

## 5. Reviewer Responsibilities

### 5.1 What a Reviewer Must Verify

A reviewer (someone with `canReview` permission) must verify:

1. **Mechanical correctness**: Effects do what the card description says they do.
2. **Internal consistency**: Effects don't contradict each other within the same card.
3. **External consistency**: Effects don't break interactions with other published cards.
4. **Completeness**: All required fields are present and meaningful.
5. **Legacy alignment**: If the card has both legacy and structured effects, they tell the same story.

### 5.2 What a Reviewer Should NOT Do

- **Balance decisions**: Reviewers check correctness, not balance. Balance is a game designer responsibility.
- **Flavor editing**: Reviewers check mechanics, not prose quality. Translation reviewers handle text.
- **Schema changes**: Reviewers should never modify effect types or targets to make a card work. If the catalog is insufficient, that's a separate editorial task.

### 5.3 What a Publisher Must Verify

A publisher (someone with `canPublish` permission) must verify:

1. **All reviewer checks passed**: The card has been through review without unresolved issues.
2. **Version alignment**: The card is pinned to the correct `content_version_id`.
3. **No open feedback**: All `content_feedback` for this entity is resolved or dismissed.
4. **Balance sign-off**: A game designer has acknowledged the card's power level (once a balance framework exists).

---

## 6. "Publish-Ready" for a TTRPG Card

A card is **publish-ready** when ALL of the following are true:

### Structural
- Has a unique `code`
- Has a `card_type_id` pointing to an active card type
- Has a `card_family`
- Has at least one translation with `name`

### Mechanical
- Has effects defined (structured or legacy)
- If structured: all effects have valid, active type and target references
- If structured: all formulas are parseable (once parser exists)
- If structured: all `validation_state` values are `valid`
- If legacy: effects JSONB is non-empty and well-formed

### Editorial
- Status is `approved` (has passed review)
- No open feedback with status `open`
- Pinned to a content version
- Audit log shows complete transition history (draft → review → approved)

### Game Design (Future)
- Cost is defined and within budget for the card's tier
- Power level is within acceptable range
- No known broken interactions with other published cards
- Balance reviewer has signed off

---

## 7. How the Editorial Workflow Should Evolve

### Current State

```
draft → pending_review → review → approved → published
                              ↓
                     changes_requested → draft
```

The workflow enforces **process** (who can do what) but not **domain** (what must be true about the content).

### Target State

The same workflow, but with **domain-aware guards** at each transition:

| Transition | Current Guard | Should Add |
|---|---|---|
| draft → pending_review | `canEditContent` permission | All effects have `validation_state != 'error'` |
| pending_review → review | `canReview` permission | No change |
| review → approved | `canReview` permission | All effects `valid`, no orphaned references, formulas parseable |
| approved → published | `canPublish` permission, has translation, has effects | No open feedback, version pinned, all effects `valid`, balance sign-off |
| any → changes_requested | Appropriate permission | Reason required (already supported via audit log) |

### Implementation Approach

1. **Extend `buildEditorialContext`** in `createCrudHandlers.ts` to check effect validity.
2. **Add new fields to `EditorialContext`**: `hasValidEffects`, `hasOpenFeedback`, `hasVersionPin`.
3. **Update `canTransition`** to check these new fields.
4. **Set `validation_state` automatically** when effects are created or updated.

This is incremental — each guard can be added independently without breaking the existing workflow.

---

## 8. Relationship to Other Documents

| Document | Relevance |
|---|---|
| `ttrpg-domain-overview.md` | Defines the vocabulary and philosophy this document builds on |
| `ttrpg-card-model.md` | Defines what a card is and what makes it structurally valid |
| `ttrpg-effects-system.md` | Defines the effects system and its correctness guarantees |
| `ttrpg-combat-and-resolution.md` | Defines what primitives are needed for the game engine (not the editor) |

---

## 9. Summary: Editorial Priorities for Game Design

| Priority | Action | Impact |
|---|---|---|
| 1 | **Automate `validation_state`** on effect save | Prevents invalid effects from reaching review |
| 2 | **Add effect reference checks** to `buildEditorialContext` | Prevents cards with broken references from being approved |
| 3 | **Require structured effects** for status ≥ approved | Ensures all approved cards are machine-readable |
| 4 | **Add open feedback check** to publish guard | Prevents publishing cards with unresolved issues |
| 5 | **Add version pin check** to publish guard | Ensures published cards are tied to a release |
| 6 | **Formalize balance review** as a workflow step | Ensures published cards are game-design-approved |
