# 🗄️ Modelo de Datos - Tarot2

## 1. Visión General del Esquema

Tarot2 utiliza **PostgreSQL** con un modelo relacional que soporta:
- **Entidades traducibles** con tablas `_translations`
- **Sistema de etiquetas** con `tag_links` polimórficos
- **Flujo editorial** con versiones, revisiones y feedback
- **Autenticación** basada en usuarios con roles y permisos JSONB

---

## 2. Diagrama Entidad-Relación

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DOMINIO DEL JUEGO                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐           │
│  │  arcana  │────▶│  facet   │────▶│  skill   │     │   tag    │           │
│  │          │     │          │     │          │     │          │           │
│  └──────────┘     └──────────┘     └──────────┘     └──────────┘           │
│       │                │                │                │                  │
│       ▼                ▼                ▼                ▼                  │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐           │
│  │ arcana_  │     │ facet_   │     │ skill_   │     │ tag_     │           │
│  │ transl.  │     │ transl.  │     │ transl.  │     │ transl.  │           │
│  └──────────┘     └──────────┘     └──────────┘     └──────────┘           │
│                                                                              │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐                             │
│  │  world   │────▶│world_card│◀────│base_card │                             │
│  │          │     │(override)│     │          │                             │
│  └──────────┘     └──────────┘     └──────────┘                             │
│       │                │                │                                    │
│       ▼                ▼                ▼                                    │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐           │
│  │ world_   │     │world_card│     │base_card_│     │base_card_│           │
│  │ transl.  │     │_transl.  │     │transl.   │     │type      │           │
│  └──────────┘     └──────────┘     └──────────┘     └──────────┘           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         SISTEMA DE EFECTOS                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                 │
│  │ effect_type  │────▶│ card_effects │◀────│effect_target │                 │
│  │              │     │  (instancia) │     │              │                 │
│  └──────────────┘     └──────────────┘     └──────────────┘                 │
│        │                    │                    │                          │
│        ▼                    │                    ▼                          │
│  ┌──────────────┐           │              ┌──────────────┐                 │
│  │effect_type_  │           │              │effect_target_│                 │
│  │translations  │           │              │translations  │                 │
│  └──────────────┘           │              └──────────────┘                 │
│                             ▼                                                │
│                    ┌──────────────┐                                         │
│                    │ Entidades:   │                                         │
│                    │ • base_card  │                                         │
│                    │ • world_card │                                         │
│                    │ • skill      │                                         │
│                    │ • facet      │                                         │
│                    └──────────────┘                                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         SISTEMA EDITORIAL                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐    │
│  │ content_versions │────▶│content_revisions │     │ content_feedback │    │
│  │   (releases)     │     │   (historial)    │     │     (QA)         │    │
│  └──────────────────┘     └──────────────────┘     └──────────────────┘    │
│                                  │                         │                │
│                                  ▼                         ▼                │
│                           ┌────────────┐           ┌────────────┐          │
│                           │ Entidades  │           │ Entidades  │          │
│                           │ afectadas  │           │ referidas  │          │
│                           └────────────┘           └────────────┘          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                            AUTENTICACIÓN                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────┐     ┌──────────────┐                                          │
│  │  users   │────▶│  user_roles  │◀────┌──────────┐                         │
│  │          │     │   (pivot)    │     │  roles   │                         │
│  └──────────┘     └──────────────┘     │permissions│                        │
│                                        │  (JSONB)  │                        │
│                                        └──────────┘                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Entidades del Dominio del Juego

### 3.1 Arcana (Arcanos)

```sql
CREATE TABLE arcana (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  status card_status DEFAULT 'draft',
  is_active BOOLEAN DEFAULT true,
  image VARCHAR(255),
  sort INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  modified_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE arcana_translations (
  id SERIAL PRIMARY KEY,
  arcana_id INTEGER REFERENCES arcana(id) ON DELETE CASCADE,
  language_code VARCHAR(5) NOT NULL,
  name VARCHAR(255) NOT NULL,
  short_text TEXT,
  description TEXT,
  UNIQUE(arcana_id, language_code)
);
```

**Propósito:** Representa los tres arcanos principales (Físico, Mental, Espiritual) que organizan las facetas del personaje.

### 3.2 Facet (Facetas)

```sql
CREATE TABLE facet (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  arcana_id INTEGER REFERENCES arcana(id),
  status card_status DEFAULT 'draft',
  is_active BOOLEAN DEFAULT true,
  image VARCHAR(255),
  color VARCHAR(20),
  icon VARCHAR(50),
  legacy_effects BOOLEAN DEFAULT false,
  effects JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  content_version_id INTEGER REFERENCES content_versions(id),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  modified_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE facet_translations (
  id SERIAL PRIMARY KEY,
  facet_id INTEGER REFERENCES facet(id) ON DELETE CASCADE,
  language_code VARCHAR(5) NOT NULL,
  name VARCHAR(255) NOT NULL,
  short_text TEXT,
  description TEXT,
  effects_summary TEXT,
  UNIQUE(facet_id, language_code)
);
```

**Propósito:** Representa las 9 facetas (Fuerza, Agilidad, Vigor, Ingenio, Percepción, Erudición, Voluntad, Carisma, Alma).

### 3.3 Skill (Habilidades Base)

```sql
CREATE TABLE base_skills (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  facet_id INTEGER REFERENCES facet(id),
  status card_status DEFAULT 'draft',
  is_active BOOLEAN DEFAULT true,
  image VARCHAR(255),
  icon VARCHAR(50),
  legacy_effects BOOLEAN DEFAULT false,
  effects JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  modified_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE base_skills_translations (
  id SERIAL PRIMARY KEY,
  skill_id INTEGER REFERENCES base_skills(id) ON DELETE CASCADE,
  language_code VARCHAR(5) NOT NULL,
  name VARCHAR(255) NOT NULL,
  short_text TEXT,
  description TEXT,
  effect_text TEXT,
  UNIQUE(skill_id, language_code)
);
```

**Propósito:** Habilidades vinculadas a cada faceta que definen capacidades del personaje.

### 3.4 World (Mundos)

```sql
CREATE TABLE worlds (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  status card_status DEFAULT 'draft',
  is_active BOOLEAN DEFAULT true,
  image VARCHAR(255),
  metadata JSONB DEFAULT '{}',
  content_version_id INTEGER REFERENCES content_versions(id),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  modified_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE worlds_translations (
  id SERIAL PRIMARY KEY,
  world_id INTEGER REFERENCES worlds(id) ON DELETE CASCADE,
  language_code VARCHAR(5) NOT NULL,
  name VARCHAR(255) NOT NULL,
  short_text TEXT,
  description TEXT,
  lore TEXT,
  flavor_text TEXT,
  UNIQUE(world_id, language_code)
);
```

**Propósito:** Ambientaciones o mundos de fantasía que pueden tener sus propias variantes de cartas.

### 3.5 Base Card (Cartas Base)

```sql
CREATE TABLE base_card (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  card_type_id INTEGER REFERENCES base_card_type(id),
  card_family VARCHAR(50),
  status card_status DEFAULT 'draft',
  is_active BOOLEAN DEFAULT true,
  image VARCHAR(255),
  legacy_effects BOOLEAN DEFAULT false,
  effects JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  content_version_id INTEGER REFERENCES content_versions(id),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  modified_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE base_card_translations (
  id SERIAL PRIMARY KEY,
  card_id INTEGER REFERENCES base_card(id) ON DELETE CASCADE,
  language_code VARCHAR(5) NOT NULL,
  name VARCHAR(255) NOT NULL,
  short_text TEXT,
  description TEXT,
  flavor_text TEXT,
  UNIQUE(card_id, language_code)
);
```

**Propósito:** Cartas conceptuales base (Linaje, Entorno, Trasfondo, Ocupación, Potencia).

### 3.6 World Card (Cartas de Mundo)

```sql
CREATE TABLE world_card (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  world_id INTEGER REFERENCES worlds(id),
  base_card_id INTEGER REFERENCES base_card(id),
  status card_status DEFAULT 'draft',
  is_active BOOLEAN DEFAULT true,
  is_override BOOLEAN DEFAULT false,
  image VARCHAR(255),
  legacy_effects BOOLEAN DEFAULT false,
  effects JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  content_version_id INTEGER REFERENCES content_versions(id),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  modified_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE world_card_translations (
  id SERIAL PRIMARY KEY,
  card_id INTEGER REFERENCES world_card(id) ON DELETE CASCADE,
  language_code VARCHAR(5) NOT NULL,
  name VARCHAR(255) NOT NULL,
  short_text TEXT,
  description TEXT,
  flavor_text TEXT,
  UNIQUE(card_id, language_code)
);
```

**Propósito:** Variantes de cartas específicas para cada mundo/ambientación.

### 3.7 Base Card Type (Tipos de Carta)

```sql
CREATE TABLE base_card_type (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  status card_status DEFAULT 'draft',
  is_active BOOLEAN DEFAULT true,
  image VARCHAR(255),
  icon VARCHAR(50),
  metadata JSONB DEFAULT '{}',
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  modified_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE base_card_type_translations (
  id SERIAL PRIMARY KEY,
  card_type_id INTEGER REFERENCES base_card_type(id) ON DELETE CASCADE,
  language_code VARCHAR(5) NOT NULL,
  name VARCHAR(255) NOT NULL,
  short_text TEXT,
  description TEXT,
  UNIQUE(card_type_id, language_code)
);
```

**Propósito:** Catálogo de tipos de carta (Linaje, Entorno, etc.).

---

## 4. Sistema de Tags

### 4.1 Tags y Traducciones

```sql
CREATE TABLE tags (
  id SERIAL PRIMARY KEY,
  code VARCHAR(100) UNIQUE NOT NULL,
  category VARCHAR(50),
  parent_id INTEGER REFERENCES tags(id),
  sort INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  modified_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE tags_translations (
  id SERIAL PRIMARY KEY,
  tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
  language_code VARCHAR(5) NOT NULL,
  name VARCHAR(255) NOT NULL,
  short_text TEXT,
  description TEXT,
  UNIQUE(tag_id, language_code)
);
```

### 4.2 Tag Links (Relación Polimórfica)

```sql
CREATE TABLE tag_links (
  id SERIAL PRIMARY KEY,
  tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
  entity_type entity_type NOT NULL,
  entity_id INTEGER NOT NULL,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tag_id, entity_type, entity_id)
);

CREATE TYPE entity_type AS ENUM (
  'arcana', 'facet', 'base_card', 'base_card_type', 
  'world', 'world_card', 'base_skills'
);
```

**Características:**
- Jerarquía de tags via `parent_id`
- Categorías para organización
- Traducible a múltiples idiomas
- Relación polimórfica con cualquier entidad

---

## 5. Sistema de Efectos

### 5.1 Effect Type (Tipos de Efecto)

```sql
CREATE TABLE effect_type (
  id SERIAL PRIMARY KEY,
  code VARCHAR(100) UNIQUE NOT NULL,
  category VARCHAR(50),
  operator VARCHAR(20),
  default_duration VARCHAR(50),
  value_type VARCHAR(20),
  template TEXT,
  status card_status DEFAULT 'draft',
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  content_version_id INTEGER REFERENCES content_versions(id),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  modified_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE effect_type_translations (
  id SERIAL PRIMARY KEY,
  effect_type_id INTEGER REFERENCES effect_type(id) ON DELETE CASCADE,
  language_code VARCHAR(5) NOT NULL,
  name VARCHAR(255) NOT NULL,
  template TEXT,
  description TEXT,
  UNIQUE(effect_type_id, language_code)
);
```

### 5.2 Effect Target (Objetivos de Efecto)

```sql
CREATE TABLE effect_target (
  id SERIAL PRIMARY KEY,
  code VARCHAR(100) UNIQUE NOT NULL,
  scope VARCHAR(20),
  tag VARCHAR(50),
  status card_status DEFAULT 'draft',
  is_active BOOLEAN DEFAULT true,
  validation_state VARCHAR(20) DEFAULT 'valid',
  metadata JSONB DEFAULT '{}',
  content_version_id INTEGER REFERENCES content_versions(id),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  modified_at TIMESTAMP DEFAULT NOW()
);
```

### 5.3 Card Effects (Instancias de Efecto)

```sql
CREATE TABLE card_effects (
  id SERIAL PRIMARY KEY,
  entity_type entity_type NOT NULL,
  entity_id INTEGER NOT NULL,
  parent_id INTEGER REFERENCES card_effects(id) ON DELETE CASCADE,
  effect_group VARCHAR(100),
  effect_type_id INTEGER REFERENCES effect_type(id) ON DELETE SET NULL,
  effect_target_id INTEGER REFERENCES effect_target(id) ON DELETE SET NULL,
  value NUMERIC,
  formula TEXT,
  mode VARCHAR(50),
  duration VARCHAR(50),
  condition TEXT,
  scope VARCHAR(20),
  is_stackable BOOLEAN DEFAULT false,
  max_stack INTEGER,
  stack_group VARCHAR(100),
  validation_state VARCHAR(20) DEFAULT 'valid',
  metadata JSONB DEFAULT '{}',
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT chk_card_effects_value CHECK (value BETWEEN -9999 AND 9999)
);

CREATE INDEX idx_card_effects_entity ON card_effects(entity_type, entity_id);
CREATE INDEX idx_card_effects_type_target ON card_effects(effect_type_id, effect_target_id);
```

**Sistema dual:**
- **Semántico:** Usa `card_effects` con tipos y targets catalogados
- **Legacy/Narrativo:** Usa campo `effects` JSONB con Markdown

---

## 6. Sistema Editorial

### 6.1 Content Versions

```sql
CREATE TABLE content_versions (
  id SERIAL PRIMARY KEY,
  version_semver VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  release release_stage DEFAULT 'alfa',
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TYPE release_stage AS ENUM (
  'dev', 'alfa', 'beta', 'candidate', 'release', 'revision'
);
```

### 6.2 Content Revisions

```sql
CREATE TABLE content_revisions (
  id SERIAL PRIMARY KEY,
  entity_type entity_type NOT NULL,
  entity_id INTEGER NOT NULL,
  version_number INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'draft',
  language_code VARCHAR(5),
  content_version_id INTEGER REFERENCES content_versions(id),
  diff JSONB DEFAULT '{}',
  prev_snapshot JSONB,
  next_snapshot JSONB,
  notes TEXT,
  created_by INTEGER REFERENCES users(id),
  approved_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  approved_at TIMESTAMP,
  
  UNIQUE(entity_type, entity_id, version_number)
);
```

### 6.3 Content Feedback

```sql
CREATE TABLE content_feedback (
  id SERIAL PRIMARY KEY,
  entity_type entity_type NOT NULL,
  entity_id INTEGER NOT NULL,
  version_number INTEGER,
  language_code VARCHAR(5),
  comment TEXT NOT NULL,
  category VARCHAR(50),
  status feedback_status DEFAULT 'open',
  created_by INTEGER REFERENCES users(id),
  resolved_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);

CREATE TYPE feedback_status AS ENUM ('open', 'resolved', 'dismissed');
```

---

## 7. Autenticación y Autorización

### 7.1 Users

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  status user_status DEFAULT 'active',
  image VARCHAR(255),
  effects JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  modified_at TIMESTAMP DEFAULT NOW()
);

CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');
```

### 7.2 Roles

```sql
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Estructura de permissions:
-- {
--   "canReview": true,
--   "canPublish": true,
--   "canTranslate": true,
--   "canAssignTags": true,
--   "canEditContent": true,
--   "canManageUsers": true,
--   "canResolveFeedback": true
-- }
```

### 7.3 User Roles (Pivot)

```sql
CREATE TABLE user_roles (
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, role_id)
);
```

---

## 8. Enums del Sistema

### 8.1 Card Status

```sql
CREATE TYPE card_status AS ENUM (
  'draft',      -- Borrador inicial
  'review',     -- En revisión
  'approved',   -- Aprobado para publicar
  'published',  -- Publicado
  'archived',   -- Archivado
  'deprecated'  -- Obsoleto
);
```

### 8.2 Release Stage

```sql
CREATE TYPE release_stage AS ENUM (
  'dev',        -- Desarrollo
  'alfa',       -- Alfa
  'beta',       -- Beta
  'candidate',  -- Candidato a release
  'release',    -- Versión final
  'revision'    -- Revisión de versión
);
```

---

## 9. Índices Clave

```sql
-- Búsquedas de traducción
CREATE INDEX idx_world_translations_lang ON worlds_translations(world_id, language_code);
CREATE INDEX idx_arcana_translations_lang ON arcana_translations(arcana_id, language_code);
-- ... para todas las tablas de traducción

-- Tags
CREATE INDEX idx_tag_links_entity ON tag_links(entity_type, entity_id);
CREATE INDEX idx_tag_links_tag ON tag_links(tag_id);

-- Efectos
CREATE INDEX idx_card_effects_entity ON card_effects(entity_type, entity_id);
CREATE INDEX idx_card_effects_metadata_gin ON card_effects USING gin(metadata jsonb_path_ops);

-- Editorial
CREATE INDEX idx_revisions_entity ON content_revisions(entity_type, entity_id);
CREATE INDEX idx_feedback_entity ON content_feedback(entity_type, entity_id);
CREATE INDEX idx_feedback_status ON content_feedback(status);
```

---

## 10. Convenciones del Modelo

### 10.1 Campos Estándar

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | SERIAL | Primary key |
| `code` | VARCHAR | Código único legible |
| `status` | ENUM | Estado del ciclo de vida |
| `is_active` | BOOLEAN | Activo/inactivo |
| `created_by` | INTEGER | Usuario creador |
| `created_at` | TIMESTAMP | Fecha creación |
| `modified_at` | TIMESTAMP | Fecha modificación |
| `metadata` | JSONB | Datos adicionales flexibles |

### 10.2 Tablas de Traducción

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | SERIAL | Primary key |
| `<entity>_id` | INTEGER | FK a tabla base |
| `language_code` | VARCHAR(5) | Código idioma (en, es) |
| `name` | VARCHAR | Nombre traducido |
| `short_text` | TEXT | Texto corto |
| `description` | TEXT | Descripción larga |

### 10.3 Regla de Borrado

- Si `lang = 'en'` → Borra entidad completa + todas traducciones
- Si `lang != 'en'` → Solo borra traducción específica

---

## 11. Relaciones Clave

| Relación | Tipo | Descripción |
|----------|------|-------------|
| arcana → facet | 1:N | Un arcano tiene múltiples facetas |
| facet → skill | 1:N | Una faceta tiene múltiples habilidades |
| world → world_card | 1:N | Un mundo tiene múltiples cartas |
| base_card → world_card | 1:N | Una carta base puede tener overrides |
| entity → tag_links → tags | N:M | Relación polimórfica de tags |
| entity → card_effects | 1:N | Efectos asociados a entidad |
| users → roles | N:M | Usuarios con múltiples roles |

---

*Este documento detalla el modelo de datos de Tarot2. Para información sobre seguridad, consultar 06-SEGURIDAD.md.*
