# 📈 Propuestas de Mejora: Progresión y Cartas

## 1. Sistema de Progresión Actual

### 1.1 Estructura de Sellos

| Sello | Puntos Hito | Max Faceta | Alcance Narrativo |
|-------|-------------|------------|-------------------|
| Iniciado | 0 | 3 | Local |
| Viaje | 10 | 4 | Regional |
| Héroe | 25 | 5 | Continental |
| Leyenda | 50 | ∞ | Cósmico |

### 1.2 Costes de Mejora

| Mejora | Coste |
|--------|-------|
| +1 Faceta | 2 PH |
| Nueva Competencia | 3 PH |
| Nueva Carta | 4 PH |

### 1.3 Problemas Identificados

1. **Saltos de poder grandes** entre Sellos
2. **Progresión lineal** poco emocionante
3. **Falta de hitos intermedios**
4. **Cartas estáticas** tras creación
5. **Sin recompensas por roleplay**

---

## 2. Propuesta: Progresión Escalonada

### 2.1 Sellos con Sub-niveles

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SISTEMA DE SELLOS REFINADO                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   SELLO DEL INICIADO (0-15 PH)                                          │
│   ├── Novato (0 PH): Max Faceta 3, Competencias básicas                 │
│   ├── Aprendiz (5 PH): Desbloquea Don de Potencia Nivel 1               │
│   └── Iniciado (10 PH): Puede evolucionar 1 Carta                       │
│                                                                          │
│   SELLO DEL VIAJE (15-35 PH)                                            │
│   ├── Viajero (15 PH): Max Faceta 4, +1 Competencia gratis              │
│   ├── Aventurero (25 PH): Don de Potencia Nivel 2                       │
│   └── Veterano (30 PH): Puede evolucionar 2ª Carta                      │
│                                                                          │
│   SELLO DEL HÉROE (35-60 PH)                                            │
│   ├── Héroe (35 PH): Max Faceta 5, Renombre regional                    │
│   ├── Campeón (45 PH): Don de Potencia Nivel 3                          │
│   └── Leyenda Menor (55 PH): Puede evolucionar 3ª Carta                 │
│                                                                          │
│   SELLO DE LEYENDA (60+ PH)                                             │
│   ├── Leyenda (60 PH): Max Faceta 6, Renombre continental               │
│   ├── Mito (80 PH): Max Faceta 7, Don de Potencia Nivel 4               │
│   └── Trascendente (100 PH): Max Faceta 9, Semimortal                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Tabla de Progresión

| Nivel | PH Requeridos | Max Faceta | Cartas Evolucionadas | Bonus |
|-------|---------------|------------|---------------------|-------|
| 1 | 0 | 3 | 0 | - |
| 2 | 5 | 3 | 0 | Don Nivel 1 |
| 3 | 10 | 3 | 1 | - |
| 4 | 15 | 4 | 1 | +1 Competencia |
| 5 | 25 | 4 | 1 | Don Nivel 2 |
| 6 | 30 | 4 | 2 | - |
| 7 | 35 | 5 | 2 | Renombre |
| 8 | 45 | 5 | 2 | Don Nivel 3 |
| 9 | 55 | 5 | 3 | - |
| 10 | 60 | 6 | 3 | Renombre Mayor |
| 11 | 80 | 7 | 3 | Don Nivel 4 |
| 12 | 100 | 9 | 4 | Trascendencia |

---

## 3. Propuesta: Evolución de Cartas

### 3.1 Concepto

Las 5 Cartas del personaje pueden **evolucionar** a medida que el personaje crece, desbloqueando nuevas habilidades o mejorando las existentes.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    EVOLUCIÓN DE CARTAS                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   CADA CARTA TIENE 3 NIVELES:                                           │
│   ──────────────────────────────                                        │
│   Base (Creación): Habilidades iniciales                                │
│   Evolucionada (Sub-nivel 3): Habilidad mejorada + nueva pasiva         │
│   Maestra (Sub-nivel 9): Habilidad potenciada + habilidad épica         │
│                                                                          │
│   COSTE DE EVOLUCIÓN:                                                    │
│   Base → Evolucionada: 4 PH + cumplir requisito narrativo               │
│   Evolucionada → Maestra: 6 PH + cumplir gesta épica                    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Ejemplo: Evolución de Ocupación

```
┌─────────────────────────────────────────────────────────────────────────┐
│  LEGIONARIO                                                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  BASE (Creación)                                                         │
│  • PA: 14                                                                │
│  • Bonus: +1 Fuerza                                                      │
│  • Habilidad: Formación de Escudos (+2 defensa si aliado adyacente)     │
│                                                                          │
│  EVOLUCIONADA - VETERANO (Requisito: 10 combates victoriosos)           │
│  • PA: 16 (+2)                                                           │
│  • Nueva Pasiva: Cicatrices de Guerra (+1 Intimidación)                 │
│  • Habilidad Mejorada: Formación Testudo (+3 defensa, incluye aliados)  │
│                                                                          │
│  MAESTRA - CENTURIÓN (Requisito: Liderar una batalla importante)        │
│  • PA: 18 (+2)                                                           │
│  • Nueva Pasiva: Aura de Mando (aliados en 10m +1 moral)                │
│  • Habilidad Épica: Carga de las Águilas (grupo ataca con +2 daño)      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Ejemplo: Evolución de Linaje

```
┌─────────────────────────────────────────────────────────────────────────┐
│  HISPANO                                                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  BASE                                                                    │
│  • Bonus: +1 Vigor                                                       │
│  • Pasiva: Resistencia al frío y terrenos montañosos                    │
│                                                                          │
│  EVOLUCIONADA - HIJO DE IBERIA (Requisito: Visitar Hispania)            │
│  • Bonus: +1 Vigor, +1 Voluntad                                         │
│  • Nueva Pasiva: Sangre de Guerreros (+2 vs miedos y efectos mentales)  │
│                                                                          │
│  MAESTRA - HEREDERO DE VIRIATO (Requisito: Liderar rebelión/resistencia)│
│  • Bonus: +1 Vigor, +1 Voluntad, +1 Carisma                             │
│  • Pasiva Épica: Espíritu Indomable (una vez/día, ignora incapacitación)│
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Propuesta: Costes Escalonados

### 4.1 Problema con Costes Fijos

Actualmente: +1 Faceta siempre cuesta 2 PH

**Problema:** Subir de 4 a 5 debería ser más difícil que de 1 a 2.

### 4.2 Propuesta: Costes Progresivos

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    COSTES DE MEJORA ESCALONADOS                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   FACETAS:                                                               │
│   0 → 1: 1 PH                                                           │
│   1 → 2: 2 PH                                                           │
│   2 → 3: 3 PH                                                           │
│   3 → 4: 4 PH (requiere Sello Viaje)                                    │
│   4 → 5: 5 PH (requiere Sello Héroe)                                    │
│   5 → 6: 6 PH (requiere Sello Leyenda)                                  │
│   6+: 7 PH por nivel                                                    │
│                                                                          │
│   COMPETENCIAS:                                                          │
│   Nueva: 2 PH                                                           │
│   +1 → +2: 3 PH                                                         │
│   +2 → +3: 4 PH                                                         │
│                                                                          │
│   TALENTOS (si se implementan):                                         │
│   Nuevo: 2 PH                                                           │
│   +1: 3 PH                                                              │
│                                                                          │
│   CARTAS:                                                                │
│   Evolución Base → Evolucionada: 4 PH                                   │
│   Evolución Evolucionada → Maestra: 6 PH                                │
│   Nueva Carta Secundaria: 5 PH                                          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Comparativa

**Subir Fuerza de 1 a 5:**
- Sistema actual: 2+2+2+2 = 8 PH
- Sistema propuesto: 2+3+4+5 = 14 PH

**Impacto:** Progresión más lenta pero más significativa.

---

## 5. Propuesta: Puntos de Hito por Tipo

### 5.1 Problema

Actualmente: 1-3 PH por sesión, todo igual

### 5.2 Propuesta: PH Categorizado

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PUNTOS DE HITO CATEGORIZADOS                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   PH DE COMBATE (para mejoras físicas):                                 │
│   • Victoria en combate significativo: +1                               │
│   • Supervivencia contra odds abrumadores: +2                           │
│                                                                          │
│   PH DE CONOCIMIENTO (para mejoras mentales):                           │
│   • Resolver misterio o puzzle: +1                                      │
│   • Descubrir secreto importante: +2                                    │
│   • Aprender de un maestro: +1                                          │
│                                                                          │
│   PH DE ESPÍRITU (para mejoras espirituales):                           │
│   • Actuar según tu Potencia de forma significativa: +1                 │
│   • Convertir a alguien a tu causa: +1                                  │
│   • Completar objetivo personal: +2                                     │
│                                                                          │
│   PH UNIVERSAL (para cualquier mejora):                                 │
│   • Completar arco de aventura: +1-3                                    │
│   • Al inicio de cada sesión: +1                                        │
│                                                                          │
│   USO:                                                                   │
│   • PH Combate solo para Facetas Físicas, Talentos, PA                  │
│   • PH Conocimiento solo para Facetas Mentales, Competencias            │
│   • PH Espíritu solo para Facetas Espirituales, Potencias               │
│   • PH Universal para cualquier cosa                                    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Alternativa: Sistema Simple

Si lo anterior es muy complejo:

```
POR SESIÓN:
• Participación activa: +1 PH
• Roleplay memorable: +1 PH
• Objetivo cumplido: +1 PH
• Momento épico: +1 PH

MÁXIMO: 4 PH/sesión
```

---

## 6. Propuesta: Sistema de Legado

### 6.1 Concepto

Cuando un personaje alcanza Sello de Leyenda o muere heroicamente, puede dejar un **Legado** que beneficia a futuros personajes.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SISTEMA DE LEGADO                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   AL RETIRARSE O MORIR HEROICAMENTE:                                    │
│   ──────────────────────────────────                                    │
│   El personaje deja 1-3 Puntos de Legado según su nivel:                │
│   • Sello Viaje: 1 Punto de Legado                                      │
│   • Sello Héroe: 2 Puntos de Legado                                     │
│   • Sello Leyenda: 3 Puntos de Legado                                   │
│                                                                          │
│   USOS DEL LEGADO (para el siguiente personaje):                        │
│   ──────────────────────────────────────────────                        │
│   1 Punto:                                                              │
│   • Empezar con +5 PH                                                   │
│   • Heredar un objeto especial del anterior                             │
│   • Ser conocido como "descendiente de X" (+1 social en la región)      │
│                                                                          │
│   2 Puntos:                                                              │
│   • Empezar con una Competencia extra a +2                              │
│   • Acceso a una habilidad especial del personaje anterior              │
│   • Contacto importante heredado                                        │
│                                                                          │
│   3 Puntos:                                                              │
│   • Empezar directamente en Sello Viaje                                 │
│   • Heredar una Carta Evolucionada del anterior                         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Propuesta: Cartas Secundarias

### 7.1 Concepto

Además de las 5 Cartas fundamentales, los personajes pueden adquirir **Cartas Secundarias** que representan nuevos roles, títulos o transformaciones.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CARTAS SECUNDARIAS                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   TIPOS:                                                                 │
│   ──────                                                                 │
│   • Título: Posición social adquirida (Senador, Caballero, Gremio)      │
│   • Transformación: Cambio fundamental (Licántropo, Vampiro, Bendecido) │
│   • Maestría: Especialización extrema (Maestro de Espada, Archimago)    │
│   • Vínculo: Relación especial (Familiar, Pacto, Juramento)             │
│                                                                          │
│   ADQUISICIÓN:                                                           │
│   ─────────────                                                          │
│   • Narrativamente: Cumplir requisitos en la historia                   │
│   • Mecánicamente: 5 PH + requisitos de la carta                        │
│   • Límite: 1 Carta Secundaria por Sello alcanzado                      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Ejemplos de Cartas Secundarias

```
┌─────────────────────────────────────────────────────────────────────────┐
│  SENADOR (Título)                                                        │
├─────────────────────────────────────────────────────────────────────────┤
│  Requisito: 50,000 sestercios, apoyo de 3 patricios, Sello Viaje+       │
│                                                                          │
│  Beneficios:                                                             │
│  • +2 a tiradas sociales en contextos políticos                         │
│  • Inmunidad a ciertos procesos legales                                 │
│  • Red de contactos en el Senado                                        │
│  • Ingresos pasivos (1000 sestercios/mes)                               │
│                                                                          │
│  Obligaciones:                                                           │
│  • Asistir a sesiones del Senado                                        │
│  • Enemigos políticos automáticos                                       │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  BENDECIDO DE DIANA (Transformación)                                     │
├─────────────────────────────────────────────────────────────────────────┤
│  Requisito: Favor de Diana 8+, ritual en luna llena, sacrificio         │
│                                                                          │
│  Beneficios:                                                             │
│  • Visión nocturna perfecta                                             │
│  • +3 a rastreo y supervivencia en naturaleza                           │
│  • Puede hablar con animales salvajes                                   │
│  • Una vez/día, velocidad x2 durante 1 minuto                           │
│                                                                          │
│  Obligaciones:                                                           │
│  • No puede dañar animales salvajes sin necesidad                       │
│  • Debe pasar 1 noche/semana bajo las estrellas                         │
│  • Las ciudades le causan malestar (-1 en zonas urbanas)                │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  MAESTRO DE LA ESPADA (Maestría)                                         │
├─────────────────────────────────────────────────────────────────────────┤
│  Requisito: Talento Espada +3, entrenamiento con maestro, 20 duelos     │
│                                                                          │
│  Beneficios:                                                             │
│  • +1 adicional a ataques con espada (total +4)                         │
│  • Maniobra especial: Riposte (contraataque automático en defensa)      │
│  • Intimidación automática vs espadachines de menor nivel               │
│  • Puede enseñar (dar +1 temporal a estudiantes)                        │
│                                                                          │
│  Limitaciones:                                                           │
│  • Reputación: Retado constantemente por aspirantes                     │
│  • Honor: No puede rechazar duelos justos                               │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Resumen de Propuestas

| Propuesta | Objetivo | Complejidad | Prioridad |
|-----------|----------|-------------|-----------|
| **Sub-niveles de Sello** | Progresión granular | Media | ⭐⭐⭐⭐ |
| **Evolución de Cartas** | Cartas vivas | Media | ⭐⭐⭐⭐⭐ |
| **Costes Escalonados** | Balance progresión | Baja | ⭐⭐⭐⭐ |
| **PH Categorizados** | Recompensa por tipo | Media | ⭐⭐⭐ |
| **Sistema de Legado** | Continuidad campaña | Baja | ⭐⭐⭐ |
| **Cartas Secundarias** | Expansión horizontal | Media | ⭐⭐⭐⭐ |

---

## 9. Implementación Recomendada

### Fase 1: Esencial
1. ✅ **Evolución de Cartas** (3 niveles)
2. ✅ **Costes Escalonados** 

### Fase 2: Mejora
3. 🔄 **Sub-niveles de Sello** (12 niveles)
4. 🔄 **Cartas Secundarias** (al menos 10 ejemplos)

### Fase 3: Opcional
5. 📋 PH Categorizados
6. 📋 Sistema de Legado

---

## 10. Catálogo de 90 Cartas de Origen (Manus)

> **Fuente:** `25-CATALOGO-IDEAS-MANUS.md`, sección 6.10

### 10.1 Resumen del Catálogo

| Ambientación | Linajes | Entornos | Trasfondos |
|--------------|---------|----------|------------|
| **Rueda del Tiempo** | 10 | 10 | 10 |
| **Harry Potter** | 10 | 10 | 10 |
| **Warcraft** | 10 | 10 | 10 |
| **Total** | **30** | **30** | **30** |

---

### 10.2 Ejemplos Destacados por Tipo

#### Linajes (QUÉ ERES)

| Linaje | Ambientación | Habilidad Pasiva |
|--------|--------------|------------------|
| **Tuatha'an** | WoT | Camino de la Hoja: Nunca atacas primero, +2 defensivo |
| **Metamorfomago** | HP | Cambio de Forma: Alteras apariencia a voluntad |
| **Troll** | Warcraft | Regeneración: +1 PA al final de cada combate |
| **Malkieri** | WoT | Voluntad de Acero: Umbral 5 vs miedo |
| **No-Muerto** | Warcraft | Voluntad Férrea: Inmune a miedo y control mental |

#### Entornos (DÓNDE TE CRIASTE)

| Entorno | Ambientación | Habilidad |
|---------|--------------|-----------|
| **Torre Blanca** | WoT | Umbral 5 en Erudición sobre el Poder Único |
| **Hogwarts Slytherin** | HP | Umbral 5 en Carisma para manipulación |
| **Dalaran** | Warcraft | Umbral 5 en Erudición sobre magia arcana |
| **Los Dos Ríos** | WoT | Umbral 5 en Percepción para rastrear |
| **La Madriguera** | HP | Umbral 5 en Ingenio para improvisar |

#### Trasfondos (QUÉ TE OCURRIÓ)

| Trasfondo | Ambientación | Habilidad |
|-----------|--------------|-----------|
| **Marcado por el Patrón** | WoT | Ta'veren Menor: 1/sesión coincidencia favorable |
| **Protegido por Magia Antigua** | HP | Bendición Maternal: 1/sesión negar ataque |
| **Bendecido por un Naaru** | Warcraft | Toque de la Luz: 1/sesión curar aliado completamente |
| **Caída de Malkier** | WoT | +1 daño vs Sombra |
| **Gladiador de Durnholde** | Warcraft | +1 Dificultad para ser derribado |

---

### 10.3 Fichas de Personaje Completas (Ejemplos)

> **Fuente:** `26-DRAMATIZACION.md`, escenas 9-14

#### Lan Mandragoran (Guerrero WoT)

| Carta | Elección | Beneficio |
|-------|----------|-----------|
| Linaje | Malkieri | +1 Voluntad, Umbral 5 vs miedo |
| Entorno | Tierras de la Plaga | Umbral 5 detectar Sombra |
| Trasfondo | Caída de Malkier | +1 daño vs Sombra |
| Ocupación | Guardián | PA 10, Umbral 5 espada |
| Potencia | El Deber | Último Sacrificio |

#### Moiraine Damodred (Mística WoT)

| Carta | Elección | Beneficio |
|-------|----------|-----------|
| Linaje | Cairhienin | +1 Ingenio, Juego de Casas |
| Entorno | Torre Blanca | Identificar tejidos |
| Trasfondo | Búsqueda del Dragón | Conocimiento Prohibido |
| Ocupación | Aes Sedai | Canalizar, Vínculo |
| Potencia | El Patrón | Corrección del Hilo |

#### Hermione Granger (Experta HP)

| Carta | Elección | Beneficio |
|-------|----------|-----------|
| Linaje | Nacida de Muggles | +1 Ingenio, Perspectiva Externa |
| Entorno | Hogwarts Gryffindor | Umbral 5 valentía |
| Trasfondo | Guerra Voldemort | +1 Dificultad ser desarmada |
| Ocupación | Bruja Excepcional | Memoria Fotográfica |
| Potencia | El Conocimiento | Revelación Súbita |

---

### 10.4 Verificación de Flexibilidad

> **Del catálogo original:**

✅ **Universalidad Confirmada:** El sistema funciona en las tres ambientaciones

✅ **Diferenciación Clara:** Cada tipo de carta mantiene su identidad:
- Linaje = "Qué eres"
- Entorno = "Dónde creciste"
- Trasfondo = "Qué te ocurrió"

✅ **Riqueza Narrativa:** Cada carta es un gancho argumental

✅ **Escalabilidad:** Se pueden crear infinitas opciones sin romper el sistema

---

*La progresión debe sentirse como un viaje, no solo como números que suben.*
