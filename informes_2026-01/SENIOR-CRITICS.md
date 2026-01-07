# 🎭 Senior Dev Code Review: Tarot2 (Deep Dive)

```
 Do a git diff and pretend you're a senior dev doing a code review and you HATE this implementation. What would you criticize? What edge cases am I missing? 
```

*Status: Terminal Burnout & Escalating Hostility*

I've looked deeper into the guts of this thing. It’s not just a "Golden Path" app; it's a house of cards built on top of every possible "clever" Nuxt pattern you could find on StackOverflow. Here is the full post-mortem.

---

### 1. 🔐 Security: "Security by Optimism"
- **The DB Hammer:** Your [00.auth.hydrate.ts](cci:7://file:///home/bulu/devel/tarot2/server/middleware/00.auth.hydrate.ts:0:0-0:0) middleware is doing a full `LEFT JOIN` on `users`, `user_roles`, and `roles` with a `json_agg`... **on every single request**. You're DDOSing your own database just to know if a user is "active". Ever heard of Redis? Or just putting the roles in the JWT? 
- **The JWT Secret Leak:** In [plugins/auth.ts](cci:7://file:///home/bulu/devel/tarot2/server/plugins/auth.ts:0:0-0:0), [secretKey()](cci:1://file:///home/bulu/devel/tarot2/server/plugins/auth.ts:16:0-22:1) reads `process.env.JWT_SECRET` and encodes it **every single time** it's called. It's a synchronous `TextEncoder` call and a syscall in the middle of your hot path. 
- **The Guard is a Sieve:** [01.auth.guard.ts](cci:7://file:///home/bulu/devel/tarot2/server/middleware/01.auth.guard.ts:0:0-0:0) uses `PUBLIC_API_PATHS.has(path)`. If a developer adds `/api/auth/Login` (uppercase), it bypasses the set. If they add `/api/auth/login/extra`, it bypasses the set. Use a proper router or a regex, not a case-sensitive string set.

### 2. 🌀 State Management: [useQuerySync](cci:1://file:///home/bulu/devel/tarot2/app/composables/common/useQuerySync.ts:26:0-160:1) is a Performance Black Hole
- **Deep Clone Mania:** Your [useQuerySync.ts](cci:7://file:///home/bulu/devel/tarot2/app/composables/common/useQuerySync.ts:0:0-0:0) is deep-cloning everything on every change using `JSON.parse(JSON.stringify())` as a fallback. On a large state object, this is going to make the UI feel like it's running through molasses.
- **Reactivity Loops:** You have a `watchEffect` and two `watch` statements fighting over the same state. I can almost smell the infinite loops from here. If the URL updates the state, which triggers a watch, which tries to sync back to the URL... you're one "almost-equal" comparison away from a browser crash.

### 3. 🛠️ The "Universal" CRUD Handler is a Trap
- **The `any` Problem:** [server/api/arcana/_crud.ts](cci:7://file:///home/bulu/devel/tarot2/server/api/arcana/_crud.ts:0:0-0:0) uses `// eslint-disable-next-line @typescript-eslint/no-explicit-any` for the query builder. You’ve successfully bypassed the entire point of using Kysely and TypeScript. If I change a column name in the DB, the compiler won't tell me. I’ll just get a runtime error when the user opens the page.
- **Subquery Hell:** Every row in your list view triggers a subquery for tags. If you have 100 rows, that’s a massive JSON aggregation overhead on the DB. This won't scale past a few dozen entries before the "Time to First Byte" starts climbing into the seconds.

### 4. 🧪 Testing: "I wrote a test, so it works"
- **Manage-arcana.spec.ts:** This test is so shallow it's practically two-dimensional. 
  - `expect(columns).toHaveCount(1)`? You're checking if the table has *one* column? What happened to the other 5 you defined in the "Bridge"? 
  - You’re using `page.waitForLoadState('networkidle')`. This is flaky as hell. One rogue analytics pixel or slow CSS file and your tests timeout for no reason. 
  - You aren't testing the actual data—just that "something" appeared. This is "Structure Testing", not "Functional Testing".

### 5. 🌍 Translations: The "Lazy Localization" Strategy
- **Fallback logic:** In [arcana/_crud.ts](cci:7://file:///home/bulu/devel/tarot2/server/api/arcana/_crud.ts:0:0-0:0), you’re doing `sql`coalesce(t_req.name, t_en.name)``. This means if a translation is missing, the user gets English. Fine. But you don't show the user *that* it's a fallback in the UI effectively until they open the form. The list view is a mix of languages with no visual indication of "this needs translation".

---

### 💀 Edge Cases You're Missing (The "Real World" Edition)
1.  **The "Slow DB" Freeze:** You have no timeouts on your DB queries in the CRUD handlers. If the DB locks, your entire Node process hangs until the kernel kills the socket.
2.  **Image Upload Zombies:** [FormModal.vue](cci:7://file:///home/bulu/devel/tarot2/app/components/manage/modal/FormModal.vue:0:0-0:0) handles image uploads. If a user uploads a 10MB 4K PNG, do you resize it? No. You just shove it into `/public/img/`. You're going to run out of disk space and bandwidth in a week.
3.  **Role Escalation:** Your `mergePermissions` logic assumes that if a user has two roles, the permissions just "merge". What if one role is a "Deny" role? You don't have a conflict resolution strategy.
4.  **The "Back Button" Ghost:** Because of how [useQuerySync](cci:1://file:///home/bulu/devel/tarot2/app/composables/common/useQuerySync.ts:26:0-160:1) works, if a user hits the "Back" button, the state might not sync correctly if the router hasn't finished its internal transition. You'll end up with a URL saying "page 2" but the table showing "page 1".

### # 📋 Final "Hater" Verdict
This app is a **Prototype masquerading as a Production System**. It looks great in a demo, but the moment you have 5 concurrent users and 1,000 rows of data, the database will melt, the UI will lag, and the "Magic Bridge" logic will become an unmaintainable nightmare.

**My Advice:** Stop building "Bridges" and start building **Software**.

---
**Task Status:**
- **Auth & Security:** Deep dive completed. (Critical Issues Found)
- **State Management:** Complexity analyzed. (Performance Issues Found)
- **Logging:** Reviewed. (Standard, but boring)
- **Tests:** Reviewed. (Flaky and useless)
- **Hardcoded Config:** Found JWT secret and path strings issues.

Final Summary: The app needs a serious "Optimization & Hardening" phase before it's even close to being "Senior Level" quality.

---

# 🎭 Senior Dev Code Review: Tarot2
*Status: Aggressive & Opinionated*

Listen, I've seen some things in this repo. It's... functional, I guess. But if we're talking "Senior Dev who hates his life and this app" level of scrutiny, here is why I'd be drinking heavily tonight.

---

### 1. 🏗️ Architectural Bloat & "Bridge" Obsession
We've built a "Bridge" for everything. `@/app/components/manage/ManageTableBridge.vue` is basically a middleman that doesn't know if it wants to be a component or a configuration layer.
- **The Sin:** You're mapping entities to rows in the frontend (`mapEntitiesToRows`). Why? The backend should send exactly what the UI needs. Now we have mapping logic duplicated or at least fragmented across the app.
- **Complexity:** `ManageTableBridge` -> `CommonDataTable` -> `UTable`. It's a nesting doll of props. If I want to change how a single cell renders in a specific entity table, I have to pass a slot through three layers of "Bridges".

### 2. 🧪 The "Zod-to-UI" Magic is Brittle
In `@/app/components/manage/modal/FormModal.vue`, you're trying to be clever by parsing Zod schemas at runtime to generate form fields.
- **The Edge Case:** What happens when a Zod schema uses `.refine()` or `.transform()`? Your [unwrap](cci:1://file:///home/bulu/devel/tarot2/app/components/manage/modal/FormModal.vue:257:4-264:5) function and heuristic-based relation detection (`/(^|_)arcana_id$/.test(key)`) will fall flat on its face.
- **Brittleness:** You're relying on naming conventions (`arcana_id`) to decide it's a select menu. If someone names a field `target_arcana_id_override`, your "magic" breaks and you get a text input for a Foreign Key. Enjoy the DB errors.

### 3. 🌍 i18n is a Minesweeper Game
- **Fallback Logic:** You have fallbacks everywhere ([tt](cci:1://file:///home/bulu/devel/tarot2/app/components/common/CommonDataTable.vue:201:0-204:1) function in `CommonDataTable`, [trLabel](cci:1://file:///home/bulu/devel/tarot2/app/components/manage/modal/FormModal.vue:389:0-417:1) in `FormModal`). If a key is missing, the user sees "ui.fields.status". It looks like a half-finished dev build.
- **Hardcoded Strings:** I see [tt('ui.table.densityLabel', 'Density')](cci:1://file:///home/bulu/devel/tarot2/app/components/common/CommonDataTable.vue:201:0-204:1). Why is the fallback hardcoded in the component? If we change the English term, we have to search-and-replace the whole codebase.

### 4. 🕳️ The "CRUD Handler" Black Box
`@/server/utils/createCrudHandlers.ts` is doing way too much. 
- **The Risk:** It handles list, create, detail, update, and remove in one go. If one entity needs a slightly different `POST` flow (e.g., triggering a webhook or secondary insert), you're forced to either break the pattern or bloat the handler with "hooks" and "interceptors".
- **Performance:** Your [buildSelect](cci:1://file:///home/bulu/devel/tarot2/server/api/arcana/_crud.ts:48:0-93:1) in [arcana/_crud.ts](cci:7://file:///home/bulu/devel/tarot2/server/api/arcana/_crud.ts:0:0-0:0) is doing subqueries for tags inside a list view. On a table with 100 rows, that's 100 subqueries if not properly optimized by the DB engine. You're begging for a N+1 problem.

### 5. 📉 Edge Cases You're Ignoring
- **The "Dirty Form" Disaster:** If a user starts editing in `FormModal`, accidentally clicks the backdrop, and the modal closes... all their work is gone. No "Unsaved Changes" warning? In 2026?
- **Concurrent Edits:** Two users open the same Arcana. User A saves. User B saves 5 seconds later. User A's changes are nuked. You have zero optimistic locking or `updated_at` checks in your `translatableUpsert`.
- **Empty States:** Your empty state in [EntityViewsManager.vue](cci:7://file:///home/bulu/devel/tarot2/app/components/manage/EntityViewsManager.vue:0:0-0:0) is a static "No items found". It doesn't tell the user *why*. Is it because of filters? Is the DB empty? Is the API down?

---

### # 📋 Manual QA Checklist (The "Fix This or Don't Commit" List)
- [ ] **Data Loss:** Open a `FormModal`, type something, click outside. If it closes without a prompt, fix it.
- [ ] **Race Conditions:** Open two tabs, edit the same entity. See if the second save fails or just overwrites.
- [ ] **Zod Failures:** Add a `.refine()` to `arcanaCreateSchema`. Watch the `FormModal` crash or ignore the validation.
- [ ] **N+1 Audit:** Check the query logs for the Arcana list. If I see 50 queries for one page, you're refactoring it.

**Verdict:** It's a "Golden Path" app. It works if you're a perfect user who never makes mistakes. For everyone else, it's a minefield.

---
**Task Status:**
- **Scan core architectural components:** Completed.
- **Audit backend CRUD patterns:** In progress.
- **Check for legacy components:** Pending.
- **Evaluate error handling:** Pending.
- **Review i18n:** Pending.
- **Identify performance bottlenecks:** Pending.