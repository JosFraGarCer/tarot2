# Análisis de Base de Datos para Cartas de Proyecto Tarot

## Estructura Actual Identificada

### Tablas Principales Detectadas

**world**: Representa diferentes ambientaciones o mundos de juego
**world_card**: Cartas específicas de cada mundo/ambientación  
**world_translations** y **world_card_translations**: Sistema de internacionalización
**base_skills**: Habilidades base del sistema
**facet**: Facetas del sistema (Físico, Mental, Espiritual)

### Fortalezas del Diseño Actual

**Internacionalización completa**: Sistema robusto de traducciones que permite múltiples idiomas.

**Separación por mundos**: Permite cartas específicas para diferentes ambientaciones manteniendo el sistema base.

**Estructura normalizada**: Relaciones claras entre entidades con claves foráneas apropiadas.

**Flexibilidad de contenido**: Campos para nombre, texto corto, y descripción completa.

## Propuesta de Estructura Completa

### Tablas Base del Sistema

```sql
-- Arquetipos base (Guerrero, Místico, etc.)
CREATE TABLE archetypes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    base_health_points INTEGER NOT NULL,
    image VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    sort INTEGER DEFAULT 0
);

-- Facetas (ya existe)
CREATE TABLE facets (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    archetype_type ENUM('physical', 'mental', 'spiritual') NOT NULL,
    image VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    sort INTEGER DEFAULT 0
);

-- Tipos de cartas (Linaje, Entorno, Trasfondo, Ocupación, Potencia)
CREATE TABLE card_types (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    image VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    sort INTEGER DEFAULT 0
);

-- Sellos de Poder
CREATE TABLE power_seals (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    level INTEGER NOT NULL,
    max_facet_value INTEGER NOT NULL,
    milestone_points_required INTEGER,
    image VARCHAR(255),
    is_active BOOLEAN DEFAULT true
);
```

### Tablas de Cartas

```sql
-- Cartas base (universales)
CREATE TABLE base_cards (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    card_type_id INTEGER NOT NULL REFERENCES card_types(id),
    facet_bonus_id INTEGER REFERENCES facets(id),
    facet_bonus_value INTEGER DEFAULT 0,
    health_points_bonus INTEGER DEFAULT 0,
    image VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    sort INTEGER DEFAULT 0
);

-- Cartas específicas de mundo (ya existe como world_card)
CREATE TABLE world_cards (
    id SERIAL PRIMARY KEY,
    world_id INTEGER NOT NULL REFERENCES worlds(id),
    base_card_id INTEGER REFERENCES base_cards(id),
    code VARCHAR(50) NOT NULL,
    card_type_id INTEGER NOT NULL REFERENCES card_types(id),
    facet_bonus_id INTEGER REFERENCES facets(id),
    facet_bonus_value INTEGER DEFAULT 0,
    health_points_bonus INTEGER DEFAULT 0,
    image VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    sort INTEGER DEFAULT 0,
    UNIQUE(world_id, code)
);

-- Habilidades especiales de cartas
CREATE TABLE card_abilities (
    id SERIAL PRIMARY KEY,
    card_id INTEGER, -- Puede ser base_card o world_card
    card_type ENUM('base', 'world') NOT NULL,
    ability_type ENUM('passive', 'active', 'devotion') NOT NULL,
    trigger_condition VARCHAR(255),
    uses_per_session INTEGER,
    uses_per_day INTEGER,
    devotion_points_cost INTEGER,
    is_active BOOLEAN DEFAULT true
);

-- Competencias otorgadas por cartas
CREATE TABLE card_competencies (
    id SERIAL PRIMARY KEY,
    card_id INTEGER,
    card_type ENUM('base', 'world') NOT NULL,
    base_skill_id INTEGER NOT NULL REFERENCES base_skills(id),
    competency_level INTEGER NOT NULL CHECK (competency_level BETWEEN 1 AND 3),
    is_active BOOLEAN DEFAULT true
);
```

### Tablas de Traducciones Extendidas

```sql
-- Traducciones para arquetipos
CREATE TABLE archetype_translations (
    id SERIAL PRIMARY KEY,
    archetype_id INTEGER NOT NULL REFERENCES archetypes(id),
    language_code VARCHAR(5) NOT NULL,
    name TEXT NOT NULL,
    short_text TEXT,
    description TEXT,
    UNIQUE(archetype_id, language_code)
);

-- Traducciones para tipos de cartas
CREATE TABLE card_type_translations (
    id SERIAL PRIMARY KEY,
    card_type_id INTEGER NOT NULL REFERENCES card_types(id),
    language_code VARCHAR(5) NOT NULL,
    name TEXT NOT NULL,
    short_text TEXT,
    description TEXT,
    UNIQUE(card_type_id, language_code)
);

-- Traducciones para cartas base
CREATE TABLE base_card_translations (
    id SERIAL PRIMARY KEY,
    base_card_id INTEGER NOT NULL REFERENCES base_cards(id),
    language_code VARCHAR(5) NOT NULL,
    name TEXT NOT NULL,
    short_text TEXT,
    description TEXT,
    passive_ability_text TEXT,
    UNIQUE(base_card_id, language_code)
);

-- Traducciones para habilidades de cartas
CREATE TABLE card_ability_translations (
    id SERIAL PRIMARY KEY,
    card_ability_id INTEGER NOT NULL REFERENCES card_abilities(id),
    language_code VARCHAR(5) NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    UNIQUE(card_ability_id, language_code)
);

-- Traducciones para sellos de poder
CREATE TABLE power_seal_translations (
    id SERIAL PRIMARY KEY,
    power_seal_id INTEGER NOT NULL REFERENCES power_seals(id),
    language_code VARCHAR(5) NOT NULL,
    name TEXT NOT NULL,
    short_text TEXT,
    description TEXT,
    UNIQUE(power_seal_id, language_code)
);
```

## Datos de Ejemplo

### Arquetipos Base

```sql
INSERT INTO archetypes (code, base_health_points) VALUES
('warrior', 14),
('mystic', 6),
('explorer', 10),
('scholar', 6),
('diplomat', 8);
```

### Tipos de Cartas

```sql
INSERT INTO card_types (code, sort) VALUES
('lineage', 1),
('environment', 2),
('background', 3),
('occupation', 4),
('power', 5);
```

### Sellos de Poder

```sql
INSERT INTO power_seals (code, level, max_facet_value, milestone_points_required) VALUES
('initiate', 1, 3, 0),
('journey', 2, 4, 10),
('hero', 3, 5, 25),
('legend', 4, 999, 50);
```

### Cartas Base de Ejemplo

```sql
-- Linajes universales
INSERT INTO base_cards (code, card_type_id, facet_bonus_id, facet_bonus_value) VALUES
('human_common', 1, 1, 1), -- +1 a una faceta elegida
('noble_blood', 1, 7, 1),  -- +1 Carisma
('mountain_folk', 1, 3, 1), -- +1 Vigor
('scholar_family', 1, 4, 1); -- +1 Ingenio

-- Entornos universales
INSERT INTO base_cards (code, card_type_id) VALUES
('capital_city', 2),
('frontier_lands', 2),
('rural_village', 2),
('academic_institution', 2);

-- Trasfondos universales
INSERT INTO base_cards (code, card_type_id) VALUES
('war_veteran', 3),
('disaster_survivor', 3),
('mysterious_mentor', 3),
('dark_secret', 3);
```

## Consultas Útiles

### Obtener cartas completas de un mundo

```sql
SELECT 
    wc.code,
    ct.name as card_type,
    wct.name,
    wct.short_text,
    wct.description,
    f.code as bonus_facet,
    wc.facet_bonus_value,
    wc.health_points_bonus
FROM world_cards wc
JOIN card_types ct ON wc.card_type_id = ct.id
JOIN world_card_translations wct ON wc.id = wct.card_id
LEFT JOIN facets f ON wc.facet_bonus_id = f.id
WHERE wc.world_id = ? AND wct.language_code = 'es'
ORDER BY ct.sort, wc.sort;
```

### Obtener habilidades de una carta

```sql
SELECT 
    ca.ability_type,
    ca.trigger_condition,
    ca.uses_per_session,
    ca.devotion_points_cost,
    cat.name,
    cat.description
FROM card_abilities ca
JOIN card_ability_translations cat ON ca.id = cat.card_ability_id
WHERE ca.card_id = ? AND ca.card_type = 'world' AND cat.language_code = 'es';
```

### Obtener competencias de una carta

```sql
SELECT 
    bs.code as skill_code,
    bst.name as skill_name,
    cc.competency_level
FROM card_competencies cc
JOIN base_skills bs ON cc.base_skill_id = bs.id
JOIN base_skills_translations bst ON bs.id = bst.base_skill_id
WHERE cc.card_id = ? AND cc.card_type = 'world' AND bst.locale = 'es';
```

## Recomendaciones de Implementación

### Índices Importantes

```sql
-- Índices para rendimiento
CREATE INDEX idx_world_cards_world_type ON world_cards(world_id, card_type_id);
CREATE INDEX idx_card_abilities_card ON card_abilities(card_id, card_type);
CREATE INDEX idx_translations_language ON world_card_translations(language_code);
```

### Validaciones a Nivel de Aplicación

**Validar bonificaciones**: Los bonos de facetas no deben exceder los límites del Sello actual.

**Validar competencias**: Las competencias no pueden superar +3 sin justificación especial.

**Validar combinaciones**: Ciertas cartas pueden ser incompatibles entre sí.

**Validar arquetipos**: Cada arquetipo debe tener restricciones específicas de cartas disponibles.

### Funcionalidades Sugeridas

**Generador de personajes**: Función que valide combinaciones de cartas y calcule estadísticas finales.

**Validador de reglas**: Sistema que verifique que las combinaciones de cartas cumplan las reglas del sistema.

**Exportador de cartas**: Función para generar PDFs o imágenes de cartas para impresión.

**Sistema de búsqueda**: Búsqueda avanzada por tipo, mundo, bonificaciones, etc.

Esta estructura proporciona una base sólida para gestionar todas las cartas del sistema Proyecto Tarot, manteniendo flexibilidad para diferentes ambientaciones mientras preserva la consistencia del sistema base.
