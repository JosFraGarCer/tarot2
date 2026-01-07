# 🎭 Senior Dev Code Review: Tarot2 (Deep Dive)

*Status: Terminal Burnout & Escalating Hostility*

I've looked deeper into the guts of this thing. It’s not just a "Golden Path" app; it's a house of cards built on top of every possible "clever" Nuxt pattern you could find on StackOverflow. Here is the full post-mortem.


## Prompt

```
Eres un desarrollador senior que ODIA esta app y su equipo de desarrollo, te encargan revisar su codigo. Que criticarias? ¿Qué casos extremos me estoy perdiendo?
```

```
 Do a git diff and pretend you're a senior dev doing a code review and you HATE this implementation. What would you criticize? What edge cases am I missing? 
```

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

---

💀 Crítica Senior: "Arquitectura de Cristal"
1. El "God Composable" (useEntityBaseContext.ts)
Has pasado de un componente monolítico a un composable monolítico. Felicidades, ahora el acoplamiento es invisible pero igual de letal. Si ese composable falla o se cuelga en el cliente, toda la gestión de entidades (Manage/Admin) muere. No hay graceful degradation.

2. Backend "Copiar-Pegar" (createCrudHandlers)
Confías demasiado en la abstracción createCrudHandlers. Es cómoda, sí, pero asume que todas las entidades se comportan igual. En el momento en que necesites una lógica de validación cruzada compleja (ej: "no puedes borrar X si Y está en estado Z pero solo si el usuario no es Admin"), tu abstracción unificada se convertirá en un espagueti de if/else dentro del core.

3. El Peligro de las Traducciones (_translations)
El sistema depende críticamente de tablas de traducción.

¿Qué pasa si una fila en la tabla principal no tiene su entrada en _translations? El frontend probablemente recibirá un null y hará un white screen of death porque alguien olvidó un optional chaining.
Race conditions: Si dos editores guardan la misma entidad en idiomas distintos al mismo tiempo, ¿cómo maneja translatableUpsert la integridad?
⚠️ Casos Extremos (Lo que te estás perdiendo)
🟦 1. El "Efecto Cascada" en Borrados
Usas deleteLocalizedEntity. ¿Has probado a borrar una entidad que tiene miles de tag_links o que está referenciada en world_card_overrides?

Riesgo: Un timeout en la DB que deje la mitad de los datos huérfanos porque no hay una transacción atómica robusta que limpie todo el grafo de dependencias.
🟦 2. El Usuario "Pestañas Infinitas" (Concurrency)
Un editor abre el FormModal de la carta "El Loco". Se va a comer. Otro editor entra, cambia la imagen y guarda. El primer editor vuelve, pulsa "Guardar".

Resultado: El cambio del segundo editor desaparece. No tienes Optimistic Locking (versiones/timestamps) en el payload del PATCH. El último en llegar pisa todo.
🟦 3. Hydration Mismatch en SSR
Nuxt UI es genial hasta que deja de serlo. Con filtros complejos cargados de forma perezosa (useFilterOptions), es muy fácil que el servidor renderice un estado y el cliente otro si la API tarda 10ms más de la cuenta.

Resultado: Botones que no clickan, selectores que se resetean solos y errores de "Hydration mismatch" en la consola que estás ignorando.
🟦 4. Bulk Actions vs Límites de Memoria
Si un usuario selecciona 500 filas y aplica una "Bulk Action", tu backend probablemente las procese en un bucle.

Riesgo: Bloqueo del hilo de Node.js o superación del límite de parámetros de Postgres. Las acciones en lote deben estar limitadas o procesarse en colas/batches.
🟦 5. El Infierno de los Roles Dinámicos
Tu middleware 01.auth.guard.ts confía en las capabilities. ¿Qué pasa si le quitas un permiso a un usuario MIENTRAS tiene la sesión abierta y está a mitad de un formulario de edición largo?

Riesgo: El frontend le deja seguir escribiendo, pero al dar a "Guardar", el backend le suelta un 403 y pierde 20 minutos de trabajo. No hay aviso previo de "Sesión expirada o permisos cambiados".

---

💀 Crítica Senior (Round 2): "El Maquillaje del Caos"

## Prompt

```
De nuevo, eres un desarrollador senior que ODIA esta app y su equipo de desarrollo, sabes que esas sabandijas se han esforzado en arreglar todo lo que has criticado. Otra vez  te encargan revisar su codigo, esta vez se van a enterar. Que criticarias? ¿Qué casos extremos me estoy perdiendo?
```

1. Falsa Sensación de Seguridad en useEntityBaseContext.ts
Habéis metido un setInterval para comprobar la sesión cada 5 minutos. ¿En serio?

El caso extremo que os falta: ¿Qué pasa si el usuario pierde la conexión a internet 10 segundos antes de darle a "Guardar"? Vuestra comprobación de los 5 minutos dirá que todo está OK, pero la petición de guardado fallará por timeout o red. No tenéis Auto-save en LocalStorage ni recuperación de borradores. Si la red cae, el trabajo se pierde.
Drenaje de batería/recursos: Tenéis un temporizador global corriendo por cada entidad abierta. Multiplica eso por un usuario con 10 pestañas. Habéis creado un generador de tráfico innecesario al backend.
2. El "Batching" de Juguete en el Frontend
Habéis implementado un bucle con un setTimeout de 100ms en el cliente para simular batching. Esto es una aberración.

Integridad parcial: Si el lote es de 500 y falla en el item 205 (por un 401, un 500 o cierre de pestaña), habéis dejado la base de datos en un estado inconsistente. ¿Dónde está el Revert o la Transacción Atómica Global para el lote?
User Experience atroz: El usuario tiene que quedarse mirando una barrita de progreso mientras el navegador hace 10 peticiones secuenciales. Si cierra el navegador, el proceso se corta a la mitad. El batching SE HACE EN EL BACKEND con una sola petición y un worker.
3. Optimistic Locking de "Cartón-Piedra"
Habéis añadido modified_at al WHERE del UPDATE. Bien.

El agujero: ¿Cómo manejáis las sub-entidades (tags, efectos, traducciones)? Si yo cambio solo un Tag de una carta, ¿se actualiza el modified_at de la tabla principal? Si la respuesta es NO (y vuestro esquema sugiere que no siempre), entonces el bloqueo optimista no sirve para nada en el 50% de las ediciones.
Relaciones Fantasma: Si alguien borra un Tag mientras otro lo está asignando a una carta, vuestro translatableUpsert va a escupir un error de Foreign Key que el frontend no sabe manejar con elegancia.
⚠️ Casos Extremos que os van a explotar (de verdad)
🟦 1. La Carrera de Ratas en las Traducciones
Tenéis lógica de fallback en el backend. ¿Qué pasa si el editor A borra la traducción al inglés (base) mientras el editor B está guardando la traducción al francés?

Riesgo: deleteLocalizedEntity podría borrar la base y dejar a B intentando insertar una traducción para una entidad que ya no existe (id huérfano antes de que termine la transacción de B).
🟦 2. El "JSON Bloat" en card_effects
Usáis jsonb para metadatos y efectos.

Caso extremo: Un usuario mete un JSON de 2MB (porque puede). Vuestro backend lo lee, lo parsea, lo valida con Zod y lo guarda.
Resultado: Habéis bloqueado el Event Loop de Node.js durante 200ms parseando strings gigantes. Repite esto 5 veces por segundo y la app deja de responder. No hay límites de tamaño en los payloads JSON.
🟦 3. El "Zod Introspection" ha muerto, pero el acoplamiento sigue vivo
Habéis quitado la introspección mágica de Zod en los formularios, pero ahora obligáis a pasar los campos a mano en los presets.

Riesgo: Si el esquema de la DB cambia (ej: una columna pasa de opcional a obligatoria) y os olvidáis de actualizar el preset del frontend, el formulario enviará datos "válidos" según el front que el backend rechazará. No hay Contratos de Tipos Compartidos (tRPC o similar), solo fe en que el equipo se acuerde de actualizar ambos sitios.
🟦 4. Hydration Hell con Idiomas Dinámicos
Si el usuario tiene el navegador en francés pero la app carga en español por defecto y luego cambia...

Riesgo: El ClientOnly que habéis puesto en EntityViewsManager es la confesión de vuestra derrota. Estáis matando el SEO y el rendimiento de carga inicial porque no sabéis manejar el estado de los filtros en el servidor sin que explote la hidratación.

---

Me pongo el sombrero de desarrollador senior amargado que ha visto demasiados proyectos "modernos" colapsar bajo su propio peso. Aquí tienes mi revisión ácida de **Tarot2**, enfocada en lo que me da pesadillas y los casos extremos que probablemente estás ignorando.

# # Informe de "Basura Técnica" - Tarot2

## 1. El "Dios Composable": `useEntityBaseContext.ts`
Es un punto único de fallo catastrófico. Has movido la lógica de un "God Component" (`EntityBase.vue`) a un "God Composable". 
- **Crítica:** Si ese archivo falla o se corrompe, toda la gestión de entidades (Arcana, Skills, etc.) muere. La reactividad ahí dentro debe ser un nido de avispas.
- **Caso extremo:** ¿Qué pasa si un usuario abre dos pestañas de edición de entidades diferentes? ¿Hay colisiones de estado en el `provide/inject` si no se limpian correctamente los contextos?

## 2. Dependencia de "Magia" en `FormModal.vue`
Incluso si has empezado a quitar la introspección de Zod, la arquitectura de formularios sigue siendo frágil.
- **Crítica:** Confiar en que los `presets` pasen exactamente lo que el backend espera es un acto de fe, no de ingeniería.
- **Caso extremo:** **Race conditions en el autocompletado.** Si un preset carga opciones de un endpoint y el usuario cierra el modal antes de que lleguen, ¿hay fugas de memoria o errores de "unmounted component" intentando actualizar estado inexistente?

## 3. El Abismo de las Traducciones (`_translations`)
Tu sistema de traducción en el backend parece un "pactar con el diablo".
- **Crítica:** `translatableUpsert.ts` es probablemente el código más peligroso que tienes. Un error en el mapeo de `entity_id` y acabas inyectando textos de una Skill en una Arcana.
- **Caso extremo:** **Idiomas incompletos.** Si una entidad tiene 5 campos traducibles y el usuario solo edita 2 en "ES", ¿qué pasa con los otros 3? ¿Heredan de "EN" o se quedan `null` rompiendo la UI que espera strings?

## 4. La Mentira del "SSR Safe"
Dices que es SSR Safe, pero usas `localStorage` y eventos de ventana en la mitad de los composables.
- **Crítica:** Nuxt 4 es estricto. Cualquier `useTableSelection` que toque el DOM o el `window` antes del `onMounted` va a escupir warnings de hidratación que ignoras sistemáticamente.
- **Caso extremo:** Un bot de búsqueda (Google) entrando en una ruta de `Manage`. Si tu middleware de auth o tus filtros no manejan el estado de carga inicial en servidor, el bot verá una página rota o un bucle de redirecciones.

## 5. El "N+1" Disfrazado en `eagerTags.ts`
Has hecho un parche para los tags, pero ¿qué pasa con las relaciones profundas?
- **Crítica:** Si `world_card` tiene overrides que dependen de `world` que a su vez depende de `arcana`, tu "batch fetching" se queda corto.
- **Caso extremo:** **Bulk Actions masivas.** Seleccionas 100 entidades y pides un cambio. Tu `createCrudHandlers` probablemente intenta procesarlas en un bucle que bloquea el event loop de Node, o satura el pool de conexiones de Postgres.

## 6. Seguridad de "Capa de Papel"
Confías ciegamente en `01.auth.guard.ts`.
- **Crítica:** La validación de permisos (`can.ts`) es solo visual en el frontend. Si no has blindado CADA endpoint en `server/api` con chequeos de roles específicos para esa entidad, un usuario con un JWT válido puede hacer un `DELETE` manual a `/api/arcana/1`.
- **Caso extremo:** **Escalada de privilegios vía JSON payload.** ¿El backend filtra los campos que el usuario NO debería poder editar (como `owner_id` o `created_at`) o simplemente hace un spread del `body` en el `update` de Kysely?

## 7. Casos Extremos "Invisibles"
- **Z-Index Wars:** Tienes `UModal`, `USlideover` y `EntityInspectorDrawer`. ¿Qué pasa si el Drawer abre un Modal de confirmación y este a su vez un Tooltip? ¿Está el focus trap preparado para no volverse loco?
- **Validación de Enums:** Si en la DB cambias un valor de `card_status`, tu frontend (Zod) se romperá silenciosamente hasta que alguien intente editar una carta vieja. No tienes un contrato de sincronización real entre la DB y los esquemas TS.
- **I18n Keys perdidas:** Tienes scripts para buscar llaves faltantes, pero no para buscar llaves **huérfanas**. Tu archivo de traducciones debe estar lleno de basura de hace 6 meses.

**¿Quieres que audite algún archivo específico para humillar a su autor (posiblemente tú) o prefieres que ataque una de estas áreas primero?**