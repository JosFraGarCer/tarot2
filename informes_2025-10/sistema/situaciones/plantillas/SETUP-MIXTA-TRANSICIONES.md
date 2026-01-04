# 🎭 Setup: Transiciones de Modo

> **Propósito:** Testear cambios entre exploración, combate y social
> **Estilo:** Emboscadas, infiltración, rendición, negociación bajo presión

---

## Mecánicas de Transición

### De Exploración a Combate

| Trigger | Resultado |
|---------|-----------|
| PJs detectan enemigos | Iniciativa Heroica |
| Enemigos detectan PJs | Enemigos primero |
| Detección mutua | Tirada de Iniciativa |
| Emboscada exitosa | 1 turno de sorpresa |

### De Combate a Social

| Trigger | Resultado |
|---------|-----------|
| Enemigos se rinden | Transición inmediata |
| PJs ofrecen parley | Tirada Social vs Voluntad |
| Situación cambia | DJ narra transición |

### De Social a Combate

| Trigger | Resultado |
|---------|-----------|
| Negociación falla | Enemigos primero (enfadados) |
| PJ ataca primero | Iniciativa Heroica |
| Traición | Percepción para no ser sorprendido |

---

## Escenario A: Emboscada a los PJs

### Contexto
Los héroes viajan y son emboscados.

### Grupo de Héroes

| PJ | PA | Percepción |
|----|-----|------------|
| 1 | | + |
| 2 | | + |
| 3 | | + |
| 4 | | + |

### Emboscadores

| Stat | Valor |
|------|-------|
| **Número** | |
| **Sigilo** | + |
| **Posición** | Ocultos |

### Mecánica: Detectar Emboscada

```
Cada PJ: Percepción vs Sigilo de emboscadores + Modificadores

Dificultad = 6 (base) + Sigilo + Condiciones

Condiciones:
  Noche: +2
  Lluvia/ruido: +1
  PJs distraídos: +2
  Terreno favorable: +1

Resultados:
  Nadie detecta: Sorpresa completa (1 turno gratis)
  Alguien detecta: Avisa, sin sorpresa
  Todos detectan: Pueden contraemboscar
```

---

## Escenario B: Los PJs Emboscan

### Contexto
Los héroes preparan emboscada.

### Preparación

```
FASE 1: Elegir posiciones
  DJ aprueba viabilidad

FASE 2: Sigilo grupal
  Cada PJ tira Sigilo
  Resultado = Promedio

FASE 3: Esperar
  Enemigos pasan
  
FASE 4: Atacar
  Si Sigilo > Percepción enemiga: Sorpresa
```

### Objetivos

| Stat | Valor |
|------|-------|
| **Número** | |
| **Percepción** | + |
| **Alerta** | Baja/Media/Alta |

---

## Escenario C: Combate → Rendición → Social

### Contexto
Durante un combate, los enemigos se rinden.

### Momento de la Rendición

```
Trigger típico:
  - Líder cae
  - 50%+ eliminados
  - Moral rota

Transición:
  Combate PARA inmediatamente
  Modo Social activo
```

### Decisiones Post-Rendición

| Opción | Consecuencia |
|--------|--------------|
| Aceptar | Nueva escena social |
| Rechazar | Combate continúa, enemigos desesperados |
| Condiciones | Negociación |

### Impacto en Devoción

```
Si el PJ tiene Potencia de Luz/Justicia:
  - Aceptar rendición: +1 Devoción (proteger indefensos)
  - Matar rendidos: -2 Devoción (violar dogma)

Si Potencia de Guerra:
  - Aceptar: Neutral (no es cobardía)
  - Ejecutar: Depende del contexto
```

---

## Escenario D: Infiltración que Sale Mal

### Contexto
Misión sigilosa que se convierte en combate.

### Objetivo

| Stat | Valor |
|------|-------|
| **Meta** | Robar documento / Liberar prisionero / etc. |
| **Ubicación** | Castillo / Base / etc. |
| **Guardias totales** | |
| **Guardias en ruta** | |
| **Alarma** | Trae +X guardias en Y turnos |

### Zonas de Infiltración

| Zona | Dificultad Sigilo | Notas |
|------|-------------------|-------|
| Exterior | 8 | |
| Interior | 10 | |
| Área restringida | 12 | |
| Objetivo | 8 | Pero cerrado |

### Mecánica: Fallo de Sigilo

```
Fallo menor (por 1-3):
  Guardia investiga
  Oportunidad de esconderse o neutralizar

Fallo mayor (por 4+):
  ¡Descubierto!
  Alarma en 1 turno si no actúas

Fallo crítico:
  Alarma inmediata
```

### Transición a Combate

```
DESCUBIERTOS:
  Alarma suena (o cuenta regresiva)
  
  Turnos hasta refuerzos: ___
  
  Opciones:
  A) Abortar misión, escapar
  B) Completar rápido, luego escapar
  C) Luchar hasta el final
```

---

## Escenario E: Negociación Bajo Presión

### Contexto
Social con amenaza de combate inminente.

### Setup

```
Situación: Rehenes / Enfrentamiento / Ultimátum

Temporizador:
  X turnos/tiradas antes de que estalle combate
  
Cada fallo social:
  -1 turno al temporizador
  
Éxito crítico:
  Desactiva el temporizador
```

### Mecánica

```
TURNO 1-3:
  Intentos de negociación
  Cada intento es una tirada
  
SI TEMPORIZADOR LLEGA A 0:
  Transición a combate
  Enemigos actúan primero (preparados)
  
SI NEGOCIACIÓN ÉXITO:
  Evitan combate
  Resolución social
```

---

## Variables a Probar

| Variable | Pregunta |
|----------|----------|
| Sorpresa | ¿1 turno gratis es demasiado? |
| Detección | ¿Percepción vs Sigilo equilibrado? |
| Rendición | ¿El sistema la incentiva? |
| Transiciones | ¿Son fluidas o confusas? |

---

## Métricas Específicas

| Métrica | Objetivo |
|---------|----------|
| Tiempo de transición | <1 min narrativo |
| Claridad de reglas | Sin consultar manual |
| Impacto de la preparación | Significativo |
| Fluidez narrativa | Alta |

---

*La aventura fluye. El sistema debe fluir con ella.*
