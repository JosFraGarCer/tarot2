# 🔗 Integración Sistema de Juego - Aplicación Tarot2

## 1. Visión de Integración

### 1.1 Estado Actual

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    RELACIÓN SISTEMA ↔ APP                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   SISTEMA DE JUEGO              APP TAROT2                              │
│   (sistema_tarot/)              (app/)                                  │
│                                                                          │
│   📜 Reglas escritas    →    📊 CMS de contenido                        │
│   🎴 Cartas conceptuales →    🗃️ Entidades en BD                        │
│   ⚔️ Mecánicas         →    🔧 Herramientas (futuro)                   │
│                                                                          │
│   Versión: 0.1.2.0            Versión: En desarrollo                    │
│   Estado: Borrador            Estado: CMS funcional                     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Mapeo Conceptual Actual

| Concepto del Sistema | Entidad en BD | Estado |
|---------------------|---------------|--------|
| Arcanos | `arcana` | ✅ Implementado |
| Facetas | `facet` | ✅ Implementado |
| Skills/Habilidades | `base_skills` | ✅ Implementado |
| Cartas Base | `base_card` | ✅ Implementado |
| Cartas de Mundo | `world_card` | ✅ Implementado |
| Mundos/Ambientaciones | `world` | ✅ Implementado |
| Tipos de Carta | `base_card_type` | ✅ Implementado |
| Tags/Categorías | `tags` | ✅ Implementado |
| Efectos | `card_effects` | ✅ Implementado |
| **Personajes** | - | ❌ No implementado |
| **Mazos** | - | ❌ No implementado |
| **Sesiones** | - | ❌ No implementado |

---

## 2. Análisis de Entidades Existentes

### 2.1 Arcanos (arcana)

**En el sistema:**
- 3 Arcanos: Físico, Mental, Espiritual
- Cada uno contiene 3 Facetas
- Definen la estructura de atributos

**En la BD:**
```sql
arcana (
  id, code, image, status, is_active, 
  created_at, updated_at, created_by, updated_by
)
arcana_translations (
  arcana_id, language_code, name, short_text, description
)
```

**Mapeo:** ✅ Correcto. El sistema define 3 arcanos que la app puede gestionar.

### 2.2 Facetas (facet)

**En el sistema:**
- 9 Facetas distribuidas en 3 Arcanos
- Valores de 0-9 (típicamente 0-5 para PJs)
- Base de todas las tiradas

**En la BD:**
```sql
facet (
  id, code, arcana_id, status, is_active,
  created_at, updated_at
)
facet_translations (
  facet_id, language_code, name, short_text, description
)
```

**Mapeo:** ✅ Correcto. Relación con arcana correcta.

**Sugerencia:** Añadir campo `order` para ordenar dentro del arcano.

### 2.3 Skills (base_skills)

**En el sistema:**
- Competencias (+0 a +3)
- Vinculadas a Facetas para tiradas
- Otorgadas por Cartas (Entorno, Ocupación)

**En la BD:**
```sql
base_skills (
  id, code, facet_id, status, is_active,
  created_at, updated_at
)
base_skills_translations (
  skill_id, language_code, name, short_text, description
)
```

**Mapeo:** ✅ Correcto. Relación con faceta correcta.

### 2.4 Cartas Base (base_card)

**En el sistema:**
- 5 tipos: Linaje, Entorno, Trasfondo, Ocupación, Potencia
- Cada tipo otorga beneficios específicos
- Definen al personaje

**En la BD:**
```sql
base_card (
  id, code, card_type_id, status, is_active,
  created_at, updated_at, created_by, updated_by
)
base_card_translations (
  base_card_id, language_code, name, short_text, description
)
```

**Mapeo:** ⚠️ Parcial. Falta estructura para beneficios mecánicos.

**Campos sugeridos:**
```sql
-- Añadir a base_card:
bonus_facet_id INT REFERENCES facet(id),     -- +1 a qué faceta
bonus_value INT DEFAULT 1,                    -- Valor del bonus
stamina_points INT,                           -- PA (para Ocupaciones)
passive_ability TEXT,                         -- Descripción de pasiva
special_ability TEXT,                         -- Habilidad especial
-- O usar card_effects para esto (más flexible)
```

### 2.5 Efectos (card_effects)

**En el sistema:**
- Efectos de cartas (daño, protección, modificadores)
- Efectos de hechizos
- Efectos de estados

**En la BD:**
```sql
card_effects (
  id, base_card_id, effect_type_id, target_id,
  value, duration, conditions, 
  created_at, updated_at
)
```

**Mapeo:** ✅ Flexible. Puede modelar la mayoría de efectos.

**Ejemplo de uso:**
```json
// Carta "Legionario" - Ocupación
{
  "effects": [
    { "type": "bonus_facet", "target": "fuerza", "value": 1 },
    { "type": "stamina", "value": 14 },
    { "type": "competence", "target": "armas_militares", "value": 2 }
  ]
}
```

---

## 3. Entidades a Implementar

### 3.1 Personajes (characters)

**Requisitos del sistema:**
- 5 Cartas fundamentales
- 9 valores de Facetas
- Puntos de Aguante actuales/máximos
- Puntos de Devoción
- Sello actual
- Competencias adquiridas

**Schema propuesto:**
```sql
CREATE TABLE characters (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  world_id INT REFERENCES world(id),
  
  -- Identidad
  name VARCHAR(100) NOT NULL,
  concept VARCHAR(200),
  portrait_url TEXT,
  
  -- Las 5 Cartas
  lineage_card_id INT REFERENCES base_card(id),
  environment_card_id INT REFERENCES base_card(id),
  background_card_id INT REFERENCES base_card(id),
  occupation_card_id INT REFERENCES base_card(id),
  potency_card_id INT REFERENCES base_card(id),
  
  -- Arcanos (distribución 5-3-1)
  primary_arcana_id INT REFERENCES arcana(id),
  secondary_arcana_id INT REFERENCES arcana(id),
  tertiary_arcana_id INT REFERENCES arcana(id),
  
  -- Progresión
  seal_level INT DEFAULT 1 CHECK (seal_level BETWEEN 1 AND 4),
  milestone_points INT DEFAULT 0,
  milestone_spent INT DEFAULT 0,
  
  -- Recursos
  stamina_current INT,
  stamina_max INT,
  devotion_points INT DEFAULT 3,
  
  -- Estado
  status VARCHAR(20) DEFAULT 'active',
  is_public BOOLEAN DEFAULT false,
  share_code VARCHAR(12) UNIQUE,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE character_facets (
  character_id INT REFERENCES characters(id) ON DELETE CASCADE,
  facet_id INT REFERENCES facet(id),
  base_value INT DEFAULT 0 CHECK (base_value BETWEEN 0 AND 9),
  bonus_value INT DEFAULT 0,  -- De cartas
  PRIMARY KEY (character_id, facet_id)
);

CREATE TABLE character_skills (
  character_id INT REFERENCES characters(id) ON DELETE CASCADE,
  skill_id INT REFERENCES base_skills(id),
  level INT DEFAULT 1 CHECK (level BETWEEN 1 AND 3),
  source VARCHAR(50),  -- 'environment', 'occupation', 'milestone'
  PRIMARY KEY (character_id, skill_id)
);

CREATE TABLE character_conditions (
  id SERIAL PRIMARY KEY,
  character_id INT REFERENCES characters(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  effect_modifier INT DEFAULT 0,
  description TEXT,
  duration VARCHAR(50),
  applied_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.2 Mazos (decks)

**Requisitos del sistema:**
- Cartas de mundo seleccionadas
- Validación de reglas (min/max, restricciones)
- Versionado

**Schema propuesto:**
```sql
CREATE TABLE decks (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  character_id INT REFERENCES characters(id),  -- Opcional
  world_id INT REFERENCES world(id),
  
  name VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- Validación
  min_cards INT DEFAULT 40,
  max_cards INT DEFAULT 60,
  card_count INT DEFAULT 0,
  is_valid BOOLEAN DEFAULT false,
  validation_errors JSONB DEFAULT '[]',
  
  -- Compartir
  is_public BOOLEAN DEFAULT false,
  share_code VARCHAR(12) UNIQUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE deck_cards (
  deck_id INT REFERENCES decks(id) ON DELETE CASCADE,
  world_card_id INT REFERENCES world_card(id),
  quantity INT DEFAULT 1 CHECK (quantity BETWEEN 1 AND 4),
  PRIMARY KEY (deck_id, world_card_id)
);
```

### 3.3 Campañas y Sesiones

**Ver documento 14-PLANNING-FUNCIONALIDADES.md** para schemas completos.

---

## 4. Flujos de Integración

### 4.1 Flujo de Creación de Personaje

```
┌─────────────────────────────────────────────────────────────────────────┐
│                  FLUJO: CREAR PERSONAJE                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. SELECCIONAR MUNDO                                                    │
│     └─→ GET /api/world (filtrado por activos)                           │
│                                                                          │
│  2. ELEGIR 5 CARTAS                                                      │
│     ├─→ GET /api/base_card?type=lineage&world_id=X                      │
│     ├─→ GET /api/base_card?type=environment&world_id=X                  │
│     ├─→ GET /api/base_card?type=background&world_id=X                   │
│     ├─→ GET /api/base_card?type=occupation&world_id=X                   │
│     └─→ GET /api/base_card?type=potency&world_id=X                      │
│                                                                          │
│  3. DISTRIBUIR FACETAS                                                   │
│     └─→ GET /api/arcana (con facetas anidadas)                          │
│     └─→ Validar: 5+3+1 puntos, max 3 por faceta                         │
│                                                                          │
│  4. CALCULAR DERIVADOS                                                   │
│     ├─→ Aplicar bonos de cartas (+1 Faceta de Linaje/Ocupación)         │
│     ├─→ Calcular PA (de Ocupación)                                      │
│     └─→ Registrar skills iniciales (de Entorno/Ocupación)               │
│                                                                          │
│  5. GUARDAR PERSONAJE                                                    │
│     └─→ POST /api/characters                                            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Flujo de Tirada (Futuro - Sesiones)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                  FLUJO: REALIZAR TIRADA                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. SELECCIONAR FACETA                                                   │
│     └─→ Obtener valor base + bonus de character_facets                  │
│                                                                          │
│  2. SELECCIONAR SKILL (opcional)                                         │
│     └─→ Obtener nivel de character_skills                               │
│                                                                          │
│  3. APLICAR MODIFICADORES                                                │
│     ├─→ Herramientas (+1 a +3)                                          │
│     ├─→ Condiciones (character_conditions)                              │
│     └─→ Circunstancias (input del DJ)                                   │
│                                                                          │
│  4. LANZAR DADOS                                                         │
│     ├─→ d12 Habilidad (random)                                          │
│     └─→ d12 Destino (random)                                            │
│                                                                          │
│  5. CALCULAR RESULTADO                                                   │
│     ├─→ Éxito: (Habilidad + mod) ≥ dificultad                           │
│     ├─→ Destino: 1-4 Adverso, 5-8 Neutral, 9-12 Favorable               │
│     └─→ Giro: dados iguales                                             │
│                                                                          │
│  6. REGISTRAR EN LOG                                                     │
│     └─→ POST /api/sessions/:id/rolls                                    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Componentes UI Necesarios

### 5.1 Para Gestión de Contenido (Manage)

| Componente | Estado | Prioridad |
|------------|--------|-----------|
| ManageArcana | ✅ Existe | - |
| ManageFacet | ✅ Existe | - |
| ManageSkill | ✅ Existe | - |
| ManageBaseCard | ✅ Existe | - |
| ManageCardType | ✅ Existe | - |
| ManageWorld | ✅ Existe | - |
| ManageWorldCard | ✅ Existe | - |
| ManageEffect | ⚠️ Parcial | Alta |

### 5.2 Para Jugadores (Player - Nuevo)

| Componente | Estado | Prioridad |
|------------|--------|-----------|
| CharacterBuilderWizard | ❌ Nuevo | 🔥 Alta |
| CharacterSheet | ❌ Nuevo | 🔥 Alta |
| DeckBuilder | ❌ Nuevo | 🔥 Alta |
| DiceRoller | ❌ Nuevo | Media |
| CollectionManager | ❌ Nuevo | Media |

### 5.3 Para Game Masters (GM - Nuevo)

| Componente | Estado | Prioridad |
|------------|--------|-----------|
| CampaignManager | ❌ Nuevo | Media |
| SessionRunner | ❌ Nuevo | Media |
| NPCGenerator | ❌ Nuevo | Baja |
| EncounterBuilder | ❌ Nuevo | Baja |

---

## 6. API Endpoints a Implementar

### 6.1 Characters API

```typescript
// CRUD básico
GET    /api/characters                    // Lista del usuario
GET    /api/characters/:id                // Detalle con facetas/skills
POST   /api/characters                    // Crear personaje
PATCH  /api/characters/:id                // Actualizar
DELETE /api/characters/:id                // Eliminar (soft)

// Acciones específicas
POST   /api/characters/:id/level-up       // Subir de sello
POST   /api/characters/:id/spend-milestone // Gastar PH
POST   /api/characters/:id/add-condition  // Añadir condición
DELETE /api/characters/:id/conditions/:conditionId
PATCH  /api/characters/:id/resources      // Actualizar PA/Devoción

// Compartir
POST   /api/characters/:id/share          // Generar código
GET    /api/characters/shared/:code       // Ver personaje público
```

### 6.2 Decks API

```typescript
GET    /api/decks                         // Mis mazos
GET    /api/decks/:id                     // Detalle con cartas
POST   /api/decks                         // Crear mazo
PATCH  /api/decks/:id                     // Actualizar
DELETE /api/decks/:id                     // Eliminar

POST   /api/decks/:id/cards               // Añadir carta
PATCH  /api/decks/:id/cards/:cardId       // Cambiar cantidad
DELETE /api/decks/:id/cards/:cardId       // Quitar carta
POST   /api/decks/:id/validate            // Validar reglas
```

### 6.3 Dice API

```typescript
POST   /api/dice/roll                     // Tirada simple
{
  "skillDie": true,          // d12 habilidad
  "fateDie": true,           // d12 destino
  "modifier": 5,             // Modificador total
  "difficulty": 9,           // Dificultad
  "label": "Ataque con espada"
}

// Response
{
  "skillRoll": 8,
  "fateRoll": 3,
  "total": 13,               // skillRoll + modifier
  "success": true,           // total >= difficulty
  "fateResult": "adverse",   // 1-4
  "isTwist": false,          // dados iguales
  "margin": 4                // diferencia con dificultad
}
```

---

## 7. Validaciones de Reglas

### 7.1 Validación de Personaje

```typescript
// composables/useCharacterValidation.ts

interface CharacterValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

function validateCharacter(character: Character): CharacterValidation {
  const errors: string[] = []
  const warnings: string[] = []
  
  // 1. Verificar 5 cartas
  if (!character.lineageCardId) errors.push('Falta carta de Linaje')
  if (!character.environmentCardId) errors.push('Falta carta de Entorno')
  if (!character.backgroundCardId) errors.push('Falta carta de Trasfondo')
  if (!character.occupationCardId) errors.push('Falta carta de Ocupación')
  if (!character.potencyCardId) errors.push('Falta carta de Potencia')
  
  // 2. Verificar distribución de facetas
  const arcanaPoints = calculateArcanaPoints(character.facets)
  if (arcanaPoints.primary !== 5) errors.push('Arcano primario debe tener 5 puntos')
  if (arcanaPoints.secondary !== 3) errors.push('Arcano secundario debe tener 3 puntos')
  if (arcanaPoints.tertiary !== 1) errors.push('Arcano terciario debe tener 1 punto')
  
  // 3. Verificar límites por sello
  const maxFacet = getMaxFacetBySeal(character.sealLevel)
  for (const facet of character.facets) {
    if (facet.totalValue > maxFacet) {
      errors.push(`${facet.name} excede el máximo para Sello ${character.sealLevel}`)
    }
  }
  
  // 4. Verificar puntos de hito gastados
  const spentValid = character.milestoneSpent <= character.milestonePoints
  if (!spentValid) errors.push('Puntos de hito gastados exceden los ganados')
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}
```

### 7.2 Validación de Mazo

```typescript
// composables/useDeckValidation.ts

interface DeckValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
  stats: DeckStats
}

function validateDeck(deck: Deck): DeckValidation {
  const errors: string[] = []
  const warnings: string[] = []
  
  // 1. Verificar cantidad de cartas
  if (deck.cardCount < deck.minCards) {
    errors.push(`Mínimo ${deck.minCards} cartas (tienes ${deck.cardCount})`)
  }
  if (deck.cardCount > deck.maxCards) {
    errors.push(`Máximo ${deck.maxCards} cartas (tienes ${deck.cardCount})`)
  }
  
  // 2. Verificar copias por carta (max 4)
  for (const card of deck.cards) {
    if (card.quantity > 4) {
      errors.push(`${card.name}: máximo 4 copias`)
    }
  }
  
  // 3. Verificar restricciones de mundo
  for (const card of deck.cards) {
    if (card.worldId !== deck.worldId) {
      errors.push(`${card.name} no pertenece al mundo del mazo`)
    }
  }
  
  // 4. Calcular estadísticas
  const stats = calculateDeckStats(deck)
  
  // 5. Warnings de balance
  if (stats.averageCost > 4) {
    warnings.push('Curva de coste muy alta')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    stats
  }
}
```

---

## 8. Roadmap de Integración

### 8.1 Fase 1: Fundamentos (4 semanas)

| Tarea | Descripción | Estimación |
|-------|-------------|------------|
| Schema characters | Crear tablas en BD | 3 días |
| API characters | CRUD completo | 1 semana |
| CharacterBuilder UI | Wizard de creación | 2 semanas |
| Validaciones | Reglas del sistema | 1 semana |

### 8.2 Fase 2: Deck Building (3 semanas)

| Tarea | Descripción | Estimación |
|-------|-------------|------------|
| Schema decks | Crear tablas en BD | 2 días |
| API decks | CRUD + validación | 1 semana |
| DeckBuilder UI | Interface de construcción | 2 semanas |

### 8.3 Fase 3: Herramientas de Juego (2 semanas)

| Tarea | Descripción | Estimación |
|-------|-------------|------------|
| API dice | Endpoint de tiradas | 2 días |
| DiceRoller UI | Componente de dados | 1 semana |
| CharacterSheet UI | Hoja interactiva | 1 semana |

### 8.4 Total Estimado

**10-12 semanas** para integración básica del sistema de juego.

---

## 9. Conclusión

La app Tarot2 tiene una **base sólida** para integrar el sistema de juego:

- ✅ Entidades de contenido (Arcanos, Facetas, Cartas) ya existen
- ✅ Sistema de efectos flexible
- ✅ Infraestructura CRUD robusta
- ⚠️ Falta: Personajes, Mazos, Sesiones
- ⚠️ Falta: UI de jugador (Character Builder, Deck Builder)

**La integración es viable y bien alineada** con la arquitectura existente. Los schemas propuestos siguen los patrones establecidos y reutilizan la infraestructura de la app.

---

*Este documento debe actualizarse conforme avance la integración.*
