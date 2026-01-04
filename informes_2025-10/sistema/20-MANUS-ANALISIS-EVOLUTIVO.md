# 📜 Análisis del Desarrollo Evolutivo (Manus)

## 1. Contexto

Este documento analiza el desarrollo iterativo del sistema Proyecto Tarot documentado en `sistema_tarot/manus/`, extrayendo conceptos y alternativas que podrían mejorar el sistema actual.

**Fuentes analizadas:**
- `Manus1.md` - Brainstorming inicial y evolución del sistema core
- `manus2.md` - Análisis de combate y talentos
- `manus3.md` - Análisis de fortalezas/debilidades
- `manus4.md` - Estructura del repositorio
- `adjuntos/` - 124 archivos de análisis, simulaciones y diseño

---

## 2. Conceptos Explorados vs Estado Actual

### 2.1 Sistema de Dados

| Concepto | Explorado en Manus | Estado Actual | Evaluación |
|----------|-------------------|---------------|------------|
| **Reserva de Dados** | Múltiples d12 Habilidad vs 1 d12 Destino | ❌ Rechazado | Complejo |
| **2d12 Simple** | 1d12 Habilidad + 1d12 Destino | ✅ Adoptado | Elegante |
| **Escala del Destino** | Graduada (-8 a +8) | ⚠️ Simplificada (3 rangos) | **Ver sección 3** |
| **Umbral de Competencia** | Mínimo garantizado por skill | ❌ No implementado | **Valioso** |

### 2.2 Combate

| Concepto | Explorado en Manus | Estado Actual | Evaluación |
|----------|-------------------|---------------|------------|
| **Talentos de Armas** | 3/2/1 puntos por arquetipo | ❌ No implementado | **Crítico** |
| **Dificultad Base 12** | Problemática para no-luchadores | ✅ Mantenida | Requiere talentos |
| **Duración ~20 turnos** | Objetivo ideal | ⚠️ ~28 turnos sin talentos | Mejorable |

### 2.3 Escala de Poder

| Concepto | Explorado en Manus | Estado Actual | Evaluación |
|----------|-------------------|---------------|------------|
| **Escala 0-9** | Propuesta refinada | ⚠️ 0-5+ (menos granular) | Comparable |
| **Límites por Sello** | 3/4/5 máximo | ✅ Adoptado (3/4/5/∞) | Correcto |
| **Distribución 5/3/1** | Mantenida | ✅ Adoptado | Correcto |

---

## 3. Ideas Valiosas NO Implementadas

### 3.1 🔥 Escala del Destino Graduada (Alta Prioridad)

**En Manus:**
```
Balanza del Destino = Dado Habilidad - Dado Destino

| Balanza    | Nombre                  | Efecto                              |
|------------|-------------------------|-------------------------------------|
| +8 o más   | Bendición Trascendente  | Éxito espectacular / Fallo revelador|
| +4 a +7    | Bendición Mayor         | Beneficio claro                     |
| +1 a +3    | Bendición Menor         | Éxito limpio / Fallo sin coste      |
| 0          | Giro del Destino        | Evento extraordinario               |
| -1 a -3    | Maldición Menor         | Pequeño coste / Empeora levemente   |
| -4 a -7    | Maldición Mayor         | Coste grave / Problema serio        |
| -8 o menos | Maldición Catastrófica  | Desastre                            |
```

**Estado Actual (simplificado):**
```
| Rango Destino | Efecto      |
|---------------|-------------|
| 9-12          | Favorable   |
| 5-8           | Neutral     |
| 1-4           | Adverso     |
| Iguales       | Giro        |
```

**Ventaja de Manus:**
- La diferencia entre dados captura la **magnitud** del resultado
- Un 12 vs 11 (éxito ajustado) se siente diferente a 12 vs 2 (éxito aplastante)
- Más riqueza narrativa sin añadir dados

**Recomendación:** ⭐⭐⭐⭐⭐ **Implementar la escala graduada**

---

### 3.2 🔥 Sistema de Talentos de Armas (Crítico)

**Problema identificado en Manus:**
- Sin talentos, combates duran ~28 turnos (demasiado largo)
- No-luchadores tienen solo 8-15% de victoria vs NPCs
- Dificultad 12 es muy alta sin compensación

**Solución propuesta (validada con 4000 simulaciones):**

| Arquetipo | Puntos Talento | Duración Combate | Mejora |
|-----------|---------------|------------------|--------|
| Sin Talentos | 0 | 28.4 turnos | - |
| No Luchador | 1 | 23.0 turnos | -19% |
| Mixto | 2 | 19.5 turnos | -31% |
| Luchador | 3 | 16.9 turnos | -40% |

**Mecánica:**
```
Talento de Arma = Bonus al ataque con armas específicas
- Luchador: 3 puntos para distribuir (ej: Espada +2, Arco +1)
- Mixto: 2 puntos (ej: Espada +1, Daga +1)
- No-Luchador: 1 punto (ej: Bastón +1)
```

**Recomendación:** ⭐⭐⭐⭐⭐ **Implementar inmediatamente**

---

### 3.3 ⭐ Umbral de Competencia

**Concepto en Manus:**
> "Cuando usas una habilidad en la que eres competente, tu Dado de Habilidad tiene un resultado mínimo garantizado."

**Ejemplo:**
- Legionario con "Combate Legionario" tiene Umbral 6
- Si saca 1-5 en el dado, se trata como si hubiera sacado 6
- Representa que un experto no tiene "días desastrosos"

**Ventajas:**
- Reduce la volatilidad para personajes competentes
- La habilidad protege contra la mala suerte
- Diferencia real entre novato y experto

**Alternativa al sistema actual de Competencias:**

| Nivel Competencia | Umbral Mínimo | Descripción |
|-------------------|---------------|-------------|
| Sin entrenar | 1 | Todo depende del dado |
| Entrenado (+1) | 3 | Mínimo garantizado de 3 |
| Competente (+2) | 5 | Mínimo garantizado de 5 |
| Excepcional (+3) | 7 | Mínimo garantizado de 7 |

**Recomendación:** ⭐⭐⭐⭐ **Considerar como alternativa o complemento**

---

### 3.4 Puntos de Arcano (Recurso de Salvación)

**En Manus:**
> "Puntos de Arcano: 1-3 por sesión. Representan la capacidad de forzar el destino."

**Usos propuestos:**
1. **Reescribir el Destino:** Volver a lanzar ambos dados
2. **Controlar la Narrativa:** Cambiar Maldición → Bendición (sin cambiar éxito/fallo)
3. **Activar Poder Mayor:** Habilidades especiales de Potencias

**Comparación con Sistema Actual (Devoción):**
| Aspecto | Puntos de Arcano | Devoción |
|---------|------------------|----------|
| Cantidad | 1-3 por sesión | 3 máximo |
| Recuperación | Inicio sesión | Por acciones |
| Uso | Modificar tiradas | Intervenciones |

**Recomendación:** ⭐⭐⭐ **La Devoción actual es similar pero más narrativa**

---

### 3.5 Nombres de Resultados (Terminología)

**En Manus (más evocadores):**
- **Éxito Resonante** (éxito + habilidad alta)
- **Éxito Pírrico** (éxito + destino alto)
- **Fallo con Ventaja** (fallo + habilidad alta)
- **Fallo Agravado** (fallo + destino alto)

**Estado Actual:**
- Éxito/Fallo + Favorable/Neutral/Adverso

**Recomendación:** ⭐⭐⭐ **Terminología de Manus es más memorable**

---

## 4. Ideas Exploradas y Correctamente Rechazadas

### 4.1 ❌ Reserva de Dados Múltiples

**Propuesta:** Lanzar N dados de habilidad según atributo, quedarse con el mejor.

**Por qué se rechazó:**
- Añade complejidad (contar dados, elegir resultados)
- Ralentiza el juego
- Pierde la elegancia de 2d12

**Veredicto:** Correcto rechazar

### 4.2 ❌ Acumulación de Recursos (estilo Daggerheart)

**Propuesta:** Hope/Fear points que se acumulan en cada tirada.

**Por qué se rechazó:**
- Demasiado similar a Daggerheart (problemas de licencia)
- Añade gestión de recursos que distrae
- El "Giro Tarot" es inmediato y narrativo

**Veredicto:** Correcto rechazar - diferenciación intencional

---

## 5. Problemas Identificados en Manus (Aún Vigentes)

### 5.1 Combate Subdesarrollado

**Identificado:**
> "El sistema de combate, aunque funcional, presenta varias limitaciones significativas"

**Problemas específicos:**
1. Iniciativa simplificada (PJ siempre primero) reduce tensión
2. Sistema de daño demasiado lineal
3. Falta de opciones tácticas más allá de maniobras básicas
4. Duración excesiva sin talentos

**Estado:** ⚠️ **Parcialmente resuelto en docs actuales, pero sin talentos**

### 5.2 Falta de Ejemplos de Cartas

**Identificado:**
> "El documento carece de ejemplos específicos que ilustren cómo funcionan las cartas en la práctica"

**Estado:** ✅ **Resuelto** - Las ambientaciones (Roma, Fantasía) incluyen cartas completas

### 5.3 Inconsistencia en Distribución de Puntos

**Identificado:**
> "Discrepancias entre 5/3/1 y 6/3/1 puntos"

**Estado:** ✅ **Resuelto** - Documento actual usa consistentemente 5/3/1

### 5.4 Guías para DJ Limitadas

**Identificado:**
> "Poca orientación específica para directores de juego"

**Estado:** ⚠️ **Parcialmente resuelto** - Hay guías pero podrían expandirse

---

## 6. Tabla Comparativa: Manus vs Actual

| Aspecto | Versión Manus | Versión Actual | Mejor |
|---------|---------------|----------------|-------|
| **Mecánica Core** | 2d12 Giro Tarot | 2d12 Giro Tarot | = Igual |
| **Escala Destino** | 7 niveles graduados | 3 niveles + giro | **Manus** |
| **Talentos Armas** | 3/2/1 validado | No implementado | **Manus** |
| **Umbral Competencia** | Propuesto | No implementado | **Manus** |
| **Escala Poder** | 0-9 detallada | 0-5+ suficiente | = Comparable |
| **Distribución** | 5/3/1 | 5/3/1 | = Igual |
| **Sellos** | 3 (Aprendiz/Veterano/Maestro) | 4 (Iniciado→Leyenda) | **Actual** |
| **Ejemplos Cartas** | Algunos | Muchos (Roma, Fantasía) | **Actual** |
| **Documentación** | Fragmentada | Estructurada | **Actual** |
| **Terminología** | Evocadora | Funcional | **Manus** |

---

## 7. Recomendaciones de Implementación

### 7.1 Prioridad ALTA (Implementar)

1. **Sistema de Talentos de Armas (3/2/1)**
   - Resuelve problema crítico de duración de combates
   - Validado con 4000 simulaciones
   - Diferencia mecánicamente arquetipos

2. **Escala del Destino Graduada**
   - Más riqueza narrativa
   - Captura magnitud del resultado
   - No añade complejidad (mismo dado, diferente interpretación)

### 7.2 Prioridad MEDIA (Considerar)

3. **Umbral de Competencia**
   - Alternativa o complemento a +1/+2/+3
   - Reduce volatilidad para expertos
   - Requiere más testing

4. **Terminología Evocadora**
   - "Éxito Resonante", "Éxito Pírrico", etc.
   - Más memorable para jugadores
   - Fácil de implementar

### 7.3 Prioridad BAJA (Opcional)

5. **Escala de Poder 0-9**
   - La actual 0-5+ funciona
   - Solo añade granularidad en niveles épicos
   - Implementar solo si se necesita

---

## 8. Propuesta de Integración

### 8.1 Sistema de Combate Mejorado

```
COMBATE CON TALENTOS + ESCALA DEL DESTINO

1. CREACIÓN DE PERSONAJE
   - Luchador: 3 puntos de Talento de Armas
   - Mixto: 2 puntos de Talento de Armas
   - No-Luchador: 1 punto de Talento de Armas

2. ATAQUE
   Tirada: 1d12 Habilidad + 1d12 Destino
   Total = d12 Habilidad + Faceta + Talento vs Dificultad

3. ÉXITO/FALLO
   Total ≥ Dificultad → Éxito
   Total < Dificultad → Fallo

4. ESCALA DEL DESTINO
   Balanza = d12 Habilidad - d12 Destino
   
   +5 o más  → Bendición Mayor
   +1 a +4   → Bendición Menor
   0         → Giro del Destino
   -1 a -4   → Maldición Menor
   -5 o menos → Maldición Mayor
```

### 8.2 Ejemplo Práctico

**Cayo (Legionario) ataca a un Bandido**

- Fuerza: 3
- Talento Gladius: +2 (es Luchador con 3 puntos)
- Total modificador: +5

**Tirada:**
- d12 Habilidad: 8
- d12 Destino: 3
- Total: 8 + 5 = 13 vs Dificultad 9

**Resultados:**
- **Éxito:** 13 ≥ 9 ✓
- **Balanza:** 8 - 3 = +5 → **Bendición Mayor**
- **Narración:** "Tu gladius atraviesa su guardia limpiamente. El bandido retrocede tambaleante, dejando expuesto a su compañero para tu siguiente ataque (+1 al próximo ataque)."

---

## 9. Conclusión

El desarrollo en Manus revela un proceso iterativo riguroso con **análisis estadísticos sólidos**. Varias ideas exploradas son **superiores al estado actual** del sistema documentado:

| Idea | Impacto | Dificultad | Recomendación |
|------|---------|------------|---------------|
| **Talentos de Armas** | 🔥 Alto | ⭐ Fácil | **IMPLEMENTAR** |
| **Escala Destino Graduada** | 🔥 Alto | ⭐ Fácil | **IMPLEMENTAR** |
| **Umbral Competencia** | ⚡ Medio | ⭐⭐ Media | Evaluar |
| **Terminología** | ⚡ Bajo | ⭐ Fácil | Adoptar |

**El sistema de Talentos de Armas es la mejora más crítica** - con datos de 4000 simulaciones que demuestran su efectividad para resolver el problema de duración de combates.

---

*Este análisis se basa en la documentación de desarrollo en `sistema_tarot/manus/`. Las recomendaciones deben validarse con playtesting.*
