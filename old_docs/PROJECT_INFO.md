# Tarot2 – Resumen del proyecto
Tarot2 es el sistema interno para administrar el universo de cartas, mundos y reglas del juego Tarot. Esta documentación resume la arquitectura actual (Nuxt 4 + PostgreSQL), las entidades gestionadas, el flujo editorial y las reglas operativas vigentes. Consulte también `docs/ARCHITECTURE_GUIDE.md` para pautas tácticas y los informes en `/informes` para contexto estratégico.


## 0. Breve explicación del sistema Tarot
Tarot es un sistema de juego de rol universal diseñado para ser adaptable a múltiples mundos

### ¿Mundos?
Si, poderemos gestionar nuestro propio set de cartas para añadir mundos de fantasia o ambientaciones. De momento tenemos creado la coleccion World pero world_cards podremos hacer nuestro propio set de cartas.
Estado: la base de gestión está operativa; seguimos ampliando contenido y automatizaciones de versiones.


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

## 1. Stack y principios
- **Frontend**: Nuxt 4 + Nuxt UI 4 + TailwindCSS + Pinia Colada. Los listados usan `CommonDataTable` y bridges Manage/Admin.@app/components/common/CommonDataTable.vue#1-127
- **Backend**: Nuxt 4/H3 con Kysely tipado + helpers `createCrudHandlers`, `buildFilters`, `translatableUpsert` y `deleteLocalizedEntity` para CRUD homogéneo.@server/utils/createCrudHandlers.ts#1-240
- **Autenticación**: JWT via `server/plugins/auth.ts`; middleware `00.auth.hydrate`, `01.auth.guard`, `02.rate-limit`.@server/plugins/auth.ts#1-210@server/middleware/02.rate-limit.ts#1-140
- **Internacionalización**: i18n locales (`en`, `es`) y tablas `_translations` con fallback EN marcado por `markLanguageFallback` en respuestas.@server/utils/response.ts#65-95
- **Contenido versionado**: casi todas las entidades enlazan con `content_versions` y guardan `status` (`card_status`) e `is_active`.@docs/SCHEMA POSTGRES..TXT#417-437

## 2. Mapa funcional de la app
- `/manage` — orquestado por `ManageEntity` (`EntityBase.vue`), incluye filtros dinámicos, bulk actions y previews via `EntityInspectorDrawer` para: `card_type`, `base_card`, `world`, `arcana`, `facet`, `skill`, `tag`.@app/pages/manage.vue#1-186
- `/admin` — paneles específicos: versiones, revisiones, feedback, usuarios, roles, import/export. Utiliza `AdminTableBridge` y modales especializados.@app/components/admin/RevisionsTable.vue#1-320
- `/deck` — visualización pública en construcción; usa `EntityCard` + `EntitySummary`.
- `/login` — autenticación; consume `/api/auth/login` con rate limiting y limpieza de cookie en logout.@server/api/auth/logout.post.ts#1-70

## 3. Entidades gestionadas
| Entidad | Tablas principales | Campos clave | Relacionada con |
| --- | --- | --- | --- |
| `world` | `world`, `world_translations`, `tag_links` | `status`, `is_active`, `content_version_id`, `metadata` | `world_card` | 
| `arcana` | `arcana`, `arcana_translations`, `tag_links` | `status`, `is_active`, `sort`, `metadata` | `facet`, `skill` |
| `facet` | `facet`, `facet_translations`, `tag_links` | `legacy_effects`, `effects`, `content_version_id` | `skill`, `card_effects` |
| `base_card` | `base_card`, `base_card_translations`, `card_effects`, `tag_links` | `card_family`, `legacy_effects`, `effects` | `world_card` |
| `world_card` | `world_card`, `world_card_translations`, `card_effects`, `tag_links` | overrides por mundo, `legacy_effects` | `base_card` |
| `base_skills` | `base_skills`, `base_skills_translations`, `card_effects`, `tag_links` | habilidades base vinculadas a facets | `facet` |
| `card_type` | `base_card_type`, `base_card_type_translations` | catálogos madre de cartas | `base_card` |
| `content_versions` | releases editoriales | `version_semver`, `release`, `metadata` | `content_revisions`, entidades `content_version_id` |
| `content_revisions` | historial incremental | `diff`, `prev_snapshot`, `next_snapshot`, `version_number`, `status` | `content_versions`, entidades CRUD |
| `content_feedback` | comentarios QA | `status`, `version_number`, `language_code` | Manage/Admin feedback |
| `tags` | `tags`, `tags_translations`, `tag_links` | jerarquías y categorías | Todos los listados |
| `users` / `roles` | auth/admin | `permissions` JSONB (roles), `status` (`user_status`) | middleware auth |

> Véase `docs/SCHEMA POSTGRES..TXT` como fuente de verdad del esquema y `server/database/types.ts` para tipos generados Kysely.@server/database/types.ts#1-240

## 4. Internacionalización y UX
- Formularios (`FormModal.vue`) muestran valores EN cuando se edita otro idioma y permiten borrar traducciones sin eliminar la entidad EN.@app/components/manage/modal/FormModal.vue#1-400
- La API devuelve `language_code_resolved` y `language_is_fallback` para que la UI muestre badges y promueva traducciones pendientes.
- En `/manage`, los filtros (`ManageEntityFilters.vue`) exponen `lang`, tags y capacidades basadas en `useEntityCapabilities`.@app/components/manage/ManageEntityFilters.vue#1-260
- `EntityInspectorDrawer` y `StatusBadge` reflejan `status`, `release_stage` y cobertura de traducciones.

## 5. Sistema de efectos
- **Semántico** (`card_effects`) integra catálogos `effect_type`, `effect_target` y soporta jerarquía (`parent_id`), plantillas y validación mediante campos `scope`, `validation_state`, `effect_group`.
- **Legacy** (`effects` JSONB + `legacy_effects`) conserva narrativa por idioma; se usa en cartas, facetas, habilidades y overrides.
- Documentación detallada en `docs/effect-system.md`. El editor UI alterna entre ambos modos según `legacy_effects`.

## 6. Flujo editorial
1. **Creación/edición** desde `/manage` → `useEntity` sincroniza filtros, paginación y payload con Zod schemas específicos.@app/composables/manage/useEntity.ts#1-200
2. **Revisiones** (`content_revisions`) registran `diff`, snapshots y `language_code`; pueden revertirse desde `/admin/revisions`.
3. **Versiones** (`content_versions`) publican lotes mediante `/api/content_versions/publish`, marcando entidades con `content_version_id` y `status` `published` cuando aplica.@server/api/content_versions/publish.post.ts#1-200
4. **Feedback** (`content_feedback`) centraliza QA; Manage/Admin reutilizan `useEntityPreviewFetch` para revisar el contenido afectado.

## 7. Seguridad
- Login/logout con cookies HttpOnly, `SameSite=strict`, `secure` en producción y expiración configurable (`JWT_EXPIRES_IN`).
- Rate limiting global y sensible con buckets IP+usuario (`300 req/5 min`, `10 req/60s` para auth/editorial sensibles).
- Directiva `v-can` y composable `useAuth` sincronizan permisos con el backend. Usuarios `suspended` quedan bloqueados en `01.auth.guard`.

## 8. Herramientas y scripts
- **Export/Import** (`/api/database/export|import`) y por entidad (`/api/<entity>/export|import`) usan `entityCrudHelpers` para gestionar traducciones y tags.@server/utils/entityCrudHelpers.ts#1-220
- **Scripts**: `scripts/add-leading-comments.mjs` y `scripts/sort-i18n.mjs` ayudan a mantener coherentes presets e i18n.
- **Testing manual**: seguir checklist en `/informes/ROADMAP.md` y `/informes/SUGERENCIAS.md` hasta tener suite automatizada.

## 9. Próximos pasos (roadmap vivo)
- Migrar tablas legacy a `CommonDataTable` + bridges (ver `/informes/ROADMAP.md`).
- Consolidar editor de efectos semánticos dentro de `FormModal` con validaciones compartidas.
- Habilitar dashboards de cobertura i18n y métricas editoriales (ver `/informes/BRAINSTORMING.md`).

Para profundizar en componentes concretos consulte `docs/COMPONENTES manage y admin.MD`. Para detalles del backend revise `docs/SERVER.md` y `docs/API.MD`.
