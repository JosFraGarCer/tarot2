# 🎴 Análisis del Sistema de Juego Proyecto Tarot

## 1. Visión General

### 1.1 Identidad del Sistema

**Proyecto Tarot** es un sistema de rol universal basado en cartas conceptuales, diseñado por Jose F. Garrido Cercós. Se posiciona en un punto intermedio entre los sistemas narrativos puros (Fate, PbtA) y los simulacionistas tradicionales (D&D, GURPS).

| Aspecto | Descripción |
|---------|-------------|
| **Versión** | 0.1.2.0 (Borrador) |
| **Licencia** | CC BY-SA 4.0 |
| **Dados** | 2d12 (Habilidad + Destino) |
| **Target** | Jugadores que buscan narrativa con estructura |

### 1.2 Los Tres Pilares

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PILARES DE PROYECTO TAROT                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   🎭 NARRATIVA         ⚔️ PERSONAJES        🔧 MODULARIDAD              │
│   EMERGENTE            COMPETENTES          UNIVERSAL                    │
│                                                                          │
│   El Dado de Destino   Solo tiras cuando    Las Cartas permiten         │
│   genera consecuen-    el resultado es      adaptar cualquier           │
│   cias inesperadas     dramático            ambientación                │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Arquitectura del Sistema

### 2.1 El Giro Tarot (Mecánica Core)

**Innovación principal:** Separar éxito/fracaso de consecuencias narrativas.

```
              ┌─────────────────┐
              │   GIRO TAROT    │
              └────────┬────────┘
                       │
         ┌─────────────┴─────────────┐
         │                           │
    ┌────▼────┐                 ┌────▼────┐
    │  DADO   │                 │  DADO   │
    │ HABILID │                 │ DESTINO │
    │  (d12)  │                 │  (d12)  │
    └────┬────┘                 └────┬────┘
         │                           │
    ¿ÉXITO?                    ¿CONSECUENCIAS?
         │                           │
    Dado + Faceta               9-12: Favorable
    ≥ Dificultad                5-8:  Neutral
                                1-4:  Adverso
                                =:    Giro del Destino
```

**Probabilidades con d12:**

| Faceta | vs Sencillo (6) | vs Moderado (9) | vs Difícil (12) | vs Heroico (15) |
|--------|-----------------|-----------------|-----------------|-----------------|
| +0 | 58% | 33% | 8% | 0% |
| +1 | 67% | 42% | 17% | 0% |
| +2 | 75% | 50% | 25% | 8% |
| +3 | 83% | 58% | 33% | 17% |
| +4 | 92% | 67% | 42% | 25% |
| +5 | 100% | 75% | 50% | 33% |

### 2.2 Sistema de Cartas

El personaje se define por **5 Cartas Fundamentales**:

| Carta | Pregunta | Beneficio Mecánico |
|-------|----------|-------------------|
| **Linaje** | "¿Qué eres?" | +1 Faceta + Pasiva |
| **Entorno** | "¿Dónde te criaste?" | Competencia +2 |
| **Trasfondo** | "¿Qué te ocurrió?" | Habilidad situacional |
| **Ocupación** | "¿Qué haces?" | PA + +1 Faceta + Activas |
| **Potencia** | "¿En qué crees?" | 3 Devoción + Intervenciones |

### 2.3 Los Arcanos (Atributos)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         LOS TRES ARCANOS                                 │
├─────────────────┬─────────────────┬─────────────────────────────────────┤
│  💪 FÍSICO      │  🧠 MENTAL      │  ✨ ESPIRITUAL                      │
├─────────────────┼─────────────────┼─────────────────────────────────────┤
│  Fuerza         │  Ingenio        │  Voluntad                           │
│  Agilidad       │  Percepción     │  Carisma                            │
│  Vigor          │  Erudición      │  Alma                               │
├─────────────────┼─────────────────┼─────────────────────────────────────┤
│  5 puntos       │  3 puntos       │  1 punto                            │
│  (Primario)     │  (Secundario)   │  (Terciario)                        │
└─────────────────┴─────────────────┴─────────────────────────────────────┘
```

**Escala de Poder:**

| Valor | Nivel | Descripción |
|-------|-------|-------------|
| 0 | Sin Destacar | Humano promedio |
| 1 | Entrenado | Formación inicial |
| 2 | Competente | Experiencia práctica |
| 3 | Excepcional | Talento destacado |
| 4 | Experto | Dominio profesional |
| 5 | Maestro | Referente en el campo |
| 6+ | Legendario+ | Trasciende lo humano |

---

## 3. Subsistemas

### 3.1 Combate

**Filosofía:** Rápido, dinámico, narrativo. 3-5 rondas típicas.

**Iniciativa:** 1d12 + Agilidad (fija durante todo el combate)

**Ataque:** 1d12 + Faceta + Competencia vs Dificultad (6/9/12/15)

**Daño y Protección:**

| Armas | Daño | Armaduras | Protección |
|-------|------|-----------|------------|
| Ligeras (daga) | 2 | Ligera (cuero) | 1 |
| Medias (espada) | 3 | Media (malla) | 2 |
| Pesadas (mandoble) | 4 | Pesada (placas) | 3 |
| Arco/Ballesta | 3 | Escudo | +1 a +3 |

**Heridas:**

| Tipo | Trigger | Efecto |
|------|---------|--------|
| Leve | 1-3 PA de golpe | Sin penalización |
| Grave | 4-6 PA de golpe | -1 a todo |
| Crítica | 7+ PA de golpe | -2 a todo |

### 3.2 Progresión (Sellos)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      PROGRESIÓN POR SELLOS                               │
├─────────────┬──────────────┬────────────────┬───────────────────────────┤
│   SELLO     │  REQUISITO   │  MAX FACETA    │  ALCANCE NARRATIVO        │
├─────────────┼──────────────┼────────────────┼───────────────────────────┤
│  Iniciado   │  Creación    │      3         │  Local (aldeas)           │
│  Viaje      │  10 PH       │      4         │  Regional (reinos)        │
│  Héroe      │  25 PH       │      5         │  Continental (imperios)   │
│  Leyenda    │  50 PH       │      ∞         │  Cósmico (multiverso)     │
└─────────────┴──────────────┴────────────────┴───────────────────────────┘
```

**Puntos de Hito (PH):**
- 1-3 por sesión típica
- Gastos: Faceta (2 PH), Competencia (3 PH), Carta (4 PH)

### 3.3 Sistema de Magia

**Estructura de Dos Niveles:**

| Nivel | Propósito | Características |
|-------|-----------|-----------------|
| **Combate** | Acciones rápidas | Como armas, sin coste |
| **Poderosa** | Efectos dramáticos | Tiempo + Coste + Riesgos |

**Tres Modelos de Implementación:**

| Modelo | Ejemplo | Recurso | Características |
|--------|---------|---------|-----------------|
| **Académico** | Harry Potter | Sin fatiga | Escuelas múltiples |
| **Organizacional** | Rueda del Tiempo | Fatiga | Tradiciones distintas |
| **Profesional** | Warcraft | Mana | Clases diversas |

**Fórmula Universal:**
```
Alma + Canalización + Especialización = Modificador Mágico
```

### 3.4 Sistema de Potencias

**Devoción:** 3 puntos iniciales, se ganan/pierden por acciones

**Intervenciones:**
- **Menor (1 PD):** Repetir Dado de Destino
- **Mayor (3 PD):** Habilidad única de la Potencia

---

## 4. Evaluación Crítica

### 4.1 Fortalezas

| Fortaleza | Descripción | Impacto |
|-----------|-------------|---------|
| **Dado de Destino** | Genera narrativa sin control del DJ | ⭐⭐⭐⭐⭐ Innovador |
| **Sistema de Cartas** | Personajes memorables y modulares | ⭐⭐⭐⭐⭐ Excelente |
| **Competencia Automática** | Reduce tiradas innecesarias | ⭐⭐⭐⭐ Muy bueno |
| **Modularidad** | Adaptable a cualquier ambientación | ⭐⭐⭐⭐⭐ Excelente |
| **Escalabilidad** | De aldeanos a semidioses | ⭐⭐⭐⭐ Muy bueno |

### 4.2 Áreas de Mejora

| Área | Problema | Sugerencia |
|------|----------|------------|
| **Giros del Destino** | Probabilidad 8.3% (1/12) puede ser frecuente | Considerar 1/20 o reservar para crits |
| **Combate múltiple** | Reglas de flanqueo complejas | Simplificar a +1/-1 |
| **Magia Poderosa** | 3 modelos pueden confundir | Elegir uno por defecto |
| **Sellos** | Saltos de poder grandes | Añadir sellos intermedios |
| **Ocupaciones** | Solo 6 arquetipos base | Necesita más ejemplos |

### 4.3 Comparativa con Otros Sistemas

| Sistema | Complejidad | Narrativa | Táctica | Universalidad |
|---------|-------------|-----------|---------|---------------|
| **Proyecto Tarot** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| D&D 5e | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
| Fate Core | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| GURPS | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Savage Worlds | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| PbtA | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐ | ⭐⭐⭐ |

---

## 5. Análisis de Probabilidades

### 5.1 Distribución del Dado de Destino

```
Resultado    Frecuencia    Efecto
─────────────────────────────────────
1-4          33.3%         Adverso
5-8          33.3%         Neutral  
9-12         33.3%         Favorable
Iguales      8.3%          Giro del Destino
```

**Observación:** El sistema está perfectamente balanceado en tercios, lo cual es elegante pero puede sentirse plano. Considerar:
- Picos en extremos (1 y 12 especiales)
- Giros del Destino más raros (solo en crits)

### 5.2 Curva de Éxito por Faceta

Con d12, la curva es lineal (cada +1 = +8.33% de éxito):

```
              PROBABILIDAD DE ÉXITO
    100% ┤                        ●●●●●●●  +5
     90% ┤                  ●●●●●●        
     80% ┤            ●●●●●●              +4
     70% ┤      ●●●●●●                    
     60% ┤●●●●●●                          +3
     50% ┤                                
     40% ┤            ●●●●●●              +2
     30% ┤      ●●●●●●                    
     20% ┤●●●●●●                          +1
     10% ┤                                
      0% ┼──────┬──────┬──────┬──────┬────
         6     9      12     15     18
                  DIFICULTAD
```

### 5.3 Impacto de Herramientas y Modificadores

| Modificador | Impacto en Éxito |
|-------------|------------------|
| +1 (herramienta básica) | +8.33% |
| +2 (buenas condiciones) | +16.66% |
| +3 (ayuda experta) | +25% |
| -1 (condiciones difíciles) | -8.33% |
| -2 (interferencia) | -16.66% |
| -3 (sin herramientas) | -25% |

---

## 6. Estructura de la Documentación

### 6.1 Inventario de Documentos

```
sistema_tarot/
├── borrador/
│   └── GDD v0.1.2.0 (40 KB) ─────────── Documento central
├── docs/
│   ├── core/
│   │   ├── 01-filosofia.md (7 KB)
│   │   ├── 02-personajes.md (10 KB)
│   │   ├── 03-resolucion.md (9 KB)
│   │   ├── 04-combate.md (12 KB)
│   │   └── 05-progresion.md (12 KB)
│   ├── magic/
│   │   ├── 01-fundamentos.md (12 KB)
│   │   ├── 02-combate-magico.md (12 KB)
│   │   ├── 03-magia-poderosa.md (15 KB)
│   │   └── 04-modelos.md (15 KB)
│   ├── examples/
│   │   ├── ancient-rome.md (18 KB)
│   │   └── medieval-fantasy.md (15 KB)
│   └── guides/
│       └── inicio-rapido.md (7 KB)
└── tools/
    └── card-templates.md (9 KB)
```

**Total:** ~193 KB de documentación de sistema

### 6.2 Cobertura de Contenido

| Área | Documentado | Ejemplos | Listo para jugar |
|------|-------------|----------|------------------|
| Mecánica core | ✅ 100% | ✅ Múltiples | ✅ Sí |
| Creación PJs | ✅ 100% | ✅ 3 ejemplos | ✅ Sí |
| Combate | ✅ 100% | ✅ 3 ejemplos | ✅ Sí |
| Progresión | ✅ 100% | ✅ 2 ejemplos | ✅ Sí |
| Magia | ✅ 100% | ✅ HP/WoT/WoW | ✅ Sí |
| Ambientaciones | ⚠️ 2 de ~5 | ✅ Roma completa | ⚠️ Parcial |
| Herramientas DJ | ❌ Pendiente | ❌ | ❌ |
| Bestiario | ❌ Pendiente | ❌ | ❌ |

---

## 7. Recomendaciones de Desarrollo

### 7.1 Prioridad Alta

1. **Bestiario Universal** - Sistema de creación de adversarios
2. **Herramientas de DJ** - Generadores, tablas aleatorias
3. **Más ambientaciones** - Sci-fi, horror moderno, steampunk
4. **Guía de adaptación** - Cómo convertir otras IPs

### 7.2 Prioridad Media

5. **Reglas opcionales compiladas** - Dados explosivos, etc.
6. **Preguntas frecuentes expandidas** - Edge cases
7. **Hojas de personaje** - Diseño oficial
8. **Tarjetas de referencia** - Para mesa

### 7.3 Prioridad Baja

9. **Aventuras de ejemplo** - 3-5 one-shots completos
10. **Campaña de ejemplo** - Arco de Iniciado a Héroe
11. **Lore oficial** - Universo propio de Tarot
12. **Merchandise** - Dados custom, cartas físicas

---

## 8. Conclusión

### 8.1 Evaluación Global

| Aspecto | Puntuación | Comentario |
|---------|------------|------------|
| **Innovación** | ⭐⭐⭐⭐⭐ | Dado de Destino es brillante |
| **Elegancia** | ⭐⭐⭐⭐ | Sistema de cartas muy limpio |
| **Jugabilidad** | ⭐⭐⭐⭐ | Fácil de aprender y usar |
| **Profundidad** | ⭐⭐⭐⭐ | Suficiente para campañas largas |
| **Documentación** | ⭐⭐⭐⭐ | Muy completa, bien escrita |
| **Madurez** | ⭐⭐⭐ | Borrador, necesita playtesting |
| **Global** | **⭐⭐⭐⭐** | **Sistema prometedor y sólido** |

### 8.2 Resumen Ejecutivo

**Proyecto Tarot es un sistema de rol universal bien diseñado** que destaca por:

- **Mecánica innovadora** del Dado de Destino que genera narrativa emergente
- **Sistema de Cartas** que crea personajes memorables y modula
- **Balance excelente** entre narrativa y estructura mecánica
- **Documentación profesional** que facilita el aprendizaje

**Necesita** más playtesting, ambientaciones adicionales, y herramientas de soporte para DJ.

**Recomendación:** Continuar el desarrollo con enfoque en contenido (ambientaciones, bestiario) mientras se testea el sistema core con grupos de juego.

---

*Este análisis está basado en la documentación v0.1.2.0 del sistema. Las evaluaciones pueden cambiar con futuras versiones.*
