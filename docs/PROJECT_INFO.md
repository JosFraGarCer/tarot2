# Tarot
Tarot es el nombre en clave para sistema universal de juego de rol mediante cartas

Nuestro proyecto es la gestion y desarrollo de una app para la creación gestion de cartas.
Estamos en las fases temprana de desarrollo donde aun estamos estableciendo las bases tanto de la aplicación como del sistema de juego Tarot

## La aplicación
La aplicación usa Nuxt 4 en su ultima version, NuxtUI 4 (en su ultima version), Pinia y pinia colada, TailwindCSS, i18n, zod y kysely con Postgres.
Buscamos un buen tipado, una base de datos eficiente, una API optimizada y un codigo limpio, optimizado y sin duplicación de codigo inutil.
Para su desarollo usamos el gestor pnpm


## Multi-idioma
EL juego y la app manejaran varios idiomas, lo hara con tablas de traduccion con sufijo '_translations' y la app con i18n
Al crear datos en la base de datos, el idioma por defecto será inglés. Al editar se usara el idioma actual que tenga la aplicación web

### Idiomas en la base de datos
API y las tablas manejadas en /manage tienen idioma. 
En /manage en creacion SIEMPRE sera el idioma ingles. En edición cuando la pagina esta en un idioma distinto de EN mostrara como referencia el valor en ingles pero el campo de edicion será en el idioma actual seleccionado de la pagina.
Cuando usamos el icono de borrar si estamos en un idioma diferente a EN y tiene campos con valor en el idioma actual ofrecera eliminar la traduccion. Si no hay ningun campo traducido de ingles Ofrecera borrar el objeto con todas sus traducciones. Si estamos con la pagina en idioma ingles Ofrecera borrar el objeto con todas sus traducciones



## Universal
El juego esta planteado para adaptar diversos universo de juego. Como historico (Roma, Edad Media, etc.) o fantasis (Kult, Paranoia, Rueda del tiempo)

## Fases
Primero crearemos y perfeccionaremos una base de datos basico (Postgres), migraciones, API, composables y paginas y componentes para empezar una gestión basica del sistema de juego.

Cuando tengamos una minima base crearemos los componentes de carta para mostrarlas. Tambien mejoraremos la gestion para los tipos de cartas y sus peculiaridades.

## Base de datos
Es un postgres que conectamos con kisely. Tenemos una la tabla world y las cartas base, las cartas base tendran el prefijo base_ 
Todas las traduccion tendran como minimo estos campos: name, code, short_text, description.

## Breve explicación del sistema Tarot
Tarot es un sistema de juego de rol universal diseñado para ser adaptable a múltiples mundos

### ¿Mundos?
Si, poderemos gestionar nuestro propio set de cartas para añadir mundos de fantasia o ambientaciones. De momento tenemos creado la coleccion World pero world_cards podremos hacer nuestro propio set de cartas.
EN PROYECTO: Primero hemos de terminar la base de gestion y base de sistema. Proximamente lo añadiremos.


### Los Arcanos y sus Facetas

Los atributos del personaje se organizan en **tres Arcanos**, cada uno conteniendo tres Facetas específicas.

#### Arcano Físico

Representa el cuerpo, la materia y la acción directa.

- **Fuerza**: Potencia bruta, capacidad de carga, daño cuerpo a cuerpo
- **Agilidad**: Destreza, reflejos, sigilo, puntería
- **Vigor**: Resistencia, salud, aguante, fortaleza física

#### Arcano Mental

Representa la mente, la lógica y el conocimiento acumulado.

- **Ingenio**: Lógica, memoria, análisis, conocimiento técnico
- **Percepción**: Astucia, observación, leer intenciones, detectar engaños
- **Erudición**: Conocimiento cultural, histórico, lingüístico, académico

#### Arcano Espiritual

Representa el espíritu, la voluntad y la fuerza interior.

- **Voluntad**: Disciplina, concentración, resistencia mental
- **Carisma**: Liderazgo, elocuencia, magnetismo personal
- **Alma**: Fuerza vital, intuición, conexión con lo intangible

### Distribución de Puntos

#### Asignación Base

Distribuye **9 puntos totales** entre los tres Arcanos:

- **Arcano Primario**: 5 puntos
- **Arcano Secundario**: 3 puntos
- **Arcano Menor**: 1 punto

#### Creación de un personaje

EN PROYECTO: Proximamente, primero sentaremos las bases del sistema.

Un personaje se construye a partir de cinco cartas conceptuales que definen completamente su identidad mecánica y narrativa. Cada carta responde a una pregunta fundamental sobre el personaje y otorga beneficios específicos.

**Linaje** responde a la pregunta "QUÉ ERES" y representa la herencia biológica, cultural o artificial del personaje. Esta carta otorga un bonus de +1 a una Faceta específica y una habilidad pasiva que refleja la naturaleza inherente del personaje.

**Entorno** responde a "DÓNDE TE CRIASTE" y define la sociedad, geografía y cultura formativa del personaje. Proporciona un Umbral de Competencia en una habilidad no combativa que refleja la familiaridad del personaje con su entorno de origen.

**Trasfondo** responde a "QUÉ TE OCURRIÓ" y representa un evento capital y definitorio del pasado del personaje. Esta carta otorga una habilidad situacional potente y sirve como gancho argumental para el Director de Juego.

**Ocupación** responde a "QUÉ HACES AHORA" y define la profesión, rol o "clase" del personaje. Determina la Base de Aguante, otorga +1 a una Faceta relevante y proporciona habilidades activas relacionadas con el trabajo del personaje.

**Potencia** responde a "EN QUÉ CREES" y representa la fuerza superior, ideal o poder que influye en el personaje. Esta carta introduce el sistema de Devoción y las Intervenciones, permitiendo al personaje canalizar su fe o convicción en momentos críticos.


## Adapcion de Tarot a la App

Hemos creado la pagina /manage para empeza a crear mundos y cartas base y los tipos de carta. El proximo paso es añadir tablas de arcanos y facetas en la base de datos para gestionarlo tambien en /manage

### Gestión de cartas

Despues deberiamos hacer las cartas base y añadir tablas para enlazar con las ventajas que pueden otorgar. Estamos en estudio de como diseñar la base de datos para estos fines.

#### Ejemplos de cartas
El pruebas/cards/worlds tenemos varias universos con diseño preliminares de cartas

### Paginas de la APP
De momentos tenemos desarrollado /admin, /manage y /deck
En un futuro se añadira gestion de mundos y personajes, y plantillas para las cartas.

#### Admin
solo pueden acceder los administradores excepto en feedback que lo hara tambien el staff para resolver feeback como incidencias, etc.

#### Manage
Gestion para creacion, edicion y traduccion de cartas

#### Deck
Para la visualizacion de las cartas


## Arquitectura y stack (resumen derivado de /docs)

- Backend: Nuxt 4 (H3/Nitro) + PostgreSQL vía Kysely (tipado) + JWT (jose) + Pino (logger).
- Base URL API: `/api`. Respuestas normalizadas: `{ success, data, meta? }`.
- Cliente: `useApiFetch` con ETag/If-None-Match y cache 304, SSR para listados críticos.
- Módulos API por entidad: `world`, `world_card`, `arcana`, `base_card`, `card_type`, `skill`, `facet`, `tag`, además de `user`, `role`, `uploads`, `database`, `content_feedback`, `content_revisions`, `content_versions`.

## Seguridad y autenticación

- Login `POST /api/auth/login` → cookie `auth_token` HttpOnly. Middleware `00.auth.hydrate` carga usuario/roles/permissions; `01.auth.guard` protege `/api/*` (excepto login/logout).
- Nota SECURITY: `POST /api/auth/logout` existe, pero no limpia la cookie todavía; recomendado añadir `setCookie(..., maxAge:0)`.

## Esquema y versionado de contenido

- `content_versions` incluye `version_semver`, `description`, `metadata`, `release` (`dev|alfa|beta|candidate|release|revision`).
- Varias tablas referencian versiones (`content_version_id`/`version_id`) y comparten `status` (`card_status`) e `is_active`.
- Internacionalización: tablas `<entidad>_translations` con `language_code` y fallback a `'en'` en las consultas.
- Borrado por idioma: si `lang==='en'` se elimina la entidad y sus traducciones; en otro caso, sólo la traducción.

## Sistema de efectos (Effect System 2.0)

- Catálogos: `effect_type` y `effect_target` (+ traducciones). Instancias: `card_effects` con jerarquía (parent_id), `value/formula`, `scope`, `duration` y metadatos.
- Modo narrativo (legacy): campos `legacy_effects` (bool) y `effects` (JSONB por idioma) en entidades como `base_card`, `world_card`, `base_skills`, `facet`.
- UI: alterna entre modo legacy (Markdown) y semántico (estructurado) según `legacy_effects`.

## Tags y filtros

- Vínculos en `tag_links` por `entity_type` (`arcana|facet|base_card|base_card_type|world|world_card|base_skills`).
- Documentación presenta diferencias: SERVER.md describe filtros de tags en modo AND; algunos endpoints actuales (p.ej. base_card) aplican OR (ANY). Se recomienda alinear (decidir y estandarizar: AND o OR) y actualizar docs/código en conjunto.

## Rutas y convenciones

- Usuarios: el backend implementa `/api/user/*` (singular). Parte de la documentación antigua menciona `/api/users/*` (plural). Recomendado unificar a singular y/o ofrecer alias temporal.
- Endpoints especiales: `uploads` (imágenes optimizadas AVIF), `database` (export/import JSON/SQL), `content_feedback` (comentarios editoriales), `content_revisions` (historial y diffs), `content_versions` (releases) con `release`.

## Alineaciones pendientes

- Implementar `POST /api/content_versions/publish` (publicación de revisiones aprobadas) y `POST /api/content_revisions/:id/revert` (revert de revisión); la UI los referencia.
- Unificar semántica de filtros de tags (AND vs OR) y actualizar documentación/consultas.
- Corregir referencias antiguas a `/api/users` → `/api/user`.
- Adoptar `useApiFetch` en GETs de admin para aprovechar ETag/304 de forma consistente.

## Próximos pasos

- Consolidar editor de cartas con integración del sistema de efectos (semántico/legacy).
- Completar endpoints de publicación/revert y la UX de versiones.
- Añadir rate limiting básico (SECURITY) y pulir logout para limpiar cookie.
