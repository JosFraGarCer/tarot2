---
trigger: manual
---
# 🃏 TAROT — SYSTEM DESIGN (DRAFT)

> **Status**: Exploratory / Provisional
>
> **Purpose**: This document explores the **core gameplay system of Tarot**, with a focus on
> *decision-making*, *conflict resolution* and *combat*.
>
> It is intentionally **incomplete**, **non-final**, and **open to contradiction**.
> Its role is to surface hypotheses early so they can be tested, broken, or discarded.
>
> ❗ This document is **not** enforced by Windsurf and does **not** define editorial or technical invariants.

---

## 0. Design Principles

These principles guide all system decisions. They are stronger than any single mechanic.

1. **Decisions over math**
   Interesting choices matter more than numerical optimisation.

2. **State over attrition**
   Combat is about changing states, not slowly reducing hit points.

3. **Resolution over simulation**
   The system resolves intent; it does not simulate physics.

4. **End conditions are explicit**
   A conflict must always move toward a clear resolution.

5. **Few variables, strong meaning**
   Each stat must represent a concept the player can reason about.

---

## 1. What Is a Conflict?

A **conflict** is any situation where:

* two or more agents pursue incompatible goals
* outcomes are uncertain
* choices influence resolution

Conflict includes:

* physical combat
* social confrontation
* mental struggle
* ritual or symbolic opposition

Combat is a *subset* of conflict.

---

## 2. Core Question (Unresolved)

> **What does it mean to "win" a conflict in Tarot?**

Open possibilities:

* forcing surrender
* gaining decisive advantage
* exhausting the opponent’s options
* triggering a narrative break condition

❓ This is not decided yet.

---

## 3. Proposed Core Model (Hypothesis)

Instead of HP / Damage / Armor, Tarot explores a **pressure-based model**.

### Core Variables (Draft)

* **Agency (AG)** — ability to keep making meaningful decisions
* **Pressure (PR)** — how close a character is to losing control
* **Exposure (EX)** — vulnerability to decisive actions

These variables are **conceptual**, not yet numeric.

---

## 4. Actions

An **action** represents intent, not motion.

Examples:

* strike
* threaten
* defend
* reposition
* focus

Actions typically:

* increase or reduce Pressure
* modify Exposure
* protect or restore Agency

No action directly "kills".

---

## 5. Protection (Early Idea)

Protection does **not** reduce damage.

Possible roles:

* absorbing Pressure
* delaying Exposure increase
* degrading over time

❓ Exact behaviour is undecided.

---

## 6. Resolution Conditions (Open)

A conflict may resolve when:

* Agency reaches zero
* Exposure crosses a threshold
* a specific card effect triggers resolution
* a participant chooses to withdraw

Multiple resolution paths should exist.

---

## 7. Role of Cards

Cards should:

* change states, not numbers
* introduce asymmetry
* create timing decisions

Cards should **not**:

* add flat bonuses
* exist purely as stat modifiers

---

## 8. What This System Avoids

Explicitly avoided (for now):

* detailed weapon stats
* long damage tables
* realistic hit modelling
* large stat blocks

These may be revisited later.

---

## 9. Minimal Viable Conflict (Next Step)

To test the system, we aim to build:

* 2 agents
* 3 actions
* 1 clear resolution condition
* no UI
* no balance tuning

If this is not interesting, the model must change.

---

## 10. Open Questions

* How visible are internal states to players?
* Can different conflict types share the same core?
* How do group conflicts work?
* How does narrative override mechanics?

These are intentionally unanswered.

---

## 11. Success Criteria

This system succeeds if:

* players face real dilemmas
* outcomes feel earned
* conflicts end decisively
* the system is easy to reason about

Balance and polish come later.

---

## Final Note

> This document exists to be **broken**.
> If it becomes comfortable, it has failed its purpose.
