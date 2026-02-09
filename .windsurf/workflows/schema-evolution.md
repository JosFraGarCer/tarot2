---
auto_execution_mode: 0
description: Add or modify fields in shared/schemas without breaking frontend/backend contracts
---

You are evolving the **shared Zod schemas** in Tarot2.

Your goal is to **extend domain definitions** while **preserving all existing contracts** and **ensuring end-to-end validation**.

---

## Pre-Evolution Checklist

### 1. Verify Schema Location
- Schema must live in `shared/schemas/`
- Confirm which entity owns the field
- Check if field belongs to a shared entity (Arcane, Card, World, etc.)

### 2. Review Existing Schema
```typescript
// Example: shared/schemas/arcana.ts
export const ArcanaSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  // ... existing fields
})
```

### 3. Identify Impact Surface
Which surfaces consume this schema?
- Manage (frontend + backend)
- Admin (frontend + backend)
- Future Game/Simulation layers

---

## Field Addition Process

### 4. Add Field to Schema
```typescript
export const ArcanaSchema = z.object({
  // ... existing fields
  newField: z.string().optional(), // or required() based on intent
})
```

**Rules for new fields:**
- Use Zod primitives (`z.string()`, `z.number()`, `z.boolean()`) or existing schemas
- Mark optional (`?.optional()`) unless field is mandatory
- Add `.describe('...')` for documentation
- Do NOT use `.refine()` or `.transform()` unless necessary (keep schema pure)

### 5. Infer TypeScript Type
```typescript
export type Arcana = z.infer<typeof ArcanaSchema>
// Type is automatically available via Nuxt auto-import
```

### 6. Update Presets (Frontend)
Find the preset for this entity (e.g., `useEntityFormPreset`):
```typescript
fields: [
  // ... existing fields
  {
    name: 'newField',
    label: 'New Field',
    type: 'text', // or 'number', 'select', etc.
    required: false,
  },
]
```

### 7. Update API Handlers
For each CRUD handler consuming this schema:
- Update `querySchema` if field is filterable
- Update `bodySchema` if field is writable
- Ensure Zod validation catches missing required fields

---

## Field Modification Process

### 8. Assess Breaking Change
**Safe changes:**
- Adding optional field
- Relaxing validation (e.g., `min(5)` → `min(3)`)
- Adding description

**Breaking changes (require migration):**
- Removing field
- Making optional → required
- Tightening validation
- Changing type (string → number)

### 9. If Breaking Change Required
1. Add new field alongside old field
2. Update frontend to accept both
3. Create migration script for existing data
4. Remove old field in next release

---

## Validation Verification

### 10. Verify Backend Validation
Check that `createCrudHandlers` uses the schema:
```typescript
createCrudHandlers({
  entity: 'arcana',
  schema: ArcanaSchema,
  // ...
})
```

### 11. Verify Frontend Validation
Check that `FormModal` receives the schema via preset:
```typescript
const preset = useEntityFormPreset('arcana')
// preset must include new field in fields array
```

### 12. Verify Type Safety
- Frontend components should infer types from schema
- No manual `interface` definitions allowed
- Use `z.infer<typeof Schema>` pattern

---

## Cross-Surface Review

### 13. Test in Both Surfaces
- [ ] Manage: Create/Edit entity with new field
- [ ] Admin: Create/Edit entity with new field
- [ ] Verify filters work if field is filterable
- [ ] Verify previews show new field

### 14. Check Downstream Consumers
- Any composables using this entity?
- Any components expecting specific fields?
- Any tests (manual or automated) that need updates?

---

## Output Format

```
## Schema Evolution
**Entity:** ...
**Change:** Add / Modify / Remove field

## Field Definition
```typescript
fieldName: z.type() // with description
```

## Impact Assessment
- Manage: ✅ Tested / ⚠️ Needs manual test
- Admin: ✅ Tested / ⚠️ Needs manual test
- Backend handlers updated: Yes / No

## Breaking Changes
Yes / No
If Yes: [Migration plan]

## Verification Checklist
- [ ] Schema compiles
- [ ] Type inferred correctly
- [ ] Preset includes field
- [ ] CRUD handlers validate
- [ ] Manual QA passed
```
