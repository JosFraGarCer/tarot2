# 🙏 Propuestas para Potencias

> **Estado del módulo:** 🔄 EN DESARROLLO
> **Última actualización:** Diciembre 2024

---

## Propuestas Nuevas

### POT-004: Salvaguarda del Destino

| Campo | Valor |
|-------|-------|
| **Propuesta** | Gastar Devoción para evitar tiradas fatales o con mal desenlace |
| **Coste** | 1-3 Devoción según gravedad |
| **Trigger** | A elección del jugador, tras ver el resultado |
| **Estado** | 📋 PROPUESTA |
| **Prioridad** | Alta |

#### Mecánica Propuesta

```
Después de una tirada con resultado fatal o muy negativo:

OPCIÓN A: Repetir (1 Dev)
  → Repites el dado de Destino
  → Debes aceptar el nuevo resultado
  
OPCIÓN B: Mitigar (2 Dev)
  → El resultado sigue siendo malo, pero no fatal
  → "Tu Potencia intercede: caes inconsciente pero no muerto"
  
OPCIÓN C: Anular (3 Dev)
  → El resultado malo no ocurre
  → Debe tener justificación narrativa
  → "En el último momento, una fuerza te aparta del filo"
```

#### Ejemplos

| Situación | Sin Salvaguarda | Con Salvaguarda |
|-----------|-----------------|-----------------|
| Caída mortal | Muerte | Queda colgando de un saliente (2 Dev) |
| Golpe de Gracia | Muerte | Inconsciente pero vivo (2 Dev) |
| Veneno letal | Muerte en 1h | Enfermo pero estable (2 Dev) |
| Maldición Mayor | Efecto completo | Repetir dado (1 Dev) |

#### Restricciones

- **Máximo 1/escena** por personaje
- **Requiere justificación** acorde a la Potencia
- **No funciona** si la Potencia no aprobaría la acción

---

### POT-005: Escudo de Historia (PA de Potencia)

| Campo | Valor |
|-------|-------|
| **Propuesta** | Devoción funciona como "puntos de vida narrativos" secundarios |
| **Mecánica** | La Potencia absorbe daño antes que el personaje |
| **Estado** | 📋 PROPUESTA |
| **Prioridad** | Alta |

#### Mecánica Propuesta

```
ESCUDO DE HISTORIA

Cuando recibes daño, ANTES de restar PA:
  
  Si tienes Devoción ≥1:
    Puedes gastar 1 Devoción para:
    → Reducir el daño a la mitad (redondeo abajo)
    → O ignorar completamente un daño ≤3
    
  Narrativamente:
    "Tu fe te protege"
    "La Potencia desvía el golpe"
    "Algo inexplicable te salva"
```

#### Escala de Protección

| Devoción Gastada | Efecto | Ejemplo Narrativo |
|------------------|--------|-------------------|
| 1 Dev | Daño ÷2 o ignorar ≤3 | "El golpe resbala" |
| 2 Dev | Ignorar todo el daño | "Una luz te envuelve" |
| 3 Dev | Ignorar + contraefecto | "El atacante retrocede" |

#### Interacción con Dogmas

```
SI el daño viene de:
  - Acción acorde a Dogmas: Protección completa
  - Acción neutral: Protección normal
  - Acción contra Dogmas: NO se puede usar
```

---

## Análisis de Implicaciones

### En Combate

| Aspecto | Impacto | Valoración |
|---------|---------|------------|
| **Letalidad** | Reduce muertes inesperadas | ✅ Alineado con "Personajes Competentes" |
| **Recursos** | Devoción tiene más usos | ⚠️ Puede diluir Intervenciones |
| **Decisiones** | ¿Salvarme o guardar para Intervención? | ✅ Decisión interesante |
| **Duración** | Combates pueden alargarse | ⚠️ Contrario a objetivo 5-10 turnos |
| **Balance** | Personajes con Potencia fuerte >> sin | ⚠️ Desequilibrio potencial |

### En Situaciones de Prueba

| Situación | Efecto Esperado |
|-----------|-----------------|
| SETUP-COMBATE-DUELO | +1-2 turnos si usan Escudo |
| SETUP-COMBATE-JEFE | PJs más resistentes vs burst |
| SETUP-MAGIA-DIVINA | Sinergias con Intervenciones |
| SETUP-MIXTA-TRANSICIONES | Más supervivencia en emboscadas |

### Problemas Potenciales

| Problema | Riesgo | Mitigación |
|----------|--------|------------|
| Devoción demasiado valiosa | Alto | Limitar usos por combate |
| Combates eternos | Medio | Coste alto (2-3 Dev) |
| Narrativa forzada | Bajo | Requiere justificación |
| NPCs también lo usan | Medio | Solo Potencias "activas" |

---

## Variantes a Considerar

### Variante A: Solo Salvaguarda (Sin Escudo)

```
POT-004 activo, POT-005 descartado

Pros:
- Más simple
- Solo para momentos críticos
- No afecta duración de combate

Contras:
- Menos uso de Devoción en combate
```

### Variante B: Escudo Limitado

```
POT-005 con límite de 1/combate

Pros:
- Protección existe pero es escasa
- Decisión de cuándo usarlo

Contras:
- Puede sentirse arbitrario
```

### Variante C: Escudo como PA Extra

```
Devoción × 2 = PA extra "narrativos"
Se gastan primero, no se recuperan hasta descanso largo

Pros:
- Más predecible
- Integración limpia

Contras:
- Menos dramático
- Requiere tracking extra
```

### Variante D: Combinado

```
POT-004 (Salvaguarda) + POT-005 limitado (1/combate)

Pros:
- Flexibilidad
- Decisiones tácticas

Contras:
- Más complejo
```

---

## Recomendación

### Para Testear Primero

| ID | Propuesta | Configuración Inicial |
|----|-----------|----------------------|
| POT-004 | Salvaguarda | Coste 2 Dev, 1/escena |
| POT-005 | Escudo | 1 Dev = daño ÷2, máx 2/combate |

### Métricas a Observar

| Métrica | Antes | Objetivo | Alerta |
|---------|-------|----------|--------|
| Muertes de PJ | ~20%? | ~5-10% | >15% o <2% |
| Turnos de combate | 10-12 | 8-10 | >12 |
| Devoción al final | 2-3 | 1-2 | 0 siempre o 4+ siempre |
| Uso de Intervenciones | ? | 1-2/combate | 0 o >3 |

---

## Situaciones de Prueba Sugeridas

### Nueva: SETUP-POTENCIA-PROTECCION

```
Escenario: PJ con Devoción 5 vs enemigos letales

Probar:
- ¿Cuántas veces usa Salvaguarda?
- ¿Cuántas veces usa Escudo?
- ¿Cuánta Devoción le queda?
- ¿Se siente heroico o inmortal?
```

---

## Integración con Sistema Actual

### Potencias Confirmadas (POT-001 a POT-003)

| ID | Decisión | Estado |
|----|----------|--------|
| POT-001 | Devoción 0-5 | ✅ Confirmado |
| POT-002 | Intervención Menor (1 Dev) | ✅ Confirmado |
| POT-003 | Intervención Mayor (3 Dev) | ✅ Confirmado |
| **POT-004** | **Salvaguarda** | 📋 Propuesta |
| **POT-005** | **Escudo de Historia** | 📋 Propuesta |

### Usos de Devoción (si todo activo)

| Uso | Coste | Frecuencia |
|-----|-------|------------|
| Intervención Menor | 1 Dev | Ilimitado |
| Intervención Mayor | 3 Dev | 1/sesión |
| **Salvaguarda** | 2 Dev | 1/escena |
| **Escudo** | 1-2 Dev | 2/combate |

### Pregunta Clave

> ¿5 puntos de Devoción son suficientes para todos estos usos?
> 
> Si no: Aumentar a 6-7, o hacer mutuamente excluyentes

---

*Propuestas documentadas. Requieren testing antes de confirmar o descartar.*
