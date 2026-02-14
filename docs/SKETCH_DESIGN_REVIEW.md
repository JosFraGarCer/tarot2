# Revisión Crítica de Diseño — Sketches Tarot RPG Editor

> Fecha: 2026-02-13
> Stack: Nuxt 4 + NuxtUI + TailwindCSS + dark theme
> Público: editores frikis que aman vistas ricas (tarot, lore, technical, collection, kanban, graph)

---

## 0. Resumen Ejecutivo

Los sketches actuales están **visualmente bien ejecutados** y demuestran buena sensibilidad UX.
Sin embargo, operan sobre un modelo de datos simplificado (`mockData.ts`) que **no refleja la profundidad real del backend**.
Esto crea una brecha entre lo que el frontend promete y lo que el sistema realmente puede ofrecer.

**Hallazgos principales:**
- `content_version_id`, `release_stage`, `pinned_version` completamente ausentes en todos los sketches
- `translation_state` real (status per-lang + audit) reducido a boolean `has_translation`/`is_fallback`
- `canTransition` real (permisos + contexto editorial) ignorado — solo se usa state machine estática
- `changes_requested` status existe en backend pero no en mock (`EDITORIAL_TRANSITIONS`)
- Dependencias de publicación (facet→arcana, skill→facet) no representadas
- `hasEffectsDefined` como blocking reason invisible
- Imagen como campo de entidad (`image: z.string().url().nullable()`) no vinculada a publish readiness

---

## 1. Carencias Críticas por Sketch

### 1.1 Editorial List (`editorial-list.vue`)

| Carencia | Severidad | Evidencia |
|----------|-----------|-----------|
| **Sin `content_version_id` / semver** | P0 | No hay columna ni filtro. Backend: `baseEntityFields.content_version_id` existe en toda entidad |
| **Sin `release_stage`** | P0 | Backend tiene `releaseStageEnum`: dev/alfa/beta/candidate/release/revision. Invisible en list |
| **Translation = solo coverage ratio** | P0 | Columna muestra "2/3" pero backend tiene `translation_state` con `status` per-lang (draft/review/etc), `updated_by`, `updated_at`. Se pierde quién editó qué idioma y en qué estado está |
| **Sin `publishReady` / `blockingReasons`** | P1 | Solo disponible en DETAIL, no en LIST. Pero se podría mostrar como tooltip o icon overlay |
| **Sin filtro por blockers** | P1 | No hay filtro "missing effects", "missing image", "missing deps", "pinned world" |
| **`changes_requested` ausente** | P1 | Mock `EDITORIAL_TRANSITIONS` no incluye `changes_requested`. Backend real sí: `pending_review → changes_requested`, `review → changes_requested`, etc. |
| **Sin `is_active` visual** | P1 | Campo existe en backend pero no se muestra en tabla |

**Propuesta de columnas rediseñadas:**

| Columna | Contenido | Componente NuxtUI |
|---------|-----------|-------------------|
| **Entity** | name + code + entity_type badge | `<div>` + `<UBadge variant="outline">` |
| **Version** | semver badge (ej: `v1.2.0`) + release_stage dot (color-coded) | `<UBadge size="xs">` + dot `<span>` |
| **Status** | editorial_state.status badge. Si null → "No state" italic | `<UBadge>` con `editorialStatusMeta()` |
| **Health** | Composite icon row: ✓/✗ image, ✓/✗ effects, ✓/✗ translations, ✓/✗ deps. Tooltip con blockingReasons | Custom icon row + `<UTooltip>` |
| **Translations** | Per-lang mini-badges: `EN ● draft` `FR ● review` `ES ✗`. Cada badge muestra status real, no solo boolean | Flex row de `<UBadge size="xs">` per lang |
| **Updated** | relative time + updated_by | `<span>` |

**Propuesta de filtros rediseñados:**

| Filtro | Tipo | Opciones |
|--------|------|----------|
| **Status** | `<USelect>` | Todos los `CardStatus` reales incluyendo `changes_requested` |
| **Release Stage** | `<USelect>` | dev / alfa / beta / candidate / release / revision |
| **Blockers** | `<USelectMenu multiple>` | Missing translations / Missing effects / Missing image / Dependency not published / Pinned world |
| **Entity Type** | `<USelect>` | base_card / world_card / arcana / facet / skill / world / card_type |
| **Active** | `<USwitch>` | Show inactive |

**Microcopy para tooltips:**

- Health icon (image missing): "No image assigned. Required for publish."
- Health icon (effects missing): "No effects defined. Required for base_card, world_card, facet, skill."
- Health icon (deps blocked): "Parent entity not published: [arcana name] is in [status]."
- Health icon (translations): "2 of 3 languages complete. Missing: FR (draft), ES (no translation)."

---

### 1.2 Studio Card Editor (`studio-card-editor.vue`)

| Carencia | Severidad | Evidencia |
|----------|-----------|-----------|
| **Sin split view para `world_card`** | P0 | `world_card` referencia `world` + `base_card` con overrides. Studio trata todas las entidades igual |
| **Sin panel Dependencies** | P0 | `canTransition` verifica `hasEffectsDefined`, `hasAtLeastOneTranslation`, dependencias parent. Invisible en UI |
| **Sin version badge** | P0 | `content_version_id` y `release_stage` no aparecen en status bar ni en metadata tab |
| **Sin pinned world version banner** | P1 | Si la entidad pertenece a un world con `pinned_at`, el editor debería alertar |
| **Feedback sin `field_path`** | P1 | Comentarios no se anclan a campos específicos (ej: `translation.fr.name`) |
| **Feedback sin `content_version_id`** | P1 | No se sabe si un comentario es de una versión anterior |
| **Sin checklist publish readiness** | P1 | Backend calcula `publishReady` + `blockingReasons` pero no hay checklist visual |
| **Transitions usan state machine estática** | P1 | `EDITORIAL_TRANSITIONS` mock ≠ `cardStatusTransitions` real. Falta `changes_requested`. No valida permisos |
| **`changes_requested` ausente** | P1 | Status real del backend no existe en mock |

**Layout propuesto para Studio:**

```
┌─────────────────────────────────────────────────────────────┐
│ Status Bar                                                   │
│ [← Back] [Entity Name ▼] [type] [v1.2.0 beta] [Health Ring]│
│ [EN|FR|ES] [→ Next Transition] [⚙ Panel]                   │
├───────────────────────────────────┬──────────────────────────┤
│                                   │ Side Panel (tabs)        │
│   Card Preview                    │ ┌────────────────────┐  │
│   (tarot 2:3 ratio)              │ │ Meta │ Trans │ Edit │  │
│                                   │ │ Deps │ Feedback    │  │
│   [world_card: split view]       │ └────────────────────┘  │
│   ┌──────────┬──────────┐        │                          │
│   │ base_card│ overrides│        │ [Tab content]            │
│   │ (r/o)    │ (edit)   │        │                          │
│   └──────────┴──────────┘        │                          │
│                                   │                          │
│   [Save] [Preview]               │                          │
├───────────────────────────────────┴──────────────────────────┤
│ Publish Readiness Checklist (collapsible footer)             │
│ ✓ Image assigned  ✗ Effects missing  ✓ 2/3 translations     │
│ ✗ Parent arcana in review  ✓ Permissions OK                 │
└─────────────────────────────────────────────────────────────┘
```

**Nuevo tab: Dependencies**

| Dependency | Entity | Status | Impact |
|------------|--------|--------|--------|
| Arcana | Major Arcana | published ✓ | — |
| Facet | Innocence | review ✗ | Blocks publish |
| World | Ethereal Realm | published ✓ | — |
| Base Card | The Fool | approved ✓ | — (for world_card) |

Componentes: `<UTable>` con rows clickables que navegan a la entidad parent.

**Nuevo: Version Badge en Status Bar**

- `<UBadge color="neutral" variant="outline" size="xs">v1.2.0</UBadge>`
- Dot de release_stage: dev=neutral, alfa=warning, beta=primary, candidate=success, release=success bold
- Si world está pinned: banner amarillo debajo del status bar: "⚠ This world is pinned to v1.0.0 since [date] by [user]"

**Nuevo: Publish Readiness Checklist**

Collapsible section en la parte inferior o en el tab Editorial:

```
Publish Readiness
─────────────────
✓ Base content exists
✗ No effects defined          [→ Define effects]
✓ Image assigned
✓ At least one translation
✗ FR translation in draft     [→ Edit FR]
✗ Parent "Innocence" not published  [→ View]
✗ Missing permission: canPublish
```

Cada item es un `<div>` con icono ✓/✗, texto, y link de acción opcional.

**Estados vacíos:**

- Dependencies tab sin dependencias: "This entity has no parent dependencies."
- Feedback tab vacío: "No feedback yet. Start a conversation about this entity."
- Translations tab, idioma sin traducción: "No translation for [LANG]. Create one to improve coverage."

---

### 1.3 Editorial Board (`editorial-board.vue`)

| Carencia | Severidad | Evidencia |
|----------|-----------|-----------|
| **Drag ignora `canTransition` real** | P0 | Solo verifica `EDITORIAL_TRANSITIONS[status]` estática. Backend usa `canTransition()` con `EditorialContext` + `EditorialUserContext` (permisos, hasEffects, hasTranslation) |
| **Sin `changes_requested` columna** | P0 | Status real existe en backend. Board tiene 7 columnas pero falta esta |
| **Sin blockers en card** | P1 | Cards no muestran por qué una entidad está bloqueada |
| **Sin version/stage en card** | P1 | `content_version_id` y `release_stage` invisibles |
| **Sin filtro por release_stage** | P1 | No se puede filtrar "solo entidades en beta" |
| **Sin filtro por pinned world** | P1 | No se puede ver "entidades en worlds congelados" |
| **Error toast genérico** | P1 | "Transition not allowed" sin razón específica. Backend devuelve `result.reason` y `result.code` |

**Diseño de Board Card rediseñado:**

```
┌──────────────────────────────┐
│ [thumb] Entity Name          │
│          type badge  v1.2β   │
│          ──────────────────  │
│          EN●  FR◐  ES✗      │
│          ⚠ 2 blockers       │
│ ─────────────────────────── │
│ alice · 2h ago    [→ Next]  │
└──────────────────────────────┘
```

Elementos nuevos en la card:
- **Version micro-badge**: `v1.2` + release dot (β = warning color)
- **Translation per-lang dots**: `●` complete, `◐` draft/review, `✗` missing. Tooltip con status real
- **Blockers count**: `<UBadge color="warning" size="xs" icon="i-lucide-alert-triangle">2</UBadge>`. Tooltip lista razones
- **Missing image icon**: `<UIcon name="i-lucide-image-off">` si `image === null`

**Reglas UX de Drag & Drop:**

1. **Pre-validación visual**: Al iniciar drag, las columnas destino se colorean:
   - Verde: transición permitida (canTransition.allowed === true)
   - Rojo tenue: transición no permitida
   - Gris: misma columna

2. **Drop con validación completa**: Al soltar, llamar `canTransition(from, to, editorialCtx, userCtx)`:
   - Si `allowed`: aplicar transición + toast success con nombre de entidad y nuevo status
   - Si `!allowed` con `code: 'PERMISSION_DENIED'`: toast error "Missing permission: canPublish"
   - Si `!allowed` con `code: 'CONTENT_GUARD'`: toast error "Cannot publish: No effects defined"
   - Si `!allowed` con `code: 'INVALID_TRANSITION'`: toast error "Invalid transition: draft → published"

3. **Toast de error detallado**:
```
┌──────────────────────────────────────┐
│ ✗ Transition blocked                 │
│ The Fool: draft → published          │
│ Reason: No effects defined           │
│ [Define Effects →]                   │
└──────────────────────────────────────┘
```

**Filtros adicionales:**

| Filtro | Componente | Opciones |
|--------|------------|----------|
| Release Stage | `<USelect>` | dev / alfa / beta / candidate / release / revision |
| Blockers | `<USwitch>` | "Show only blocked entities" |
| Pinned World | `<USwitch>` | "Show only pinned worlds" |

---

### 1.4 Image System (`image-system.vue`)

| Carencia | Severidad | Evidencia |
|----------|-----------|-----------|
| **Imagen desconectada de entidad** | P0 | Sketch trata imágenes como sistema independiente. Backend: `image` es campo de `baseEntityFields` (`z.string().url().nullable()`) |
| **Sin impacto en publishReady** | P0 | Sketch dice "editorial_state changes do NOT affect image". Pero `hasBaseContent` en `EditorialContext` implica completitud. Una entidad sin imagen puede considerarse incompleta |
| **Sin distinción base_card vs world_card** | P1 | `world_card` puede tener override de imagen sobre `base_card`. No se muestra |
| **Versionado no ligado a content_version_id** | P1 | Image versions son independientes. Deberían vincularse a la versión de contenido |
| **Sin indicador editorial en gallery** | P1 | Gallery no muestra status editorial de la entidad asociada |

**Modelo UX propuesto:**

**Concepto clave**: La imagen es un **campo de la entidad**, no un sistema separado. El Image System es una **herramienta de gestión** que alimenta ese campo.

**Flujo de Upload/Selección:**

```
1. Desde Studio → Card Preview → Click "Upload Image"
   └→ Abre modal/slideover con:
      a) Upload tab: drag & drop, validación ratio/size
      b) Gallery tab: grid de imágenes existentes, filtrable
      c) History tab: versiones anteriores de esta entidad

2. Al seleccionar/subir:
   └→ entity.image = new_url
   └→ Se crea content_revision con diff: { image: { old: prev_url, new: new_url } }
   └→ Toast: "Image updated. This change will be included in the next version."

3. Para world_card:
   └→ Mostrar base_card image como "inherited"
   └→ Opción "Override with custom image" o "Use base card image"
   └→ Si override: world_card.image = custom_url
   └→ Si inherited: world_card.image = null (falls back to base_card.image)
```

**Indicadores editoriales en Gallery:**

Cada thumbnail en gallery muestra:
- Entity status badge (overlay top-right)
- Si es primary image: star icon (overlay top-left)
- Si la entidad no tiene imagen: "No image" placeholder con warning border
- Tooltip: "Entity: The Fool · Status: approved · Version: v1.2.0"

**Impacto en Publish Readiness:**

- En la checklist de Studio: "✓ Image assigned" o "✗ No image assigned [Upload →]"
- En Board cards: icono `i-lucide-image-off` si `entity.image === null`
- En List: health column incluye image check
- **Decisión de diseño**: ¿Es imagen obligatoria para publicar? Propuesta: configurable por entity_type via `useEntityCapabilities`. Cards sí, worlds no.

---

### 1.5 Feedback Workflow (`feedback-workflow.vue`)

| Carencia | Severidad | Evidencia |
|----------|-----------|-----------|
| **Sin `field_path` en comentarios** | P0 | Comentarios son genéricos. No se anclan a `translation.fr.name`, `effects[2]`, `image`, etc. |
| **Sin `content_version_id`** | P1 | No se sabe si un comentario es de v1 o v3. Comentarios antiguos pueden ser irrelevantes |
| **Feedback no influye en `editorial_state`** | P1 | `blockingReasons` se calcula localmente. Backend no tiene feedback como blocker nativo (pero debería) |
| **Sin navegación "open in Studio at field"** | P1 | No hay link desde comentario al campo específico en Studio |
| **Sin filtro por field_path** | P2 | No se puede filtrar "solo feedback sobre traducciones" vs "sobre imagen" |

**Estructura de comentario propuesta:**

```typescript
interface FeedbackComment {
  id: number
  author: string
  text: string
  status: 'open' | 'addressed' | 'resolved'
  
  // Anchoring (NEW)
  field_path: string | null      // ej: "translation.fr.name", "effects[2]", "image", null=general
  content_version_id: number | null  // versión del contenido cuando se creó el comentario
  version_semver: string | null      // "1.2.0" para display
  
  // Existing
  lang: string | null
  created_at: string
  resolution_note: string | null
  resolved_at: string | null
  resolved_by: string | null
  replies: FeedbackReply[]
}
```

**Badges nuevos por comentario:**

- **Version badge**: `<UBadge color="neutral" variant="outline" size="xs">v1.2</UBadge>` si `content_version_id` difiere de la versión actual → dimmed + label "From v1.2"
- **Field path badge**: `<UBadge color="primary" variant="soft" size="xs">FR · name</UBadge>` clickable → navega a Studio con ese campo enfocado
- **Stale indicator**: Si `content_version_id < current_version_id` → `<UBadge color="neutral" variant="subtle">Outdated</UBadge>`

**Acciones nuevas:**

- **"Open in Studio"**: Navega a `/manage/:entity/:id/studio?focus=translation.fr.name&lang=fr`
- **"Mark as outdated"**: Para comentarios de versiones anteriores que ya no aplican

**Filtros adicionales:**

| Filtro | Componente | Opciones |
|--------|------------|----------|
| Field type | `<USelect>` | All / Translations / Effects / Image / General |
| Version | `<USelect>` | Current version / All versions / Outdated only |

---

### 1.6 Card Views (`card-views.vue`)

| Carencia | Severidad | Evidencia |
|----------|-----------|-----------|
| **Technical View incompleto** | P0 | Falta `content_version_id`, `release_stage`, `is_active`. Translation matrix usa boolean, no status real per-lang |
| **Sin timeline de transiciones** | P1 | Backend genera `editorial_audit_log` y `content_revisions`. No hay vista temporal |
| **Sin compare versions** | P1 | `content_revisions` tiene `prev_snapshot` y `next_snapshot`. No hay diff view |
| **Lore Mode genérico** | P1 | No tiene profundidad "grimoire/codex" para público friki |
| **Collection Grid sin health indicators** | P1 | Solo muestra status badge y translation ratio. Falta version, blockers, image status |
| **Sin click → Studio** | P2 | Collection thumbnails no navegan a Studio |

**Technical View — Filas adicionales propuestas:**

| Field | Value |
|-------|-------|
| Content Version | v1.2.0 (id: 42) |
| Release Stage | beta |
| Is Active | Yes/No |
| Image | [thumbnail] or "No image" |
| Effects Defined | Yes/No |
| Dependencies | Major Arcana (published ✓), Innocence (review ✗) |
| Publish Ready | Yes/No + blocking reasons list |

**Translation Matrix — Columnas reales:**

| Lang | Status | Updated By | Updated At | Is Fallback |
|------|--------|------------|------------|-------------|
| EN | published | alice | 2h ago | No |
| FR | draft | bob | 1d ago | No |
| ES | — | — | — | Yes (fallback to EN) |

---

### 1.7 Entity Map (`entity-map.vue`)

| Carencia | Severidad | Evidencia |
|----------|-----------|-----------|
| **Sin translation coverage visual** | P1 | Nodos no muestran cobertura de traducción |
| **Sin dependency health en edges** | P1 | Edges no indican si la dependencia está "sana" (parent published) o "bloqueada" |
| **Sin version/stage en tooltip** | P1 | Tooltip solo muestra type + status. Falta version, blockers |
| **Sin pinned world indicator** | P1 | Nodos world no muestran si están pinned |
| **Relaciones incorrectas** | P1 | Mock tiene `base_card has_many facets` pero la relación real es `facet belongs_to arcana`, `skill belongs_to facet`. Las FK van en dirección opuesta |
| **Click no navega a Studio** | P2 | "Open in Studio" es un toast mock, no navegación real |

**Propuestas visuales para Entity Map:**

1. **Translation halo**: Arco circular alrededor de cada nodo proporcional a translation coverage. 3/3 = anillo completo verde. 1/3 = arco parcial warning.

2. **Dependency edge coloring**:
   - Verde: parent published → child puede avanzar
   - Amarillo: parent en review → child bloqueado para publish
   - Rojo: parent en draft → child muy bloqueado
   - Punteado: referencia (world_card → base_card)

3. **Pinned world indicator**: Nodos world con versión pinneada muestran icono de pin (📌) junto al status dot.

4. **Tooltip enriquecido**:
```
The Fool (base_card)
Status: approved · v1.2.0-beta
Translations: EN ✓ FR ◐ ES ✗
Blockers: 1 (missing effects)
Dependencies: Major Arcana ✓
```

---

## 2. Qué Falta para Explotar `content_version_id` / semver / `release_stage` / pinned

### Estado actual
- **Backend**: `content_version_id` en `baseEntityFields` y `editorial_state`. `releaseStageEnum` con 6 stages. `versionContextSchema` con `pinned_at`/`pinned_by`.
- **Sketches**: Cero representación. Ni un badge, ni un filtro, ni un tooltip.

### Propuesta por vista

| Vista | Dónde | Qué mostrar | Componente |
|-------|-------|-------------|------------|
| **List** | Columna "Version" | `v1.2.0` badge + release dot | `<UBadge>` + colored dot |
| **Studio** | Status bar | `v1.2.0-beta` badge + pinned banner | `<UBadge>` + `<div class="bg-warning/10">` |
| **Board** | Card | `v1.2β` micro-text | `<span class="text-[10px]">` |
| **Technical** | Metadata table | Full row: version, stage, pinned info | Table row |
| **Map** | Tooltip + side panel | Version + stage + pinned indicator | Text + icon |
| **Collection** | Thumbnail overlay | Release stage dot (corner) | Colored dot |
| **Feedback** | Per-comment badge | Version when comment was created | `<UBadge>` |

### Release Stage Color System

| Stage | Color | Dot | Meaning |
|-------|-------|-----|---------|
| dev | neutral/gray | ○ | In development |
| alfa | warning/amber | ◐ | Early testing |
| beta | primary/indigo | ● | Feature complete, testing |
| candidate | success/green | ◉ | Release candidate |
| release | success/bold | ★ | Released |
| revision | primary/blue | ↻ | Post-release revision |

### Pinned World Version

Cuando un world tiene `content_version_id` pinned:
- **Studio**: Banner amarillo: "⚠ Pinned to v1.0.0 since Jan 15 by alice. Edits won't affect the pinned version."
- **Board**: Lock icon en cards de entidades de ese world
- **List**: Filtro "Pinned worlds only"
- **Map**: Pin icon en nodo world

---

## 3. Qué Falta para Explotar `translation_state` Real

### Estado actual
- **Backend**: `translation_state` table con `entity_type`, `entity_id`, `language_code`, `status` (CardStatus), `created_by`, `updated_by`, `created_at`, `updated_at`
- **Sketches**: `TranslationLangState = { lang, has_translation, is_fallback }` — pierde status, audit trail, timestamps

### Mock actual vs Realidad

| Campo | Mock (`mockData.ts`) | Backend real |
|-------|---------------------|--------------|
| Status per-lang | ✗ (solo boolean) | ✓ `status: CardStatus` (draft/review/approved/etc) |
| Updated by per-lang | ✗ | ✓ `updated_by: number` |
| Updated at per-lang | ✗ | ✓ `updated_at: timestamp` |
| Created by per-lang | ✗ | ✓ `created_by: number` |
| Fallback | ✓ `is_fallback` | ✓ (derivado de ausencia de row) |

### Propuesta de representación por vista

**List — Translation column:**
```
EN ● published   FR ◐ draft   ES ✗
```
- `●` = status published/approved (green)
- `◐` = status draft/review/changes_requested (amber)
- `✗` = no translation_state row (red)
- Tooltip per-lang: "FR: draft · Updated by bob · 2 days ago"

**Studio — Translations tab:**
```
┌─────────────────────────────────────┐
│ EN (base)              published ●  │
│ alice · 2h ago         [Edit →]     │
├─────────────────────────────────────┤
│ FR                     draft ◐      │
│ bob · 1d ago           [Edit →]     │
├─────────────────────────────────────┤
│ ES                     — (missing)  │
│ No translation         [Create →]   │
└─────────────────────────────────────┘
```

**Board — Card translation dots:**
Tres dots debajo del entity name, color-coded por status real.

**Technical — Translation Matrix:**
Full table con Lang, Status, Updated By, Updated At, Is Fallback.

**Map — Translation halo:**
Arc segments colored by per-lang status (green/amber/red).

---

## 4. Propuesta de Sistema Visual Unificado: "Editorial Health"

### Concepto

Cada entidad tiene un **estado de salud editorial** compuesto por 5 dimensiones:
1. **Editorial status** (draft/review/approved/published/etc)
2. **Translation coverage** (per-lang status)
3. **Content completeness** (image + effects + base content)
4. **Dependency health** (parent entities published?)
5. **Version context** (content_version_id + release_stage + pinned)

### Representación visual unificada

**Compact (para List, Board cards, Collection thumbnails):**

```
[status badge] [version micro] [health dots]
```

Health dots = 4 small circles:
- 🟢 translations OK / 🟡 partial / 🔴 missing
- 🟢 image OK / 🔴 no image
- 🟢 effects OK / 🔴 no effects (solo para entidades que requieren effects)
- 🟢 deps OK / 🟡 deps in review / 🔴 deps in draft

**Full (para Studio status bar, Technical view):**

```
[status badge] [v1.2.0-beta] [EN● FR◐ ES✗] [⚠ 2 blockers] [→ Next]
```

**Minimal (para Map nodes, tooltips):**

Status dot + translation arc + dependency edge color.

### Componente propuesto: `EntityHealthIndicator`

Evolución de `EntityEditorialIndicator` con props adicionales:

```
Props:
  editorialState: { status, updated_by, updated_at, content_version_id } | null
  translationStates: { lang, status, updated_by, updated_at }[]
  blockingReasons: string[]
  publishReady: boolean
  releaseStage: string | null
  versionSemver: string | null
  hasImage: boolean
  hasEffects: boolean
  dependencyHealth: 'ok' | 'warning' | 'blocked' | null
  compact: boolean
  minimal: boolean
```

Este componente se usa en **todas** las vistas, garantizando coherencia visual.

---

## 5. Vistas Nuevas Propuestas (Público Friki)

### 5.1 Codex / Grimoire View

**Objetivo**: Vista inmersiva para lore-lovers. Se siente como hojear un grimorio antiguo.

**Diseño**:
- Tipografía serif/fantasy para títulos
- Background con textura pergamino sutil (CSS gradient, no imagen)
- Contenido organizado como "entrada de enciclopedia":
  - Título con número de arcana
  - Ilustración con marco decorativo
  - Texto lore con initial caps decorativas
  - "Cross-references" inline: menciones a otras entidades son links clickables
  - Footnotes con version history
  - Sidebar: "Related entries" como índice de grimorio
- Navegación: prev/next card en el arcana (flechas laterales)
- Keyboard: ← → para navegar

### 5.2 Timeline View

**Objetivo**: Visualizar la historia editorial de una entidad.

**Diseño**:
- Eje horizontal = tiempo
- Puntos = eventos (transiciones, edits, feedback, image changes)
- Color por tipo de evento
- Hover = detalle del evento (diff preview, snapshot)
- Filtrar por: tipo de evento, usuario, periodo
- Zoom: día / semana / mes

**Datos**: `editorial_audit_log` + `content_revisions`

### 5.3 Diff / Compare View

**Objetivo**: Comparar dos versiones de una entidad side-by-side.

**Diseño**:
- Selector de versiones (dropdown A vs dropdown B)
- Side-by-side con highlighting de cambios
- Campos cambiados resaltados en amarillo
- Campos añadidos en verde, eliminados en rojo
- Para texto largo: inline diff con insertions/deletions

**Datos**: `content_revisions.prev_snapshot` vs `content_revisions.next_snapshot`

### 5.4 Dependency Tree View

**Objetivo**: Visualizar el árbol de dependencias para publicar una entidad.

**Diseño**:
```
The Fool (base_card) → approved ✓
  ├── Major Arcana (arcana) → published ✓
  ├── Innocence (facet) → review ✗ [blocks publish]
  │   └── Major Arcana (arcana) → published ✓
  ├── Journey (skill) → draft ✗ [blocks publish]
  │   └── Innocence (facet) → review ✗
  ├── Translations: EN ✓ FR ✗ ES ✓
  └── Effects: defined ✓
```

Cada nodo clickable → navega a Studio.

### Conexiones entre vistas

| Desde | Hacia | Trigger |
|-------|-------|---------|
| Collection Grid | Studio (Tarot mode) | Click thumbnail |
| Collection Grid | Technical | Right-click → "Technical view" |
| Board card | Studio | Click card |
| Board card | Dependency Tree | Click blocker badge |
| Map node | Studio | "Open in Studio" button |
| Map node | Dependency Tree | "View dependencies" button |
| Studio | Board | "View on Board" button |
| Studio | Map | "Show in Map" button |
| Studio | Timeline | "View history" button |
| Studio | Diff | "Compare versions" button |
| Feedback comment | Studio at field | Click field_path badge |
| Codex | Studio | "Edit" button |
| Codex | Next/prev card | ← → arrows |
| Technical | Diff | "Compare with version X" button |

---

## 6. Cambios Priorizados en 3 Fases

### Fase 1: Quick Wins (1-2 días)

Cambios que alinean los sketches con el backend real sin rediseño mayor.

| # | Cambio | Sketch | Esfuerzo |
|---|--------|--------|----------|
| 1.1 | Añadir `changes_requested` a `EDITORIAL_TRANSITIONS` en mockData.ts | Todos | 15 min |
| 1.2 | Añadir `content_version_id`, `release_stage`, `version_semver` a `MockEntity` | mockData.ts | 30 min |
| 1.3 | Añadir `status`, `updated_by`, `updated_at` a `TranslationLangState` | mockData.ts | 30 min |
| 1.4 | Añadir columna Version + release dot a Editorial List | editorial-list | 1h |
| 1.5 | Cambiar translation column a per-lang status dots | editorial-list | 1h |
| 1.6 | Añadir version badge a Studio status bar | studio-card-editor | 30 min |
| 1.7 | Añadir `changes_requested` columna a Board | editorial-board | 30 min |
| 1.8 | Añadir `content_version_id` y `release_stage` a Technical View rows | card-views | 30 min |
| 1.9 | Enriquecer translation matrix con status real per-lang | card-views | 1h |
| 1.10 | Añadir version + blockers al tooltip de Entity Map | entity-map | 30 min |

### Fase 2: Medium (3-5 días)

Cambios estructurales que añaden funcionalidad real.

| # | Cambio | Sketch | Esfuerzo |
|---|--------|--------|----------|
| 2.1 | Crear `EntityHealthIndicator` unificado (reemplaza `EntityEditorialIndicator`) | Componente nuevo | 3h |
| 2.2 | Añadir Health column a Editorial List (image/effects/translations/deps icons) | editorial-list | 2h |
| 2.3 | Añadir filtros por blockers, release_stage, pinned world | editorial-list | 2h |
| 2.4 | Implementar Publish Readiness Checklist en Studio | studio-card-editor | 3h |
| 2.5 | Añadir Dependencies tab a Studio | studio-card-editor | 3h |
| 2.6 | Implementar `canTransition` real en Board drag & drop | editorial-board | 3h |
| 2.7 | Rediseñar Board cards con blockers, version, per-lang dots | editorial-board | 2h |
| 2.8 | Añadir `field_path` y `content_version_id` a Feedback comments | feedback-workflow | 2h |
| 2.9 | Añadir "Open in Studio at field" navigation | feedback-workflow | 1h |
| 2.10 | Vincular Image System a entidad (no sistema independiente) | image-system | 3h |
| 2.11 | Añadir translation halo a Entity Map nodes | entity-map | 2h |
| 2.12 | Colorear edges por dependency health | entity-map | 2h |
| 2.13 | Split view para world_card en Studio (base_card r/o + overrides) | studio-card-editor | 4h |

### Fase 3: Advanced (1-2 semanas)

Vistas nuevas y funcionalidad avanzada para público friki.

| # | Cambio | Tipo | Esfuerzo |
|---|--------|------|----------|
| 3.1 | Codex / Grimoire View | Vista nueva | 1-2 días |
| 3.2 | Timeline View (editorial_audit_log + content_revisions) | Vista nueva | 1-2 días |
| 3.3 | Diff / Compare View (prev_snapshot vs next_snapshot) | Vista nueva | 1 día |
| 3.4 | Dependency Tree View | Vista nueva | 1 día |
| 3.5 | Board swimlanes por entity type | Mejora Board | 1 día |
| 3.6 | Pinned world version banner + filter across views | Cross-cutting | 1 día |
| 3.7 | Cross-navigation real entre todas las vistas | Cross-cutting | 2 días |
| 3.8 | Feedback como blocker nativo en editorial_state | Backend + Frontend | 2 días |

---

## 7. Incoherencias entre Sketches

| Incoherencia | Detalle | Solución |
|-------------|---------|----------|
| **Mock transitions ≠ Backend real** | `EDITORIAL_TRANSITIONS` en mockData.ts no incluye `changes_requested` y tiene transiciones diferentes a `cardStatusTransitions` real | Alinear mock con `shared/editorial/transitions.ts` |
| **Status colors inconsistentes** | `editorialStatusMeta` en mockData.ts vs `STATUS_MAP` en `utils/badges.ts` vs `useCardStatus` en `utils/status.ts` | Unificar en un solo source of truth |
| **Translation representation** | List usa "2/3", Board usa "2/3", Studio usa per-lang cards, Technical usa matrix, Map no muestra nada | Unificar con `EntityHealthIndicator` que adapta representación por contexto |
| **Feedback influence** | Feedback sketch calcula `blockingReasons` localmente. Otros sketches no consideran feedback como blocker | Feedback count debería ser parte del `editorial` response del backend |
| **Image impact** | Image System dice "editorial_state changes do NOT affect image". Studio tiene upload pero sin impacto editorial | Definir política: ¿imagen requerida para publish? Implementar en `EditorialContext.hasBaseContent` |
| **Entity Map relations** | Mock relations no reflejan FK reales. `facet → arcana` es `belongs_to`, no `base_card has_many facets` | Alinear con schema real: `facet.arcana_id`, `skill.facet_id`, `world_card.world_id + base_card_id` |

---

## 8. Nota sobre `mockData.ts`

El archivo `mockData.ts` necesita una actualización significativa para reflejar el backend real.
Cambios mínimos necesarios:

1. **`EditorialStatus`** → Importar de `shared/editorial/card-status.ts` (incluye `changes_requested`)
2. **`EDITORIAL_TRANSITIONS`** → Importar de `shared/editorial/transitions.ts` (real)
3. **`TranslationLangState`** → Añadir `status: CardStatus`, `updated_by`, `updated_at`
4. **`MockEntity`** → Añadir `content_version_id`, `release_stage`, `version_semver`, `image`
5. **`EditorialMetadata`** → Alinear `blockingReasons` con los reales: missing translations, missing effects, missing image, dependency not published, permission denied
6. **`computeEditorial`** → Simular `canTransition` real con `EditorialContext`

Esto es prerequisito para todas las mejoras de Fase 1 y 2.
