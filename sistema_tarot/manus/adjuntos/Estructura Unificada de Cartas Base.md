# Estructura Unificada de Cartas Base

## Filosofía del Diseño

### Tabla Central Unificada

Todas las cartas (Arquetipos, Linajes, Entornos, Trasfondos, Ocupaciones, Potencias) comparten la misma estructura base en una sola tabla, con tablas relacionadas para características específicas de cada tipo.

### Ventajas del Enfoque

**Simplicidad**: Una sola tabla para todas las cartas reduce complejidad y duplicación.

**Flexibilidad**: Fácil añadir nuevos tipos de cartas sin modificar estructura base.

**Consistencia**: Todas las cartas tienen los mismos campos básicos (nombre, descripción, imagen, etc.).

**Escalabilidad**: Las características específicas se manejan en tablas relacionadas según necesidad.

## Estructura Propuesta

### Tabla Central de Cartas

```sql
-- Tabla unificada para todas las cartas base
CREATE TABLE base_cards (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    card_type ENUM('archetype', 'lineage', 'environment', 'background', 'occupation', 'power') NOT NULL,
    image VARCHAR(255),
    is_active BOOLEAN DEFAULT true NOT NULL,
    sort INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimización
CREATE INDEX idx_base_cards_type ON base_cards(card_type);
CREATE INDEX idx_base_cards_active ON base_cards(is_active);
CREATE INDEX idx_base_cards_sort ON base_cards(card_type, sort);
```

### Tablas de Características Específicas

#### Arquetipos - Características Especiales

```sql
-- Características específicas de arquetipos
CREATE TABLE archetype_stats (
    id SERIAL PRIMARY KEY,
    card_id INTEGER NOT NULL REFERENCES base_cards(id) ON DELETE CASCADE,
    base_health_points INTEGER NOT NULL,
    physical_points INTEGER NOT NULL DEFAULT 0,
    mental_points INTEGER NOT NULL DEFAULT 0,
    spiritual_points INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT fk_archetype_card_type CHECK (
        (SELECT card_type FROM base_cards WHERE id = card_id) = 'archetype'
    )
);

-- Competencias de armas por arquetipo
CREATE TABLE archetype_weapon_competencies (
    id SERIAL PRIMARY KEY,
    archetype_id INTEGER NOT NULL REFERENCES base_cards(id) ON DELETE CASCADE,
    weapon_category_code VARCHAR(50) NOT NULL,
    competency_level INTEGER NOT NULL CHECK (competency_level BETWEEN 0 AND 3),
    UNIQUE(archetype_id, weapon_category_code)
);
```

#### Linajes - Bonificaciones y Habilidades

```sql
-- Bonificaciones de facetas por linaje
CREATE TABLE lineage_facet_bonuses (
    id SERIAL PRIMARY KEY,
    card_id INTEGER NOT NULL REFERENCES base_cards(id) ON DELETE CASCADE,
    facet_id INTEGER NOT NULL REFERENCES facets(id),
    bonus_value INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT fk_lineage_card_type CHECK (
        (SELECT card_type FROM base_cards WHERE id = card_id) = 'lineage'
    )
);

-- Habilidades pasivas de linajes
CREATE TABLE lineage_abilities (
    id SERIAL PRIMARY KEY,
    card_id INTEGER NOT NULL REFERENCES base_cards(id) ON DELETE CASCADE,
    ability_code VARCHAR(50) NOT NULL,
    is_always_active BOOLEAN DEFAULT true,
    CONSTRAINT fk_lineage_card_type CHECK (
        (SELECT card_type FROM base_cards WHERE id = card_id) = 'lineage'
    )
);
```

#### Entornos - Competencias Otorgadas

```sql
-- Competencias otorgadas por entornos
CREATE TABLE environment_competencies (
    id SERIAL PRIMARY KEY,
    card_id INTEGER NOT NULL REFERENCES base_cards(id) ON DELETE CASCADE,
    skill_id INTEGER NOT NULL REFERENCES base_skills(id),
    competency_level INTEGER NOT NULL CHECK (competency_level BETWEEN 1 AND 3),
    CONSTRAINT fk_environment_card_type CHECK (
        (SELECT card_type FROM base_cards WHERE id = card_id) = 'environment'
    )
);

-- Conocimientos especiales de entornos
CREATE TABLE environment_knowledge (
    id SERIAL PRIMARY KEY,
    card_id INTEGER NOT NULL REFERENCES base_cards(id) ON DELETE CASCADE,
    knowledge_code VARCHAR(50) NOT NULL,
    knowledge_level ENUM('basic', 'advanced', 'expert') DEFAULT 'basic',
    CONSTRAINT fk_environment_card_type CHECK (
        (SELECT card_type FROM base_cards WHERE id = card_id) = 'environment'
    )
);
```

#### Trasfondos - Habilidades Especiales

```sql
-- Habilidades especiales de trasfondos
CREATE TABLE background_abilities (
    id SERIAL PRIMARY KEY,
    card_id INTEGER NOT NULL REFERENCES base_cards(id) ON DELETE CASCADE,
    ability_code VARCHAR(50) NOT NULL,
    ability_type ENUM('passive', 'active', 'triggered') NOT NULL,
    uses_per_session INTEGER NULL,
    uses_per_day INTEGER NULL,
    trigger_condition TEXT NULL,
    CONSTRAINT fk_background_card_type CHECK (
        (SELECT card_type FROM base_cards WHERE id = card_id) = 'background'
    )
);

-- Modificadores de trasfondos
CREATE TABLE background_modifiers (
    id SERIAL PRIMARY KEY,
    card_id INTEGER NOT NULL REFERENCES base_cards(id) ON DELETE CASCADE,
    modifier_type ENUM('facet_bonus', 'skill_bonus', 'situational') NOT NULL,
    target_code VARCHAR(50) NOT NULL, -- facet code, skill code, or situation code
    bonus_value INTEGER NOT NULL,
    condition_text TEXT NULL,
    CONSTRAINT fk_background_card_type CHECK (
        (SELECT card_type FROM base_cards WHERE id = card_id) = 'background'
    )
);
```

#### Ocupaciones - Estadísticas y Competencias

```sql
-- Estadísticas de ocupaciones
CREATE TABLE occupation_stats (
    id SERIAL PRIMARY KEY,
    card_id INTEGER NOT NULL REFERENCES base_cards(id) ON DELETE CASCADE,
    health_points INTEGER NOT NULL,
    facet_bonus_id INTEGER REFERENCES facets(id),
    facet_bonus_value INTEGER DEFAULT 0,
    CONSTRAINT fk_occupation_card_type CHECK (
        (SELECT card_type FROM base_cards WHERE id = card_id) = 'occupation'
    )
);

-- Competencias de ocupaciones
CREATE TABLE occupation_competencies (
    id SERIAL PRIMARY KEY,
    card_id INTEGER NOT NULL REFERENCES base_cards(id) ON DELETE CASCADE,
    skill_id INTEGER NOT NULL REFERENCES base_skills(id),
    competency_level INTEGER NOT NULL CHECK (competency_level BETWEEN 1 AND 3),
    is_automatic BOOLEAN DEFAULT true, -- Si se otorga automáticamente o es opcional
    CONSTRAINT fk_occupation_card_type CHECK (
        (SELECT card_type FROM base_cards WHERE id = card_id) = 'occupation'
    )
);

-- Habilidades especiales de ocupaciones
CREATE TABLE occupation_abilities (
    id SERIAL PRIMARY KEY,
    card_id INTEGER NOT NULL REFERENCES base_cards(id) ON DELETE CASCADE,
    ability_code VARCHAR(50) NOT NULL,
    ability_type ENUM('passive', 'professional', 'social') NOT NULL,
    CONSTRAINT fk_occupation_card_type CHECK (
        (SELECT card_type FROM base_cards WHERE id = card_id) = 'occupation'
    )
);
```

#### Potencias - Sistema de Devoción

```sql
-- Estadísticas de potencias
CREATE TABLE power_stats (
    id SERIAL PRIMARY KEY,
    card_id INTEGER NOT NULL REFERENCES base_cards(id) ON DELETE CASCADE,
    devotion_points INTEGER NOT NULL DEFAULT 3,
    power_tier ENUM('minor', 'major', 'cosmic') DEFAULT 'minor',
    CONSTRAINT fk_power_card_type CHECK (
        (SELECT card_type FROM base_cards WHERE id = card_id) = 'power'
    )
);

-- Intervenciones de potencias
CREATE TABLE power_interventions (
    id SERIAL PRIMARY KEY,
    card_id INTEGER NOT NULL REFERENCES base_cards(id) ON DELETE CASCADE,
    intervention_code VARCHAR(50) NOT NULL,
    intervention_type ENUM('guidance', 'protection', 'enhancement', 'revelation') NOT NULL,
    devotion_cost INTEGER DEFAULT 1,
    frequency ENUM('unlimited', 'session', 'day', 'week') DEFAULT 'unlimited',
    CONSTRAINT fk_power_card_type CHECK (
        (SELECT card_type FROM base_cards WHERE id = card_id) = 'power'
    )
);
```

### Tabla de Traducciones Unificada

```sql
-- Traducciones para todas las cartas base
CREATE TABLE base_card_translations (
    id SERIAL PRIMARY KEY,
    card_id INTEGER NOT NULL REFERENCES base_cards(id) ON DELETE CASCADE,
    language_code VARCHAR(5) NOT NULL,
    name TEXT NOT NULL,
    short_text TEXT NULL,
    description TEXT NULL,
    flavor_text TEXT NULL, -- Texto narrativo adicional
    UNIQUE(card_id, language_code)
);

-- Traducciones para habilidades y características específicas
CREATE TABLE card_feature_translations (
    id SERIAL PRIMARY KEY,
    feature_table VARCHAR(50) NOT NULL, -- Nombre de la tabla (archetype_stats, lineage_abilities, etc.)
    feature_id INTEGER NOT NULL, -- ID del registro en la tabla específica
    feature_field VARCHAR(50) NOT NULL, -- Campo específico (ability_code, knowledge_code, etc.)
    language_code VARCHAR(5) NOT NULL,
    name TEXT NOT NULL,
    description TEXT NULL,
    UNIQUE(feature_table, feature_id, feature_field, language_code)
);
```

## Datos de Ejemplo

### Arquetipos

```sql
-- Insertar arquetipos
INSERT INTO base_cards (code, card_type, sort) VALUES
('warrior', 'archetype', 1),
('mystic', 'archetype', 2),
('explorer', 'archetype', 3),
('scholar', 'archetype', 4),
('diplomat', 'archetype', 5);

-- Estadísticas de arquetipos
INSERT INTO archetype_stats (card_id, base_health_points, physical_points, mental_points, spiritual_points) VALUES
((SELECT id FROM base_cards WHERE code = 'warrior'), 14, 5, 1, 3),
((SELECT id FROM base_cards WHERE code = 'mystic'), 6, 1, 3, 5),
((SELECT id FROM base_cards WHERE code = 'explorer'), 10, 3, 3, 3),
((SELECT id FROM base_cards WHERE code = 'scholar'), 6, 1, 5, 3),
((SELECT id FROM base_cards WHERE code = 'diplomat'), 8, 1, 3, 5);

-- Competencias de armas por arquetipo
INSERT INTO archetype_weapon_competencies (archetype_id, weapon_category_code, competency_level) VALUES
((SELECT id FROM base_cards WHERE code = 'warrior'), 'all_weapons', 3),
((SELECT id FROM base_cards WHERE code = 'mystic'), 'light_weapons', 1),
((SELECT id FROM base_cards WHERE code = 'explorer'), 'ranged_weapons', 2),
((SELECT id FROM base_cards WHERE code = 'scholar'), 'light_weapons', 1),
((SELECT id FROM base_cards WHERE code = 'diplomat'), 'light_weapons', 1);
```

### Linajes

```sql
-- Insertar linajes
INSERT INTO base_cards (code, card_type, sort) VALUES
('human_common', 'lineage', 1),
('noble_blood', 'lineage', 2),
('mountain_folk', 'lineage', 3),
('forest_dweller', 'lineage', 4);

-- Bonificaciones de facetas
INSERT INTO lineage_facet_bonuses (card_id, facet_id, bonus_value) VALUES
((SELECT id FROM base_cards WHERE code = 'noble_blood'), (SELECT id FROM facets WHERE code = 'charisma'), 1),
((SELECT id FROM base_cards WHERE code = 'mountain_folk'), (SELECT id FROM facets WHERE code = 'vigor'), 1),
((SELECT id FROM base_cards WHERE code = 'forest_dweller'), (SELECT id FROM facets WHERE code = 'perception'), 1);

-- Habilidades pasivas
INSERT INTO lineage_abilities (card_id, ability_code) VALUES
((SELECT id FROM base_cards WHERE code = 'human_common'), 'adaptability'),
((SELECT id FROM base_cards WHERE code = 'noble_blood'), 'social_connections'),
((SELECT id FROM base_cards WHERE code = 'mountain_folk'), 'cold_resistance'),
((SELECT id FROM base_cards WHERE code = 'forest_dweller'), 'nature_sense');
```

### Ocupaciones

```sql
-- Insertar ocupaciones
INSERT INTO base_cards (code, card_type, sort) VALUES
('knight', 'occupation', 1),
('mage', 'occupation', 2),
('ranger', 'occupation', 3),
('scholar_occ', 'occupation', 4);

-- Estadísticas de ocupaciones
INSERT INTO occupation_stats (card_id, health_points, facet_bonus_id, facet_bonus_value) VALUES
((SELECT id FROM base_cards WHERE code = 'knight'), 14, (SELECT id FROM facets WHERE code = 'strength'), 1),
((SELECT id FROM base_cards WHERE code = 'mage'), 6, (SELECT id FROM facets WHERE code = 'soul'), 1),
((SELECT id FROM base_cards WHERE code = 'ranger'), 10, (SELECT id FROM facets WHERE code = 'agility'), 1),
((SELECT id FROM base_cards WHERE code = 'scholar_occ'), 6, (SELECT id FROM facets WHERE code = 'intellect'), 1);
```

## Consultas Útiles

### Obtener Carta Completa con Todas sus Características

```sql
-- Función para obtener arquetipo completo
CREATE OR REPLACE FUNCTION get_archetype_details(archetype_code VARCHAR)
RETURNS TABLE (
    name TEXT,
    description TEXT,
    base_health_points INTEGER,
    physical_points INTEGER,
    mental_points INTEGER,
    spiritual_points INTEGER,
    weapon_competencies JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bct.name,
        bct.description,
        ast.base_health_points,
        ast.physical_points,
        ast.mental_points,
        ast.spiritual_points,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'weapon_category', awc.weapon_category_code,
                    'level', awc.competency_level
                )
            ) FILTER (WHERE awc.id IS NOT NULL),
            '[]'::jsonb
        ) as weapon_competencies
    FROM base_cards bc
    JOIN base_card_translations bct ON bc.id = bct.card_id
    JOIN archetype_stats ast ON bc.id = ast.card_id
    LEFT JOIN archetype_weapon_competencies awc ON bc.id = awc.archetype_id
    WHERE bc.code = archetype_code AND bc.card_type = 'archetype'
    AND bct.language_code = 'es'
    GROUP BY bct.name, bct.description, ast.base_health_points, 
             ast.physical_points, ast.mental_points, ast.spiritual_points;
END;
$$ LANGUAGE plpgsql;
```

### Obtener Todas las Cartas de un Tipo

```sql
-- Obtener todos los linajes con sus bonificaciones
SELECT 
    bc.code,
    bct.name,
    bct.short_text,
    f.code as bonus_facet,
    lfb.bonus_value,
    array_agg(la.ability_code) as abilities
FROM base_cards bc
JOIN base_card_translations bct ON bc.id = bct.card_id
LEFT JOIN lineage_facet_bonuses lfb ON bc.id = lfb.card_id
LEFT JOIN facets f ON lfb.facet_id = f.id
LEFT JOIN lineage_abilities la ON bc.id = la.card_id
WHERE bc.card_type = 'lineage' AND bc.is_active = true
AND bct.language_code = 'es'
GROUP BY bc.code, bct.name, bct.short_text, f.code, lfb.bonus_value
ORDER BY bc.sort;
```

### Validar Combinación de Cartas

```sql
-- Función para validar que una combinación de cartas es válida
CREATE OR REPLACE FUNCTION validate_card_combination(
    archetype_code VARCHAR,
    lineage_code VARCHAR,
    environment_code VARCHAR,
    background_code VARCHAR,
    occupation_code VARCHAR,
    power_code VARCHAR
) RETURNS BOOLEAN AS $$
DECLARE
    card_count INTEGER;
BEGIN
    -- Verificar que todas las cartas existen y están activas
    SELECT COUNT(*) INTO card_count
    FROM base_cards
    WHERE code IN (archetype_code, lineage_code, environment_code, 
                   background_code, occupation_code, power_code)
    AND is_active = true;
    
    -- Debe haber exactamente 6 cartas válidas
    IF card_count != 6 THEN
        RETURN FALSE;
    END IF;
    
    -- Aquí se pueden añadir más validaciones específicas
    -- Por ejemplo, ciertas ocupaciones incompatibles con ciertos linajes
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
```

## Ventajas de Esta Estructura

### Simplicidad de Mantenimiento

**Una sola tabla principal** para todas las cartas reduce complejidad de joins y mantenimiento.

**Traducciones centralizadas** en una tabla principal con extensiones para características específicas.

**Fácil expansión** añadiendo nuevos tipos de cartas sin modificar estructura base.

### Flexibilidad

**Características específicas** se manejan en tablas relacionadas según el tipo de carta.

**Validaciones a nivel de base de datos** usando constraints y funciones.

**Consultas optimizadas** con índices específicos por tipo de carta.

### Escalabilidad

**Nuevos mundos** pueden extender las cartas base sin duplicar estructura.

**Nuevas características** se añaden creando nuevas tablas relacionadas.

**Performance optimizado** con índices apropiados y consultas específicas.

Esta estructura unificada mantiene la simplicidad mientras proporciona toda la flexibilidad necesaria para el sistema completo de Proyecto Tarot.
