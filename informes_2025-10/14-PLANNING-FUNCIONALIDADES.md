# 🎮 Planning de Funcionalidades TTRPG - Tarot2

## 1. Visión del Producto

Tarot2 evoluciona de un **CMS de gestión de contenido** a una **plataforma completa de TTRPG** que permite:

1. **Gestionar contenido** (actual) - Mundos, arcanos, cartas, habilidades
2. **Crear personajes** - Character builder con reglas del sistema
3. **Jugar partidas** - Sesiones online en tiempo real
4. **Comunidad** - Contenido generado por usuarios

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        EVOLUCIÓN DE TAROT2                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   FASE ACTUAL        FASE 4           FASE 5           FASE 6               │
│   CMS               World Cards       Personajes       Partidas             │
│   ─────────         ───────────       ──────────       ────────             │
│   • Mundos          • Deck builder    • Char sheet     • Sesiones RT        │
│   • Arcanos         • Colecciones     • Progresión     • VTT básico         │
│   • Base Cards      • Trading         • Inventario     • Chat/Dados         │
│   • Effects         • Drafts          • Builds         • Replay             │
│                                                                              │
│   [COMPLETADO]      [Q2 2025]         [Q3-Q4 2025]     [2026]               │
│                                                                              │
│   ────────────────────────────────────────────────────────────────────────  │
│                                                                              │
│   FASE 7            FASE 8           CONTINUA                               │
│   Comunidad         Mobile           Expansión                              │
│   ─────────         ──────           ─────────                              │
│   • Marketplace     • PWA            • Mods/Plugins                         │
│   • UGC             • Companion      • API pública                          │
│   • Torneos         • Notifications  • Integraciones                        │
│                                                                              │
│   [2026+]           [2026+]          [Continuo]                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Fase 4: World Cards y Colecciones

### 2.1 Objetivo

Permitir a los jugadores crear **mazos personalizados** basados en los mundos y cartas base, con sistema de **colección y trading**.

### 2.2 Funcionalidades Detalladas

#### 2.2.1 Gestión de World Cards

| Funcionalidad | Descripción | Prioridad |
|---------------|-------------|-----------|
| **CRUD World Cards** | Crear cartas específicas de mundo sobre base_cards | 🔥 Alta |
| **Override de efectos** | Modificar efectos de carta base por mundo | 🔥 Alta |
| **Artwork personalizado** | Subir ilustraciones por mundo | 🔥 Alta |
| **Flavor text** | Texto narrativo localizado | Media |
| **Rareza por mundo** | Modificar rareza según mundo | Media |
| **Restricciones** | Limitar cartas a ciertos mundos | Media |

**Schema de datos propuesto:**
```sql
-- Ya existe: world_card con overrides
-- Añadir:
CREATE TABLE world_card_artwork (
  id SERIAL PRIMARY KEY,
  world_card_id INT REFERENCES world_card(id),
  variant_name VARCHAR(50),  -- 'default', 'foil', 'alternate'
  image_url TEXT NOT NULL,
  artist_name VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE card_rarity (
  id SERIAL PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,  -- 'common', 'uncommon', 'rare', 'legendary'
  weight INT DEFAULT 100,  -- Para drafts/packs
  color VARCHAR(7)  -- Hex color para UI
);
```

#### 2.2.2 Deck Builder

| Funcionalidad | Descripción | Prioridad |
|---------------|-------------|-----------|
| **Crear mazo** | Seleccionar mundo, añadir cartas | 🔥 Alta |
| **Validación de reglas** | Min/max cartas, restricciones | 🔥 Alta |
| **Guardar/cargar mazos** | Persistencia en cuenta | 🔥 Alta |
| **Compartir mazos** | URL pública o código | 🔥 Alta |
| **Importar/exportar** | JSON, formato texto | Media |
| **Estadísticas de mazo** | Curva de maná, distribución | Media |
| **Versiones de mazo** | Historial de cambios | Baja |
| **Mazo favorito** | Quick access | Baja |

**Componentes UI necesarios:**
```
DeckBuilder/
├── DeckBuilderPage.vue          # Página principal
├── CardPool.vue                 # Grid de cartas disponibles
├── DeckList.vue                 # Lista del mazo actual
├── DeckStats.vue                # Estadísticas
├── CardSearchFilters.vue        # Filtros avanzados
├── DeckValidation.vue           # Errores/warnings
├── DeckShareModal.vue           # Compartir
└── DeckImportExport.vue         # Import/Export
```

**Schema de datos:**
```sql
CREATE TABLE decks (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  world_id INT REFERENCES world(id),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  share_code VARCHAR(12) UNIQUE,
  card_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE deck_cards (
  deck_id INT REFERENCES decks(id) ON DELETE CASCADE,
  world_card_id INT REFERENCES world_card(id),
  quantity INT DEFAULT 1 CHECK (quantity > 0 AND quantity <= 4),
  PRIMARY KEY (deck_id, world_card_id)
);

CREATE TABLE deck_versions (
  id SERIAL PRIMARY KEY,
  deck_id INT REFERENCES decks(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  snapshot JSONB NOT NULL,  -- Copia del deck en ese momento
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2.2.3 Sistema de Colección

| Funcionalidad | Descripción | Prioridad |
|---------------|-------------|-----------|
| **Colección personal** | Cartas que posee el usuario | 🔥 Alta |
| **Wishlist** | Cartas deseadas | Media |
| **Tradelist** | Cartas para intercambiar | Media |
| **Progreso de colección** | % completado por set/mundo | Media |
| **Logros de colección** | Badges por completar sets | Baja |

**Schema:**
```sql
CREATE TABLE user_collection (
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  world_card_id INT REFERENCES world_card(id),
  quantity INT DEFAULT 1,
  foil_quantity INT DEFAULT 0,
  acquired_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, world_card_id)
);

CREATE TABLE user_wishlist (
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  world_card_id INT REFERENCES world_card(id),
  priority INT DEFAULT 0,
  notes TEXT,
  PRIMARY KEY (user_id, world_card_id)
);
```

#### 2.2.4 Trading System (Opcional)

| Funcionalidad | Descripción | Prioridad |
|---------------|-------------|-----------|
| **Ofertas de intercambio** | Proponer trade entre usuarios | Baja |
| **Historial de trades** | Log de intercambios | Baja |
| **Valoración de cartas** | Sistema de precios estimados | Baja |
| **Reputación** | Sistema de confianza | Baja |

---

### 2.3 API Endpoints Fase 4

```
# World Cards (expandir existente)
GET    /api/world_card                    # Lista con filtros
GET    /api/world_card/:id                # Detalle
POST   /api/world_card                    # Crear (admin)
PATCH  /api/world_card/:id                # Actualizar
DELETE /api/world_card/:id                # Eliminar

# Decks
GET    /api/decks                         # Mis mazos
GET    /api/decks/:id                     # Detalle de mazo
GET    /api/decks/shared/:code            # Mazo por código
POST   /api/decks                         # Crear mazo
PATCH  /api/decks/:id                     # Actualizar
DELETE /api/decks/:id                     # Eliminar
POST   /api/decks/:id/cards               # Añadir carta
DELETE /api/decks/:id/cards/:cardId       # Quitar carta
POST   /api/decks/:id/validate            # Validar reglas
POST   /api/decks/:id/share               # Generar código
POST   /api/decks/:id/clone               # Clonar mazo público
GET    /api/decks/:id/versions            # Historial
POST   /api/decks/:id/versions            # Guardar versión
POST   /api/decks/import                  # Importar JSON
GET    /api/decks/:id/export              # Exportar

# Colección
GET    /api/collection                    # Mi colección
POST   /api/collection                    # Añadir carta
PATCH  /api/collection/:cardId            # Actualizar cantidad
DELETE /api/collection/:cardId            # Eliminar
GET    /api/collection/stats              # Estadísticas
GET    /api/wishlist                      # Mi wishlist
POST   /api/wishlist                      # Añadir
DELETE /api/wishlist/:cardId              # Eliminar
```

### 2.4 Estimación Fase 4

| Componente | Esfuerzo | Duración |
|------------|----------|----------|
| World Cards CRUD completo | 2 semanas | Sprint 1 |
| Deck Builder UI | 3 semanas | Sprint 2-3 |
| Deck Builder API | 1 semana | Sprint 2 |
| Sistema de colección | 2 semanas | Sprint 3-4 |
| Trading (opcional) | 3 semanas | Sprint 5-6 |
| **Total Fase 4** | **8-11 semanas** | **2-3 meses** |

---

## 3. Fase 5: Creación de Personajes

### 3.1 Objetivo

Sistema completo de **character building** siguiendo las reglas del TTRPG **Proyecto Tarot**, con **hojas de personaje digitales** y **progresión por Sellos de Poder**.

### 3.2 El Sistema de Personajes (Resumen)

> **Referencia completa:** Ver `sistema/28-REGLAS-CONSOLIDADAS.md`

```
┌─────────────────────────────────────────────────────────────┐
│                 ESTRUCTURA DEL PERSONAJE                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  3 ARCANOS → 9 FACETAS (escala 1-5)                         │
│  ─────────────────────────────────────                      │
│  • Físico: Fuerza, Agilidad, Vigor                          │
│  • Mental: Ingenio, Percepción, Voluntad                    │
│  • Espiritual: Carisma, Empatía, Alma                       │
│                                                              │
│  5 CARTAS FUNDAMENTALES                                     │
│  ─────────────────────────                                  │
│  • Linaje (qué eres)                                        │
│  • Entorno (dónde creciste)                                 │
│  • Trasfondo (qué te ocurrió)                               │
│  • Ocupación (qué haces)                                    │
│  • Potencia (en qué crees)                                  │
│                                                              │
│  RECURSOS                                                    │
│  ────────                                                   │
│  • Aguante (PA) = 5 + Vigor + Ocupación                     │
│  • Devoción (0-5) = recurso de la Potencia                  │
│  • Competencias (+1/+2/+3)                                  │
│  • Talentos de armas (Guerrero 3, Explorador 2, Erudito 1)  │
│                                                              │
│  PROGRESIÓN                                                  │
│  ──────────                                                 │
│  • 4 Sellos: Iniciado → Viaje → Héroe → Leyenda            │
│  • Puntos de Hito (PH) para mejoras                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 Funcionalidades Detalladas

#### 3.3.1 Character Builder (Wizard de las 5 Cartas)

| Funcionalidad | Descripción | Prioridad |
|---------------|-------------|-----------|
| **Paso 1: Datos Básicos** | Nombre, concepto, mundo | 🔥 Alta |
| **Paso 2: Linaje** | Selección con bonificadores | 🔥 Alta |
| **Paso 3: Entorno** | Selección con habilidades | 🔥 Alta |
| **Paso 4: Trasfondo** | Selección con competencias | 🔥 Alta |
| **Paso 5: Ocupación** | Arquetipo con Talentos | 🔥 Alta |
| **Paso 6: Potencia** | Fe/ideal con Devoción | 🔥 Alta |
| **Paso 7: Facetas** | Distribuir 18 puntos en 9 Facetas | 🔥 Alta |
| **Paso 8: Finalizar** | Resumen y cálculos automáticos | 🔥 Alta |
| **Randomizer** | Generación aleatoria coherente | Media |
| **Templates** | Pregenerados por ambientación | Media |

**Componentes UI:**
```
CharacterBuilder/
├── CharacterBuilderWizard.vue   # Wizard principal
├── steps/
│   ├── StepBasicInfo.vue        # Nombre, concepto, mundo
│   ├── StepLineage.vue          # Carta de Linaje
│   ├── StepEnvironment.vue      # Carta de Entorno
│   ├── StepBackground.vue       # Carta de Trasfondo
│   ├── StepOccupation.vue       # Carta de Ocupación + Talentos
│   ├── StepPotency.vue          # Carta de Potencia + Dogmas
│   ├── StepFacets.vue           # Distribuir 9 Facetas
│   └── StepFinalize.vue         # Resumen y confirmar
├── components/
│   ├── CardSelector.vue         # Selector visual de cartas
│   ├── FacetDistributor.vue     # Asignador de puntos
│   ├── TalentPicker.vue         # Selector de Talentos 3/2/1
│   └── PotencyPreview.vue       # Vista previa de Potencia
├── CharacterPreview.vue         # Vista previa lateral en tiempo real
└── CharacterRandomizer.vue      # Generador aleatorio
```

#### 3.3.2 Character Sheet (Hoja de Personaje)

| Funcionalidad | Descripción | Prioridad |
|---------------|-------------|-----------|
| **Header con Sello** | Nombre, mundo, Sello de Poder actual | 🔥 Alta |
| **9 Facetas por Arcano** | Físico/Mental/Espiritual visual | 🔥 Alta |
| **5 Cartas expandibles** | Cada carta con pasiva y bonificador | 🔥 Alta |
| **Recursos dinámicos** | Aguante (con estados de Herida), Devoción | 🔥 Alta |
| **Competencias** | Lista con niveles +1/+2/+3 | 🔥 Alta |
| **Talentos de armas** | Según arquetipo 3/2/1 | 🔥 Alta |
| **Panel de Potencia** | Dogmas, Intervenciones, uso de PD | 🔥 Alta |
| **Inventario** | Armas, armadura, equipo | Media |
| **Notas de sesión** | Log del jugador | Media |
| **Estados de herida** | Ileso → Herido → Malherido → Crítico | Media |
| **Modo impresión** | PDF estilo ficha clásica | Baja |
| **Compartir sheet** | URL pública | Baja |

**Componentes UI:**
```
CharacterSheet/
├── CharacterSheetPage.vue       # Página principal
├── sections/
│   ├── HeaderSection.vue        # Nombre, Sello, Mundo
│   ├── FacetsGrid.vue           # 9 Facetas en 3×3 por Arcano
│   ├── CardsAccordion.vue       # 5 Cartas expandibles
│   ├── ResourcesBar.vue         # Aguante + Devoción + Fatiga
│   ├── CompetenciesSection.vue  # Lista de Competencias
│   ├── TalentsSection.vue       # Talentos 3/2/1
│   ├── PotencyPanel.vue         # Dogmas + Intervenciones
│   ├── CombatPanel.vue          # Armas, Armadura, Estado Herida
│   ├── InventorySection.vue     # Items
│   └── NotesSection.vue         # Notas
├── widgets/
│   ├── WoundTracker.vue         # Tracker visual de estados de herida
│   ├── DevotionTracker.vue      # Puntos de Devoción 0-5
│   ├── DiceRoller.vue           # Tirador 2d12 integrado
│   └── CombatCalculator.vue     # Calculadora de Combate Decisivo
├── CharacterSheetPrint.vue      # Versión imprimible
└── CharacterShareModal.vue      # Compartir
```

#### 3.3.3 Sistema de Progresión (Sellos de Poder)

| Funcionalidad | Descripción | Prioridad |
|---------------|-------------|-----------|
| **Puntos de Hito (PH)** | Acumulación por logros narrativos | 🔥 Alta |
| **Cambio de Sello** | Iniciado (0) → Viaje (15) → Héroe (35) → Leyenda (60) | 🔥 Alta |
| **Mejora de Facetas** | +1 Faceta = 2 PH | 🔥 Alta |
| **Nuevas Competencias** | Nueva = 3 PH, +1 nivel = 2 PH | 🔥 Alta |
| **Evolución de Cartas** | Base → Evolucionada → Maestra | Media |
| **Cartas Secundarias** | Maestría, Legado, etc. | Media |
| **Respec limitado** | 1 por cambio de Sello | Baja |

**Sellos de Poder:**

| Sello | PH Requeridos | Max Faceta | Alcance Narrativo |
|-------|---------------|------------|-------------------|
| Iniciado | 0 | 3 | Local |
| Viaje | 15 | 4 | Regional |
| Héroe | 35 | 5 | Continental |
| Leyenda | 60+ | 6+ | Cósmico |

**Schema de datos:**
```sql
-- Personaje principal
CREATE TABLE characters (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  world_id INT REFERENCES world(id),
  name VARCHAR(100) NOT NULL,
  concept VARCHAR(200),
  
  -- Sello de Poder (progresión)
  seal VARCHAR(20) DEFAULT 'initiate',  -- 'initiate', 'journey', 'hero', 'legend'
  milestone_points INT DEFAULT 0,
  
  -- Las 5 Cartas Fundamentales
  lineage_card_id INT REFERENCES origin_cards(id),      -- Linaje
  environment_card_id INT REFERENCES origin_cards(id),  -- Entorno
  background_card_id INT REFERENCES origin_cards(id),   -- Trasfondo
  occupation_card_id INT REFERENCES occupation_cards(id), -- Ocupación
  potency_card_id INT REFERENCES potency_cards(id),     -- Potencia
  
  -- Recursos calculados
  endurance_max INT DEFAULT 7,       -- Aguante máximo (5 + Vigor + Ocupación)
  endurance_current INT DEFAULT 7,   -- Aguante actual
  devotion_current INT DEFAULT 1,    -- Devoción actual (0-5)
  wound_state VARCHAR(20) DEFAULT 'healthy',  -- 'healthy', 'hurt', 'wounded', 'critical'
  
  -- Metadata
  portrait_url TEXT,
  backstory TEXT,
  notes TEXT,
  is_public BOOLEAN DEFAULT false,
  share_code VARCHAR(12) UNIQUE,
  status VARCHAR(20) DEFAULT 'active',  -- 'active', 'retired', 'dead'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Las 9 Facetas del personaje
CREATE TABLE character_facets (
  character_id INT REFERENCES characters(id) ON DELETE CASCADE,
  arcana VARCHAR(20) NOT NULL,  -- 'physical', 'mental', 'spiritual'
  facet_name VARCHAR(20) NOT NULL,  -- 'strength', 'agility', etc.
  value INT DEFAULT 1 CHECK (value >= 1 AND value <= 6),
  PRIMARY KEY (character_id, facet_name)
);

-- Competencias del personaje
CREATE TABLE character_competencies (
  character_id INT REFERENCES characters(id) ON DELETE CASCADE,
  competency_name VARCHAR(50) NOT NULL,
  level INT DEFAULT 1 CHECK (level >= 1 AND level <= 3),
  source VARCHAR(50),  -- 'occupation', 'background', 'training'
  PRIMARY KEY (character_id, competency_name)
);

-- Talentos de armas (según arquetipo)
CREATE TABLE character_talents (
  character_id INT REFERENCES characters(id) ON DELETE CASCADE,
  weapon_type VARCHAR(50) NOT NULL,  -- 'swords', 'bows', 'staves', etc.
  talent_points INT DEFAULT 0 CHECK (talent_points >= 0 AND talent_points <= 3),
  PRIMARY KEY (character_id, weapon_type)
);

-- Evolución de las 5 Cartas
CREATE TABLE character_card_evolution (
  character_id INT REFERENCES characters(id) ON DELETE CASCADE,
  card_slot VARCHAR(20) NOT NULL,  -- 'lineage', 'environment', etc.
  evolution_level INT DEFAULT 1,  -- 1: Base, 2: Evolucionada, 3: Maestra
  unlocked_abilities JSONB,
  PRIMARY KEY (character_id, card_slot)
);

-- Cartas Secundarias (Maestría, Legado, etc.)
CREATE TABLE character_secondary_cards (
  id SERIAL PRIMARY KEY,
  character_id INT REFERENCES characters(id) ON DELETE CASCADE,
  card_type VARCHAR(20) NOT NULL,  -- 'mastery', 'legacy', 'specialization'
  card_id INT,
  acquired_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventario
CREATE TABLE character_inventory (
  id SERIAL PRIMARY KEY,
  character_id INT REFERENCES characters(id) ON DELETE CASCADE,
  item_name VARCHAR(100) NOT NULL,
  item_type VARCHAR(50),  -- 'weapon', 'armor', 'consumable', 'misc'
  damage INT,            -- Para armas
  protection INT,        -- Para armaduras
  quantity INT DEFAULT 1,
  notes TEXT,
  is_equipped BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Log de progresión y sesiones
CREATE TABLE character_log (
  id SERIAL PRIMARY KEY,
  character_id INT REFERENCES characters(id) ON DELETE CASCADE,
  session_id INT,
  entry_type VARCHAR(20),  -- 'milestone', 'seal_up', 'card_evolution', 'note'
  milestone_points INT DEFAULT 0,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cartas de Origen (contenido del sistema)
CREATE TABLE origin_cards (
  id SERIAL PRIMARY KEY,
  world_id INT REFERENCES world(id),
  card_type VARCHAR(20) NOT NULL,  -- 'lineage', 'environment', 'background'
  name VARCHAR(100) NOT NULL,
  name_es VARCHAR(100),
  description TEXT,
  description_es TEXT,
  facet_bonus VARCHAR(20),  -- Qué Faceta mejora
  passive_ability TEXT,
  passive_ability_es TEXT,
  competency_granted VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cartas de Ocupación
CREATE TABLE occupation_cards (
  id SERIAL PRIMARY KEY,
  world_id INT REFERENCES world(id),
  name VARCHAR(100) NOT NULL,
  name_es VARCHAR(100),
  archetype VARCHAR(20),  -- 'warrior', 'explorer', 'scholar'
  talent_points INT DEFAULT 2,  -- 3 for warrior, 2 for explorer, 1 for scholar
  endurance_bonus INT DEFAULT 1,
  competencies JSONB,  -- Lista de competencias incluidas
  description TEXT,
  description_es TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cartas de Potencia
CREATE TABLE potency_cards (
  id SERIAL PRIMARY KEY,
  world_id INT REFERENCES world(id),
  name VARCHAR(100) NOT NULL,
  name_es VARCHAR(100),
  description TEXT,
  description_es TEXT,
  dogmas JSONB,  -- Cómo ganar/perder Devoción
  minor_intervention TEXT,  -- Repetir dado de Destino
  major_intervention TEXT,  -- Habilidad única
  major_intervention_es TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.4 API Endpoints Fase 5

```
# Characters
GET    /api/characters                    # Mis personajes
GET    /api/characters/:id                # Detalle completo
GET    /api/characters/shared/:code       # PJ público por código
POST   /api/characters                    # Crear PJ
PATCH  /api/characters/:id                # Actualizar PJ
DELETE /api/characters/:id                # Eliminar (soft delete)
POST   /api/characters/:id/share          # Generar código compartir

# Progresión (Sellos y PH)
POST   /api/characters/:id/milestone      # Añadir Puntos de Hito
POST   /api/characters/:id/seal-up        # Cambiar de Sello
POST   /api/characters/:id/improve-facet  # Mejorar Faceta (2 PH)
POST   /api/characters/:id/add-competency # Nueva Competencia (3 PH)

# Las 5 Cartas
PATCH  /api/characters/:id/cards          # Actualizar cartas asignadas
POST   /api/characters/:id/evolve-card    # Evolucionar carta (Base→Evolucionada→Maestra)

# Facetas (9 valores)
GET    /api/characters/:id/facets         # Obtener las 9 Facetas
PATCH  /api/characters/:id/facets         # Actualizar Facetas

# Competencias y Talentos
GET    /api/characters/:id/competencies   # Lista de competencias
PATCH  /api/characters/:id/competencies   # Actualizar competencias
GET    /api/characters/:id/talents        # Talentos de armas
PATCH  /api/characters/:id/talents        # Actualizar talentos (3/2/1)

# Recursos de Combate
PATCH  /api/characters/:id/endurance      # Actualizar Aguante
PATCH  /api/characters/:id/devotion       # Actualizar Devoción
PATCH  /api/characters/:id/wound-state    # Cambiar estado de herida

# Inventario
GET    /api/characters/:id/inventory      # Inventario
POST   /api/characters/:id/inventory      # Añadir item
PATCH  /api/characters/:id/inventory/:id  # Actualizar item
DELETE /api/characters/:id/inventory/:id  # Eliminar item

# Log y Notas
GET    /api/characters/:id/log            # Historial de cambios
POST   /api/characters/:id/log            # Añadir entrada manual

# Contenido del Sistema (Cartas disponibles)
GET    /api/origin-cards                  # Cartas de origen por mundo
GET    /api/occupation-cards              # Cartas de ocupación
GET    /api/potency-cards                 # Cartas de potencia

# Templates y Pregenerados
GET    /api/character-templates           # Templates por mundo
POST   /api/characters/from-template/:id  # Crear desde template
```

### 3.5 Estimación Fase 5

| Componente | Esfuerzo | Duración |
|------------|----------|----------|
| **Gameplay Core** | | |
| Tirador 2d12 + Escala Destino | 1 semana | Sprint 1 |
| Calculadora Combate Decisivo | 1 semana | Sprint 1 |
| **Character Builder** | | |
| Wizard 5 Cartas | 3 semanas | Sprint 2-3 |
| Selector de Facetas | 1 semana | Sprint 2 |
| Panel de Potencia | 1 semana | Sprint 3 |
| **Character Sheet** | | |
| Hoja de Personaje UI | 3 semanas | Sprint 4-5 |
| Tracker Heridas/Devoción | 1 semana | Sprint 4 |
| **API y Backend** | | |
| API Characters completa | 2 semanas | Sprint 2-3 |
| Tablas de contenido (Cartas) | 1 semana | Sprint 1 |
| **Progresión** | | |
| Sistema Sellos + PH | 2 semanas | Sprint 6 |
| Evolución de Cartas | 1 semana | Sprint 6 |
| **Extras** | | |
| Templates pregenerados | 1 semana | Sprint 7 |
| Compartir y exportar | 1 semana | Sprint 7 |
| **Total Fase 5** | **~18 semanas** | **4-5 meses** |

---

## 4. Fase 6: Sistema de Partidas (VTT Básico)

### 4.1 Objetivo

Permitir **jugar partidas online** con funcionalidades de **Virtual Tabletop (VTT)** básico: sesiones en tiempo real, chat, dados, y gestión de estado.

### 4.2 Funcionalidades Detalladas

#### 4.2.1 Gestión de Campañas

| Funcionalidad | Descripción | Prioridad |
|---------------|-------------|-----------|
| **Crear campaña** | Nombre, mundo, descripción | 🔥 Alta |
| **Invitar jugadores** | Por email o código | 🔥 Alta |
| **Roles** | GM, jugador, espectador | 🔥 Alta |
| **Personajes de campaña** | Asociar PJs | 🔥 Alta |
| **Notas de campaña** | Wiki compartida | Media |
| **Calendario** | Programar sesiones | Media |
| **Archivos** | Subir mapas, handouts | Media |

**Schema:**
```sql
CREATE TABLE campaigns (
  id SERIAL PRIMARY KEY,
  owner_id INT REFERENCES users(id),
  world_id INT REFERENCES world(id),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'active',  -- active, paused, completed
  invite_code VARCHAR(12) UNIQUE,
  settings JSONB DEFAULT '{}',  -- Config de campaña
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE campaign_members (
  campaign_id INT REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL,  -- 'gm', 'player', 'spectator'
  character_id INT REFERENCES characters(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (campaign_id, user_id)
);

CREATE TABLE campaign_notes (
  id SERIAL PRIMARY KEY,
  campaign_id INT REFERENCES campaigns(id) ON DELETE CASCADE,
  author_id INT REFERENCES users(id),
  title VARCHAR(200),
  content TEXT,
  is_gm_only BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE campaign_files (
  id SERIAL PRIMARY KEY,
  campaign_id INT REFERENCES campaigns(id) ON DELETE CASCADE,
  uploaded_by INT REFERENCES users(id),
  filename VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(50),  -- 'map', 'handout', 'character_art'
  is_gm_only BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 4.2.2 Sistema de Sesiones en Tiempo Real

| Funcionalidad | Descripción | Prioridad |
|---------------|-------------|-----------|
| **Crear sesión** | Iniciar partida live | 🔥 Alta |
| **Unirse a sesión** | Join por código/link | 🔥 Alta |
| **Estado de conexión** | Quién está online | 🔥 Alta |
| **Chat de texto** | Mensajes en tiempo real | 🔥 Alta |
| **Chat de voz** | Integración WebRTC (opcional) | Baja |

**Sistema de Dados "Giro Tarot":**

| Funcionalidad | Descripción | Prioridad |
|---------------|-------------|-----------|
| **Tirador 2d12** | Dado Habilidad (azul) + Dado Destino (dorado) | 🔥 Alta |
| **Escala del Destino** | Cálculo automático (+6 a -6) y Giro | 🔥 Alta |
| **Modificadores** | +Faceta +Competencia +Talento vs Dificultad | 🔥 Alta |
| **Combate Decisivo** | Bonus daño por margen (+1/+2/+3) | 🔥 Alta |
| **Estados de Herida** | Aplicar penalizadores automáticos | Media |
| **Historial narrativo** | "Éxito con Bendición Mayor" en log | 🔥 Alta |
| **Dados privados** | GM-only rolls | Media |
| **Macros de PJ** | "Atacar con Espada" = auto-calcular | Media |

**Resultado de tirada visualizado:**
```
┌─────────────────────────────────────────────────────────────┐
│  🎲 LAN ataca con Espada                                    │
│  ─────────────────────────────────────────────────────────  │
│  Habilidad: [10] + Fuerza (4) + Espadas (+2) + Talento (+2) │
│  Total: 18 vs Dificultad 9 = ✅ ÉXITO (margen +9)           │
│  ─────────────────────────────────────────────────────────  │
│  Destino: [4]                                               │
│  Balanza: 10 - 4 = +6 → ⭐ BENDICIÓN MAYOR                  │
│  ─────────────────────────────────────────────────────────  │
│  💥 Daño: 3 (espada) + 3 (bonus) = 6                        │
└─────────────────────────────────────────────────────────────┘
```

**Tecnologías recomendadas:**
- **WebSocket**: Socket.io o ws para tiempo real
- **Redis**: Pub/sub para escalar sesiones
- **WebRTC**: Para voz (opcional, puede usar Discord/etc.)

**Schema:**
```sql
CREATE TABLE sessions (
  id SERIAL PRIMARY KEY,
  campaign_id INT REFERENCES campaigns(id) ON DELETE CASCADE,
  name VARCHAR(100),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'active',  -- active, paused, ended
  summary TEXT  -- Resumen post-sesión
);

CREATE TABLE session_participants (
  session_id INT REFERENCES sessions(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id),
  character_id INT REFERENCES characters(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  PRIMARY KEY (session_id, user_id)
);

CREATE TABLE session_messages (
  id SERIAL PRIMARY KEY,
  session_id INT REFERENCES sessions(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id),
  message_type VARCHAR(20),  -- 'chat', 'roll', 'action', 'whisper', 'system'
  content TEXT NOT NULL,
  target_user_id INT,  -- Para whispers
  metadata JSONB,  -- Datos del dado, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tiradas con sistema Giro Tarot (2d12)
CREATE TABLE dice_rolls (
  id SERIAL PRIMARY KEY,
  session_id INT REFERENCES sessions(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id),
  character_id INT REFERENCES characters(id),
  
  -- Dados del Giro Tarot
  ability_die INT NOT NULL,           -- Dado de Habilidad (1-12)
  destiny_die INT NOT NULL,           -- Dado de Destino (1-12)
  
  -- Modificadores
  facet_value INT DEFAULT 0,          -- Valor de la Faceta usada
  competency_bonus INT DEFAULT 0,     -- Bonus de Competencia (+1/+2/+3)
  talent_bonus INT DEFAULT 0,         -- Bonus de Talento
  wound_penalty INT DEFAULT 0,        -- Penalizador por herida (-1/-2/-3)
  other_modifiers INT DEFAULT 0,      -- Otros modificadores
  
  -- Cálculos
  total INT NOT NULL,                 -- ability_die + modifiers
  difficulty INT DEFAULT 9,           -- Dificultad objetivo
  is_success BOOLEAN NOT NULL,        -- total >= difficulty
  success_margin INT,                 -- total - difficulty (si éxito)
  
  -- Escala del Destino
  balance INT NOT NULL,               -- ability_die - destiny_die
  destiny_scale VARCHAR(20),          -- 'major_blessing', 'minor_blessing', etc.
  is_twist BOOLEAN DEFAULT false,     -- Dados iguales = Giro del Destino
  
  -- Combate Decisivo (si aplica)
  damage_bonus INT DEFAULT 0,         -- +1/+2/+3 por margen
  
  -- Metadata
  label VARCHAR(100),                 -- 'Ataque con Espada'
  action_type VARCHAR(20),            -- 'attack', 'skill', 'magic', 'social'
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 4.2.3 VTT Features (Básico)

| Funcionalidad | Descripción | Prioridad |
|---------------|-------------|-----------|
| **Canvas de mapa** | Mostrar imagen de fondo | Media |
| **Tokens** | Representar personajes/NPCs | Media |
| **Mover tokens** | Drag & drop | Media |
| **Fog of war** | GM revela áreas | Baja |
| **Medición** | Herramienta de distancia | Baja |
| **Dibujo** | Anotaciones en mapa | Baja |
| **Initiative tracker** | Orden de turno | Media |
| **Estado de PJs** | HP visible para todos | Media |

**Componentes UI:**
```
Session/
├── SessionPage.vue              # Página principal de sesión
├── panels/
│   ├── ChatPanel.vue            # Chat + rolls
│   ├── DicePanel.vue            # Tirador de dados
│   ├── ParticipantsPanel.vue    # Lista de jugadores
│   ├── InitiativePanel.vue      # Tracker de iniciativa
│   └── CharacterPanel.vue       # Mini sheet del PJ
├── map/
│   ├── MapCanvas.vue            # Canvas principal
│   ├── Token.vue                # Componente de token
│   ├── FogOfWar.vue             # Niebla de guerra
│   └── MeasureTool.vue          # Medición
└── modals/
    ├── DiceRollModal.vue        # Modal de tirada
    └── TokenEditModal.vue       # Editar token
```

### 4.3 API Endpoints Fase 6

```
# Campaigns
GET    /api/campaigns                     # Mis campañas
GET    /api/campaigns/:id                 # Detalle
POST   /api/campaigns                     # Crear
PATCH  /api/campaigns/:id                 # Actualizar
DELETE /api/campaigns/:id                 # Eliminar
POST   /api/campaigns/:id/invite          # Generar invitación
POST   /api/campaigns/join/:code          # Unirse
GET    /api/campaigns/:id/members         # Miembros
PATCH  /api/campaigns/:id/members/:userId # Cambiar rol
DELETE /api/campaigns/:id/members/:userId # Expulsar

# Sessions
GET    /api/campaigns/:id/sessions        # Sesiones de campaña
POST   /api/campaigns/:id/sessions        # Crear sesión
GET    /api/sessions/:id                  # Detalle de sesión
PATCH  /api/sessions/:id                  # Actualizar (pausar, terminar)
DELETE /api/sessions/:id                  # Eliminar

# Real-time (WebSocket)
WS     /ws/session/:id                    # Conexión de sesión
  → join                                  # Unirse
  → leave                                 # Salir
  → chat                                  # Enviar mensaje
  → roll                                  # Tirar dados
  → whisper                               # Mensaje privado
  → token:move                            # Mover token
  → initiative:update                     # Actualizar iniciativa
  → state:sync                            # Sincronizar estado

# Dice
POST   /api/dice/roll                     # Tirada (también vía WS)
GET    /api/sessions/:id/rolls            # Historial de tiradas
```

### 4.4 Estimación Fase 6

| Componente | Esfuerzo | Duración |
|------------|----------|----------|
| Campañas CRUD + invitaciones | 2 semanas | Sprint 1 |
| Sesiones + WebSocket básico | 4 semanas | Sprint 2-3 |
| Chat en tiempo real | 2 semanas | Sprint 3-4 |
| Sistema de dados | 2 semanas | Sprint 4 |
| Initiative tracker | 1 semana | Sprint 5 |
| VTT básico (canvas + tokens) | 4 semanas | Sprint 6-7 |
| **Total Fase 6** | **15 semanas** | **4 meses** |

---

## 5. Fase 7: Comunidad y UGC

### 5.1 Funcionalidades

| Funcionalidad | Descripción | Prioridad |
|---------------|-------------|-----------|
| **Mundos comunitarios** | Usuarios crean mundos públicos | Media |
| **Cartas custom** | Crear cartas con editor | Media |
| **Rating y reviews** | Valorar contenido | Media |
| **Seguir creadores** | Feed de contenido | Baja |
| **Reportar contenido** | Moderación | Media |
| **Marketplace** | Venta de contenido premium | Baja |
| **Torneos** | Organizar competiciones | Baja |
| **Logros** | Sistema de achievements | Baja |

---

## 6. Fase 8: Mobile y PWA

### 6.1 Funcionalidades

| Funcionalidad | Descripción | Prioridad |
|---------------|-------------|-----------|
| **PWA** | Instalable, offline básico | Media |
| **Companion app** | Quick access a sheets | Media |
| **Notificaciones push** | Alertas de sesión | Media |
| **Modo offline** | Consultar PJ sin conexión | Baja |
| **Widget de dados** | Tirador rápido | Baja |

---

## 7. Resumen de Fases

| Fase | Funcionalidad Principal | Duración Est. | Equipo |
|------|------------------------|---------------|--------|
| **Fase 4** | World Cards + Deck Builder | 2-3 meses | 1-2 devs |
| **Fase 5** | Character Builder + Sheet | 3 meses | 1-2 devs |
| **Fase 6** | Partidas en tiempo real | 4 meses | 2-3 devs |
| **Fase 7** | Comunidad + UGC | 3 meses | 2 devs |
| **Fase 8** | Mobile + PWA | 2 meses | 1-2 devs |
| **Total** | **Plataforma completa** | **14-15 meses** | - |

---

## 8. Funcionalidades Adicionales Sugeridas

### 8.1 Herramientas de GM

| Funcionalidad | Descripción |
|---------------|-------------|
| **Generador de NPCs** | Crear NPCs aleatorios |
| **Generador de encuentros** | Balancear combates |
| **Biblioteca de monstruos** | Catálogo de enemigos |
| **Soundboard** | Efectos de sonido ambiente |
| **Weather/Time tracker** | Gestión de tiempo en partida |
| **Random tables** | Tablas aleatorias configurables |

### 8.2 Integraciones

| Integración | Descripción |
|-------------|-------------|
| **Discord bot** | Tirar dados en Discord |
| **Twitch extension** | Overlay para streaming |
| **Export a PDF** | Hojas imprimibles |
| **Import desde otros VTT** | Foundry, Roll20 |
| **Obsidian plugin** | Vincular notas |
| **API pública** | Para desarrolladores |

### 8.3 Gamificación

| Funcionalidad | Descripción |
|---------------|-------------|
| **Logros de jugador** | Por horas jugadas, PJs creados |
| **Logros de GM** | Por sesiones dirigidas |
| **Ranking de creadores** | Top contenido |
| **Eventos estacionales** | Challenges temporales |
| **Referral program** | Invitar amigos |

---

## 9. Dependencias entre Fases

```
Fase 4 (World Cards)
    │
    ├─── Fase 5 (Characters) ←─ Requiere cartas para mazos
    │         │
    │         └─── Fase 6 (Partidas) ←─ Requiere personajes
    │                   │
    │                   └─── Fase 7 (Comunidad) ←─ Requiere partidas
    │
    └─── Fase 8 (Mobile) ←─ Puede desarrollarse en paralelo tras Fase 4

Requisitos previos:
- Fase 4 requiere: World Card CRUD actual (ya existe parcial)
- Fase 5 requiere: Fase 4 completa
- Fase 6 requiere: Fase 5 completa + WebSocket infrastructure
- Fase 7 requiere: Fase 6 completa
- Fase 8 puede empezar tras Fase 4
```

---

*Este planning está sujeto a revisiones según feedback de usuarios y prioridades del negocio.*
