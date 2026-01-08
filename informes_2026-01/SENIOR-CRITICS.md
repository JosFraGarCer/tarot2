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

### 1. �️ Authentication & Security: "Security by Optimism"
- **✅ [SOLUCIONADO 2026-01-08] The Guard is a Sieve:** `01.auth.guard.ts` ahora utiliza lógica robusta basada en prefijos y normalización a minúsculas (`.toLowerCase()`). Esto evita bypasses mediante variaciones de capitalización o sub-rutas no autorizadas en endpoints públicos.
- **✅ [SOLUCIONADO 2026-01-07] The DB Hammer:** Your [00.auth.hydrate.ts](cci:7://file:///home/bulu/devel/tarot2/server/middleware/00.auth.hydrate.ts:0:0-0:0) middleware is doing a full `LEFT JOIN` on `users`, `user_roles`, and `roles` with a `json_agg`... **on every single request**. You're DDOSing your own database just to know if a user is "active". Ever heard of Redis? Or just putting the roles in the JWT? 
  - *Nota: Corregido. Ahora se realiza una query ligera inicial y carga perezosa de roles.*
- **✅ [SOLUCIONADO 2026-01-07] The JWT Secret Leak:** In [plugins/auth.ts](cci:7://file:///home/bulu/devel/tarot2/server/plugins/auth.ts:0:0-0:0), [secretKey()](cci:1://file:///home/bulu/devel/tarot2/server/plugins/auth.ts:16:0-22:1) reads `process.env.JWT_SECRET` and encodes it **every single time** it's called. It's a synchronous `TextEncoder` call and a syscall in the middle of your hot path. 
  - *Nota: Corregido. La codificación del secreto se realiza una sola vez a nivel de módulo.*

### 2. 🌀 State Management: [useQuerySync](app/composables/common/useQuerySync.ts) is a Performance Black Hole
- **✅ [SOLUCIONADO 2026-01-07] Deep Clone Mania:** Your [useQuerySync.ts](cci:7://file:///home/bulu/devel/tarot2/app/composables/common/useQuerySync.ts:0:0-0:0) is deep-cloning everything on every change using `JSON.parse(JSON.stringify())` as a fallback. On a large state object, this is going to make the UI feel like it's running through molasses.
  - *Nota: Corregido. Se ha implementado un `deepClone` eficiente y se han eliminado clones innecesarios.*
- **✅ [SOLUCIONADO 2026-01-08] Reactivity Loops:** Refactorizado para usar una sincronización bidireccional basada en serialización estable. Se eliminaron los bucles de reactividad entre el estado y la URL.
- **✅ [SOLUCIONADO 2026-01-08] The "Back Button" Ghost:** Se implementó `flush: 'sync'` en el observador de la ruta para garantizar que el estado interno se actualice inmediatamente, evitando inconsistencias visuales durante las transiciones del router.

### 3. 🛠️ The "Universal" CRUD Handler is a Trap
- **The `any` Problem:** [server/api/arcana/_crud.ts](cci:7://file:///home/bulu/devel/tarot2/server/api/arcana/_crud.ts:0:0-0:0) uses `// eslint-disable-next-line @typescript-eslint/no-explicit-any` for the query builder. You’ve successfully bypassed the entire point of using Kysely and TypeScript. If I change a column name in the DB, the compiler won't tell me. I’ll just get a runtime error when the user opens the page.
- **✅ [SOLUCIONADO 2026-01-07] Subquery Hell:** Every row in your list view triggers a subquery for tags. If you have 100 rows, that’s a massive JSON aggregation overhead on the DB. This won't scale past a few dozen entries before the "Time to First Byte" starts climbing into the seconds.
  - *Nota: Corregido mediante la implementación de `eagerTags.ts` para batch fetching de tags.*

### 4. 🧪 Testing: "I wrote a test, so it works"
- **Manage-arcana.spec.ts:** This test is so shallow it's practically two-dimensional. 
  - `expect(columns).toHaveCount(1)`? You're checking if the table has *one* column? What happened to the other 5 you defined in the "Bridge"? 
  - You’re using `page.waitForLoadState('networkidle')`. This is flaky as hell. One rogue analytics pixel or slow CSS file and your tests timeout for no reason. 
  - You aren't testing the actual data—just that "something" appeared. This is "Structure Testing", not "Functional Testing".

### 5. 🌍 Translations: The "Lazy Localization" Strategy
- **Fallback logic:** In [arcana/_crud.ts](cci:7://file:///home/bulu/devel/tarot2/server/api/arcana/_crud.ts:0:0-0:0), you’re doing `sql`coalesce(t_req.name, t_en.name)``. This means if a translation is missing, the user gets English. Fine. But you don't show the user *that* it's a fallback in the UI effectively until they open the form. The list view is a mix of languages with no visual indication of "this needs translation".

---

### 💀 Edge Cases You're Missing (The "Real World" Edition)
1.  **✅ [SOLUCIONADO 2026-01-08] The "Slow DB" Freeze:** Añadidos `statement_timeout` y `query_timeout` (10s) en la configuración del pool de PostgreSQL (`server/plugins/db.ts`) para evitar bloqueos indefinidos del proceso.
2.  **Image Upload Zombies:** [FormModal.vue](cci:7://file:///home/bulu/devel/tarot2/app/components/manage/modal/FormModal.vue:0:0-0:0) handles image uploads. If a user uploads a 10MB 4K PNG, do you resize it? No. You just shove it into `/public/img/`. You're going to run out of disk space and bandwidth in a week.
3.  **✅ [SOLUCIONADO 2026-01-08] Role Escalation:** La lógica de `mergePermissions` (`server/utils/users.ts`) ahora implementa una estrategia de resolución de conflictos donde un permiso explícito en `false` (Deny) tiene prioridad sobre `true` (Allow).
4.  **✅ [SOLUCIONADO 2026-01-08] The "Back Button" Ghost:** (Movido a la sección de State Management)

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
- **✅ [SOLUCIONADO 2026-01-07] The Sin:** You're mapping entities to rows in the frontend (`mapEntitiesToRows`). Why? The backend should send exactly what the UI needs. Now we have mapping logic duplicated or at least fragmented across the app.
  - *Nota: Corregido. Se ha unificado la lógica de mapeo y se ha optimizado la respuesta del backend para minimizar transformaciones pesadas en el cliente.*
- **Complexity:** `ManageTableBridge` -> `CommonDataTable` -> `UTable`. It's a nesting doll of props. If I want to change how a single cell renders in a specific entity table, I have to pass a slot through three layers of "Bridges".

### 2. 🧪 The "Zod-to-UI" Magic is Brittle
- **✅ [SOLUCIONADO 2026-01-07] Brittleness:** You're relying on naming conventions (`arcana_id`) to decide it's a select menu. If someone names a field `target_arcana_id_override`, your "magic" breaks and you get a text input for a Foreign Key. Enjoy the DB errors.
  - *Nota: Corregido. Se ha eliminado la inferencia mágica por nombre. Ahora los campos se definen explícitamente en los presets de formulario.*
- **The Edge Case:** What happens when a Zod schema uses `.refine()` or `.transform()`? Your unwrap function and heuristic-based relation detection will fall flat on its face.

### 3. 🌍 i18n is a Minesweeper Game
- **✅ [SOLUCIONADO 2026-01-08] Fallback Logic:** Corregido. Se han eliminado los fallbacks hardcodeados en los componentes y se ha migrado al uso de claves globales de i18n ya traducidas en los locales.
- **✅ [SOLUCIONADO 2026-01-08] Hardcoded Strings:** Corregido. Claves como `ui.table.densityLabel` ahora están correctamente mapeadas en `es.json` y `en.json`, eliminando strings literales del código.

### 4. 🕳️ The "CRUD Handler" Black Box
- **✅ [SOLUCIONADO 2026-01-07] Performance:** Your `buildSelect` in `arcana/_crud.ts` is doing subqueries for tags inside a list view. On a table with 100 rows, that's 100 subqueries if not properly optimized by the DB engine. You're begging for a N+1 problem.
  - *Nota: Corregido. Implementado `fetchTagsForEntities` para carga por lotes (Eager Loading).*
- **✅ [SOLUCIONADO 2026-01-08] Empty States:** Corregido. Se ha rediseñado el Empty State en `EntityViewsManager.vue` para ser informativo, diferenciando entre tabla vacía, resultados filtrados (con botón de reset) y errores de API (con botón de reintento).
- **✅ [SOLUCIONADO 2026-01-08] The Risk:** It handles list, create, detail, update, and remove in one go. If one entity needs a slightly different `POST` flow (e.g., triggering a webhook or secondary insert), you're forced to either break the pattern or bloat the handler with "hooks" and "interceptors".
  - *Nota: Corregido. Se han implementado hooks `before/after` en `createCrudHandlers.ts` para inyectar lógica personalizada en cada paso del ciclo de vida.*

### 5. 📋 Manual QA Checklist (The "Fix This or Don't Commit" List)
- [x] **✅ [SOLUCIONADO 2026-01-08] Data Loss:** Open a `FormModal`, type something, click outside. If it closes without a prompt, fix it.
  - *Nota: Corregido. Implementado aviso de "Cambios no guardados" en FormModal.vue mediante comparación de estado reactivo.*
- [x] **✅ [SOLUCIONADO 2026-01-08] Race Conditions:** Open two tabs, edit the same entity. See if the second save fails or just overwrites.
  - *Nota: Corregido. Implementado bloqueo optimista real basado en `modified_at` en todas las entidades CRUD y validado en el backend.*
- [x] **✅ [SOLUCIONADO 2026-01-08] Zod Failures:** Add a `.refine()` to `arcanaCreateSchema`. Watch the `FormModal` crash or ignore the validation.
  - *Nota: Corregido. Se ha implementado soporte robusto para validaciones complejas de Zod en `useEntityBaseContext.ts`, capturando errores de `refine/transform` antes del envío y manejando de forma segura payloads indefinidos.*
- [x] **✅ [SOLUCIONADO 2026-01-08] N+1 Audit:** Check the query logs for the Arcana list. If I see 50 queries for one page, you're refactoring it.
  - *Nota: Corregido. Todas las entidades principales utilizan ahora `fetchTagsForEntities` para carga por lotes (Eager Loading).*

**Verdict:** It's a "Golden Path" app. It works if you're a perfect user who never makes mistakes. For everyone else, it's a minefield.

---
**Task Status:**
- **Scan core architectural components:** Completed.
- **Audit backend CRUD patterns:** Completed.
- **Check for legacy components:** Completed.
- **Evaluate error handling:** Completed.
- **Review i18n:** Completed.
- **Identify performance bottlenecks:** Completed.

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

1. **✅ [SOLUCIONADO 2026-01-07] Falsa Sensación de Seguridad en useEntityBaseContext.ts**
  - *Nota: Corregido. Implementada comprobación periódica de sesión.*
2. **✅ [SOLUCIONADO 2026-01-07] El "Batching" de Juguete en el Frontend**
  - *Nota: Corregido. Ahora se usa `useBatchMutation` que maneja las peticiones de forma robusta.*
3. **✅ [SOLUCIONADO 2026-01-07] Optimistic Locking de "Cartón-Piedra"**
  - *Nota: Corregido. Se ha implementado un sistema de bloqueo real comparando `modified_at`.*

  
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
- **Detección de colisiones:** Aunque usas `provide/inject` con Symbols únicos por instancia de `EntityBase`, la dependencia de estados globales compartidos en otros composables hijos puede causar efectos colaterales si no se limpian los watchers al unmount.

## 2. Dependencia de "Magia" en `FormModal.vue`
La arquitectura de formularios sigue siendo frágil.
- **Crítica:** Confiar en que los `presets` pasen exactamente lo que el backend espera es un acto de fe, no de ingeniería.
- **Caso extremo:** **Falta de aviso de cambios sin guardar.** Si un usuario cierra el modal por error (click fuera o ESC), pierde todo el progreso. No hay un "Unsaved Changes" guard que prevenga la pérdida de datos.

## 3. El Abismo de las Traducciones (`_translations`)
Tu sistema de traducción en el backend es un campo de minas.
- **Crítica:** `translatableUpsert.ts` es un código complejo que maneja múltiples estados. Un error en las transacciones y la integridad de los datos desaparece.
- **Caso extremo:** **Carreras de edición.** Aunque has añadido `modified_at` para el bloqueo optimista en la tabla base, las traducciones se guardan en una transacción separada o posterior que podría pisar cambios parciales si no se bloquea la fila de la traducción específicamente.

## 4. La Mentira del "SSR Safe"
- **Crítica:** Aunque usas `import.meta.client` para proteger `localStorage`, el diseño de la app sigue dependiendo de que el cliente "parchee" el estado inicial del servidor.
- **Caso extremo:** **SEO y Bots.** Un bot verá la vista por defecto ('tarjeta') aunque el usuario prefiera 'tabla'. Si los metadatos o el contenido dependen de esta preferencia, el SEO será inconsistente.

## 5. El "N+1" Disfrazado en `eagerTags.ts`
Has hecho un parche para los tags, pero ¿qué pasa con las relaciones profundas?
- **Crítica:** Si `world_card` tiene overrides que dependen de `world` que a su vez depende de `arcana`, tu "batch fetching" se queda corto.
- **Caso extremo:** **Saturación del pool de conexiones.** En operaciones masivas, el batching actual sigue lanzando múltiples queries secuenciales que pueden agotar las conexiones disponibles si hay picos de tráfico.

## 6. Seguridad de "Capa de Papel"
- **✅ [SOLUCIONADO 2026-01-08] RBAC Robusto:** Corregido. Se ha refactorizado `01.auth.guard.ts` para incluir validación de propiedad (Ownership). Los usuarios ya no pueden manipular IDs de otros usuarios vía API (protección contra IDOR), restringiendo el acceso solo a su propio perfil a menos que sean administradores.

## 7. Casos Extremos "Invisibles"
- **✅ [SOLUCIONADO 2026-01-08] Z-Index Wars:** Corregido. Se ha estandarizado el uso de overlays mediante `USlideover` para inspección y edición compleja, y `UModal` para confirmaciones simples, respetando la jerarquía de capas de Nuxt UI y evitando colisiones de focus trap.
- **✅ [SOLUCIONADO 2026-01-08] Validación de Enums:** Corregido. Se ha implementado `scripts/check-enum-sync.mjs` para garantizar que los esquemas Zod del frontend y servidor estén siempre sincronizados con los tipos generados por la base de datos (Kysely), previniendo errores de runtime por desajustes de dominio.
- **✅ [SOLUCIONADO 2026-01-08] I18n Keys huérfanas:** Corregido. Se ha implementado `scripts/find-orphan-i18n.mjs` para detectar automáticamente llaves de traducción que ya no se usan en el código.
- **✅ [SOLUCIONADO 2026-01-08] I18n Keys faltantes:** Corregido. Se ha implementado `scripts/find-missing-i18n.mjs` para detectar llaves usadas en el código que no están presentes en `en.json` o `es.json`, garantizando una cobertura completa de traducciones.

**¿Quieres que audite algún archivo específico para humillar a su autor (posiblemente tú) o prefieres que ataque una de estas áreas primero?**