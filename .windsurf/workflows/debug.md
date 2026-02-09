---
auto_execution_mode: 0
description: Diagnose and debug Tarot2 Editor issues with structured logging and reproduction
---

You are debugging an issue in the **Tarot2 Editor** codebase.

Your goal is to **identify root cause** and **provide a minimal fix** or clear reproduction steps.

---

## Initial Triage

### 1. Identify the Symptom
- What is the observed behavior?
- What is the expected behavior?
- When does it occur (user action, edge case, load condition)?

### 2. Gather Context
- Check `SCHEMA POSTGRES.TXT` for relevant tables/enums
- Review shared/schemas for entity definitions
- Identify which CRUD handlers are involved
- Determine if issue is in Manage or Admin surface

---

## Investigation Steps

### 3. Trace Data Flow
Follow the data from:
1. User action → API call → Backend handler → DB query
2. DB result → Zod validation → Transform → Response
3. Response → Frontend fetch → Composable → Component

Use `grep_search` to find:
- Related Zod schema in `shared/schemas/`
- CRUD handler in `server/api/<entity>/`
- Component using the data

### 4. Check for Common Causes
- Missing Zod validation at boundaries
- Schema mismatch between frontend/backend
- Incorrect `useAsyncData` key causing cache collision
- Stale reactive state from incomplete deep cloning
- Missing capabilities check for conditional rendering
- Filter/pagination state not synced properly
- SSR hydration mismatch when using client-only state

### 5. Add Diagnostic Logging

**Backend (use structured logging):**
```typescript
logger.debug({ entity, action, input }, 'Debug: entering handler')
logger.info({ result: sanitize(result) }, 'Debug: handler result')
```

**Frontend:**
```typescript
console.debug('[EntityName] State:', toRaw(state))
// Use toRaw to avoid proxy-wrapped objects in logs
```

> ⚠️ Use only during investigation, remove before final fix.


---

## Reproduction

### 6. Create Minimal Reproduction
- Isolate the issue in the smallest possible scope
- Identify which entity/flow is affected
- Note any error messages, stack traces, or console output

### 7. Document Findings
- Root cause (confirmed vs suspected)
- Affected files
- Trigger conditions
- Workaround (if exists)

---

## Fix Strategy

### 8. Propose Minimal Fix
- Prefer single-line changes over refactors
- Fix root cause, not symptoms
- Preserve existing invariants
- Do NOT introduce new patterns without explicit approval

### 9. Regression Check
- What other code might be affected?
- Does this fix break any other flow?
- Are there tests (manual or automated) to verify?

---

## Output Format

```
## Issue Summary
**Symptom:** ...
**Expected:** ...
**Severity:** P0 / P1 / P2

## Root Cause
...

## Affected Files
- ...

## Reproduction Steps
1. ...
2. ...

## Proposed Fix
[code snippet or file:line reference]

## Verification
- [ ] Test in Manage
- [ ] Test in Admin
- [ ] Check console for errors
```

If root cause cannot be determined, output:

```
## Investigation Blocked
**What was tried:** ...
**Missing info:** ...
**Next steps for human:** ...
```
