# 🔧 Especificaciones Técnicas - Tarot2

## 📋 Resumen Ejecutivo

Este documento presenta especificaciones técnicas detalladas para las **3 funcionalidades prioritarias** identificadas en el roadmap de Tarot2, incluyendo arquitectura, APIs, base de datos y consideraciones de implementación.

---

## 🎯 **Funcionalidades Prioritarias**

### **1. Command Palette (Cmd+K)**
### **2. Character Builder System**
### **3. AI Content Generation**

---

## 🎨 **1. COMMAND PALETTE**

### **1.1 Descripción Funcional**
Modal de búsqueda global tipo Spotlight que permite:
- Búsqueda en todas las entidades del sistema
- Acciones rápidas (crear, editar, publicar)
- Historial de búsquedas recientes
- Navegación ultrarrápida

### **1.2 Arquitectura Técnica**

#### **Frontend Components**
```typescript
// Componente principal
interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (action: CommandAction) => void
}

// Tipos de comandos
type CommandType = 'entity' | 'action' | 'navigation' | 'recent'
interface CommandAction {
  id: string
  title: string
  subtitle?: string
  icon: string
  type: CommandType
  action: () => void
  keywords: string[]
}
```

#### **API Endpoints**
```typescript
// Búsqueda global
GET /api/search/global?q={query}&limit={limit}

// Historial de búsquedas
GET /api/search/history
POST /api/search/history
DELETE /api/search/history/{id}

// Acciones rápidas
POST /api/quick-actions/{action}
```

#### **Base de Datos**
```sql
-- Tabla para historial de búsquedas
CREATE TABLE search_history (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  query TEXT NOT NULL,
  results_count INT DEFAULT 0,
  clicked_result BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_search_history_user_created ON search_history(user_id, created_at DESC);
CREATE INDEX idx_search_history_query ON search_history USING gin(to_tsvector('english', query));
```

### **1.3 Algoritmo de Búsqueda**
```typescript
interface SearchAlgorithm {
  // 1. Búsqueda exacta en títulos
  exactMatch: (query: string) => Promise<Entity[]>
  
  // 2. Búsqueda fuzzy en contenido
  fuzzyMatch: (query: string) => Promise<Entity[]>
  
  // 3. Búsqueda por palabras clave
  keywordMatch: (query: string) => Promise<Entity[]>
  
  // 4. Ranking y scoring
  scoreResults: (results: Entity[], query: string) => Entity[]
}
```

### **1.4 Consideraciones de Performance**
- **Cache**: Redis para búsquedas frecuentes
- **Debouncing**: 300ms delay en input
- **Lazy Loading**: Cargar resultados progresivamente
- **Indexing**: Full-text search en PostgreSQL

---

## 🧙‍♂️ **2. CHARACTER BUILDER SYSTEM**

### **2.1 Descripción Funcional**
Wizard paso a paso para crear personajes TTRPG:
- Selección de Arcano primario
- Distribución de 9 facetas
- Selección de habilidades iniciales
- Personalización de apariencia
- Validación de reglas del mundo

### **2.2 Arquitectura Técnica**

#### **Nuevas Entidades de Base de Datos**
```sql
-- Personajes de jugadores
CREATE TABLE characters (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  campaign_id INT REFERENCES campaigns(id),
  name VARCHAR(100) NOT NULL,
  arcano_primary arcano_type NOT NULL,
  facetas JSONB NOT NULL, -- {fuerza: 10, agilidad: 8, ...}
  skills JSONB NOT NULL,  -- Array de skill IDs
  appearance JSONB,       -- Avatar, colores, etc.
  background TEXT,
  status character_status DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campañas de juego
CREATE TABLE campaigns (
  id SERIAL PRIMARY KEY,
  gm_id INT REFERENCES users(id),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  world_id INT REFERENCES worlds(id),
  status campaign_status DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sesiones de juego
CREATE TABLE game_sessions (
  id SERIAL PRIMARY KEY,
  campaign_id INT REFERENCES campaigns(id),
  title VARCHAR(100),
  date_played DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Encounters de combate
CREATE TABLE encounters (
  id SERIAL PRIMARY KEY,
  session_id INT REFERENCES game_sessions(id),
  name VARCHAR(100),
  participants JSONB, -- Array de character_ids y npc_data
  initiative_order JSONB,
  status encounter_status DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **API Endpoints**
```typescript
// Gestión de personajes
GET    /api/characters
POST   /api/characters
GET    /api/characters/{id}
PATCH  /api/characters/{id}
DELETE /api/characters/{id}

// Campañas
GET    /api/campaigns
POST   /api/campaigns
GET    /api/campaigns/{id}/characters
POST   /api/campaigns/{id}/sessions

// Wizard de creación
GET    /api/character-builder/templates/{world_id}
POST   /api/character-builder/validate
POST   /api/character-builder/create
```

#### **Frontend Components**
```typescript
// Wizard principal
interface CharacterBuilderProps {
  worldId: string
  onComplete: (character: Character) => void
  onCancel: () => void
}

// Steps del wizard
type BuilderStep = 'basic' | 'arcano' | 'facetas' | 'skills' | 'appearance' | 'validation'

interface CharacterData {
  name: string
  arcano: ArcanoType
  facetas: FacetaScores
  skills: Skill[]
  appearance: AppearanceData
  background?: string
}

// Validación de reglas
interface ValidationRules {
  minFacetaScore: number
  maxFacetaScore: number
  totalPoints: number
  requiredSkills: string[]
  prohibitedCombinations: [string, string][]
}
```

### **2.3 Lógica de Negocio**
```typescript
class CharacterBuilder {
  // Validar distribución de facetas
  validateFacetaDistribution(facetas: FacetaScores): ValidationResult {
    const total = Object.values(facetas).reduce((sum, score) => sum + score, 0)
    const maxTotal = 100 // Ejemplo
    
    if (total !== maxTotal) {
      return { valid: false, error: 'Total de puntos debe ser 100' }
    }
    
    // Validar distribución por arcano
    const arcanoDistribution = this.calculateArcanoDistribution(facetas)
    if (arcanoDistribution.primary < 40) {
      return { valid: false, error: 'Arcano primario debe tener al menos 40 puntos' }
    }
    
    return { valid: true }
  }
  
  // Generar sugerencias de build
  generateBuildSuggestions(preferences: PlayerPreferences): CharacterTemplate[] {
    // Lógica para sugerir builds basados en preferencias
  }
}
```

---

## 🤖 **3. AI CONTENT GENERATION**

### **3.1 Descripción Funcional**
Sistema de IA para generar contenido TTRPG automáticamente:
- Generación de tramas y aventuras
- Creación de NPCs con personalidad
- Generación de diálogos naturales
- Creación de quests y misiones
- Generación de lore y trasfondos

### **3.2 Arquitectura Técnica**

#### **Service Layer**
```typescript
// Servicio principal de IA
interface AIGenerationService {
  // Story generation
  generateStory(params: StoryParams): Promise<Story>
  
  // NPC generation
  generateNPC(params: NPCParams): Promise<NPC>
  
  // Dialogue generation
  generateDialogue(params: DialogueParams): Promise<Dialogue>
  
  // Quest generation
  generateQuest(params: QuestParams): Promise<Quest>
  
  // Lore generation
  generateLore(params: LoreParams): Promise<Lore>
}

// Parámetros para generación
interface StoryParams {
  worldId: string
  genre: StoryGenre
  length: 'short' | 'medium' | 'long'
  themes: string[]
  characters?: string[]
  setting?: string
}

interface NPCParams {
  worldId: string
  role: NPCRole
  personalityTraits: string[]
  background?: string
  relationshipToPlayer?: string
}
```

#### **AI Integration**
```typescript
// Integración con OpenAI/Claude
class AIContentGenerator {
  private openai: OpenAI
  
  async generateStory(params: StoryParams): Promise<Story> {
    const prompt = this.buildStoryPrompt(params)
    
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'Eres un experto GM creando historias para TTRPG...'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 2000
    })
    
    return this.parseStoryResponse(response)
  }
  
  private buildStoryPrompt(params: StoryParams): string {
    return `
    Crea una historia de TTRPG con estas características:
    - Mundo: ${params.worldId}
    - Género: ${params.genre}
    - Longitud: ${params.length}
    - Temas: ${params.themes.join(', ')}
    
    La historia debe ser engaging, tener conflicto claro y permitir decisiones de jugadores.
    `
  }
}
```

#### **Base de Datos para IA**
```sql
-- Templates de generación
CREATE TABLE ai_templates (
  id SERIAL PRIMARY KEY,
  type ai_content_type NOT NULL,
  name VARCHAR(100) NOT NULL,
  prompt_template TEXT NOT NULL,
  parameters JSONB NOT NULL,
  world_id INT REFERENCES worlds(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contenido generado por IA
CREATE TABLE ai_generated_content (
  id SERIAL PRIMARY KEY,
  type ai_content_type NOT NULL,
  content JSONB NOT NULL,
  prompt_used TEXT NOT NULL,
  parameters JSONB,
  quality_score DECIMAL(3,2),
  human_reviewed BOOLEAN DEFAULT FALSE,
  approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feedback para mejorar IA
CREATE TABLE ai_feedback (
  id SERIAL PRIMARY KEY,
  content_id INT REFERENCES ai_generated_content(id),
  user_id INT REFERENCES users(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **3.3 API Endpoints**
```typescript
// Generación de contenido
POST /api/ai/generate/story
POST /api/ai/generate/npc
POST /api/ai/generate/dialogue
POST /api/ai/generate/quest
POST /api/ai/generate/lore

// Gestión de templates
GET    /api/ai/templates
POST   /api/ai/templates
PATCH  /api/ai/templates/{id}
DELETE /api/ai/templates/{id}

// Feedback y mejora
POST /api/ai/feedback
GET  /api/ai/analytics/generation-stats
```

---

## 🏗️ **4. CONSIDERACIONES DE ARQUITECTURA**

### **4.1 Microservicios**
```typescript
// Servicios independientes
services/
├── search-service/          // Command Palette
├── character-service/       // Character Builder
├── ai-generation-service/   // AI Content
├── campaign-service/        // Campaigns & Sessions
└── shared-services/         // Auth, Notifications
```

### **4.2 Event-Driven Architecture**
```typescript
// Event bus para comunicación
interface EventBus {
  emit(event: string, data: any): void
  on(event: string, handler: Function): void
}

// Eventos importantes
events:
- 'character.created'
- 'campaign.session.started'
- 'ai.content.generated'
- 'search.query.executed'
```

### **4.3 Caching Strategy**
```typescript
// Redis cache layers
cache:
  L1: In-memory (hot data)
  L2: Redis (frequent queries)
  L3: Database (persistent)

// Cache keys
const CACHE_KEYS = {
  SEARCH_RESULTS: 'search:{query_hash}',
  CHARACTER_TEMPLATES: 'templates:character:{world_id}',
  AI_GENERATED_CONTENT: 'ai:content:{content_id}',
  CAMPAIGN_DATA: 'campaign:{campaign_id}'
}
```

---

## 📊 **5. MÉTRICAS Y MONITOREO**

### **5.1 KPIs Técnicos**
```typescript
interface TechnicalMetrics {
  // Performance
  responseTime: number
  throughput: number
  errorRate: number
  
  // AI Quality
  aiContentQuality: number
  userSatisfactionScore: number
  
  // Usage
  featureAdoptionRate: number
  userRetentionImpact: number
}
```

### **5.2 Monitoring Setup**
```typescript
// Logging estructurado
const logger = {
  info: (message: string, context: object) => {},
  error: (error: Error, context: object) => {},
  metric: (name: string, value: number, tags: object) => {}
}

// Health checks
const healthChecks = {
  database: () => Promise<boolean>,
  redis: () => Promise<boolean>,
  aiService: () => Promise<boolean>,
  externalAPIs: () => Promise<boolean>
}
```

---

## 🎯 **6. PLAN DE IMPLEMENTACIÓN**

### **6.1 Fases de Desarrollo**

#### **Fase 1: Foundation (4-6 semanas)**
- [ ] Command Palette básico
- [ ] Character Builder MVP
- [ ] Base de datos para nuevas entidades
- [ ] Autenticación y autorización

#### **Fase 2: Core Features (6-8 semanas)**
- [ ] Character Builder completo
- [ ] AI Content Generation básico
- [ ] Campaign management
- [ ] Testing y QA

#### **Fase 3: Advanced Features (4-6 semanas)**
- [ ] AI Content Generation avanzado
- [ ] Performance optimization
- [ ] Analytics y monitoring
- [ ] Documentation

### **6.2 Recursos Necesarios**
```typescript
interface TeamRequirements {
  frontend: {
    developers: 2
    skills: ['Vue 3', 'TypeScript', 'Nuxt 4']
  }
  backend: {
    developers: 2
    skills: ['Node.js', 'PostgreSQL', 'Redis']
  }
  ai: {
    specialists: 1
    skills: ['OpenAI API', 'Prompt Engineering']
  }
  devops: {
    engineers: 1
    skills: ['Docker', 'AWS', 'CI/CD']
  }
}
```

---

## 🔐 **7. CONSIDERACIONES DE SEGURIDAD**

### **7.1 Data Protection**
- Encriptación de datos sensibles
- GDPR compliance para usuarios EU
- Rate limiting en APIs de IA
- Validación de inputs

### **7.2 AI Safety**
- Content filtering
- Prompt injection prevention
- Rate limiting en generación
- Human review workflow

---

## 🎯 **Conclusiones**

Estas especificaciones técnicas proporcionan una base sólida para implementar las funcionalidades prioritarias de Tarot2, asegurando:

1. **Escalabilidad**: Arquitectura preparada para crecimiento
2. **Performance**: Optimizada para respuesta rápida
3. **Maintainability**: Código limpio y bien documentado
4. **Security**: Protecciones implementadas desde el diseño
5. **User Experience**: Enfocada en la usabilidad

---

*Especificaciones técnicas creadas el 4 de enero de 2026*  
*Versión: 1.0*
