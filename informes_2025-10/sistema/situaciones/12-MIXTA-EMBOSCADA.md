# 🎭 Situación 12: Emboscada y Transiciones

> **Objetivo:** Testear cambios de modo (exploración → combate → social)
> **Reglas a validar:** Iniciativa Heroica, sorpresa, transiciones fluidas

---

## Escenario A: Emboscada a los PJs

### Contexto
Los héroes viajan de noche y son emboscados por bandidos. Testea qué pasa cuando los enemigos actúan primero.

### Setup

**Grupo de Héroes (4 PJs)**
```
Lan: PA 12, Percepción +3
Egwene: PA 7, Percepción +2
Mat: PA 8, Percepción +1
Perrin: PA 10, Percepción +4
```

**Bandidos (6)**
```
PA: 5, Sigilo +2
Posición: Ocultos en los árboles
Ventaja: Sorpresa
```

### Mecánica: Detectar Emboscada

```
ANTES DEL COMBATE:
  Cada PJ tira Percepción vs Sigilo de los bandidos
  
  Dificultad: 6 (base) + 2 (sigilo) + 2 (noche) = 10
  
Resultados:
  - Nadie detecta: Sorpresa completa (enemigos actúan 1 asalto gratis)
  - Alguien detecta: Avisa a los demás (sin sorpresa, Iniciativa normal)
  - Todos detectan: Los PJs pueden contraemboscar
```

### Simulación: Nadie Detecta

```
Tiradas de Percepción vs 10:
  Lan: d12(3) + 3 = 6 → FALLA
  Egwene: d12(5) + 2 = 7 → FALLA
  Mat: d12(4) + 1 = 5 → FALLA
  Perrin: d12(2) + 4 = 6 → FALLA (mala suerte)

ASALTO DE SORPRESA (solo bandidos actúan):
  6 bandidos disparan flechas
  
  Bandido → Lan: d12(7) + 3 = 10 vs Defensa Pasiva 10 → IMPACTA, daño 2
  Bandido → Egwene: d12(9) + 3 = 12 vs Defensa Pasiva 8 → IMPACTA, daño 3
  Bandido → Mat: d12(5) + 3 = 8 vs Defensa Pasiva 9 → FALLA
  Bandido → Perrin: d12(8) + 3 = 11 vs Defensa Pasiva 9 → IMPACTA, daño 2
  (2 bandidos fallan)
  
Estado:
  Lan: 12 - 2 = 10 PA
  Egwene: 7 - 3 = 4 PA (Malherido)
  Mat: 8 PA (intacto)
  Perrin: 10 - 2 = 8 PA
```

**ASALTO 1 (Iniciativa Heroica restaurada):**

```
Los PJs ahora pueden actuar primero.

FASE DE HÉROES:
  Egwene (herida): ¿Cubrirse o atacar?
  → Decide cubrirse detrás de una roca
  
  Lan: Carga al bandido más cercano
  → Usa Defensa Pasiva contra bandido nivel bajo
  → ELIMINA 1 bandido
  
  Mat: Usa "Golpe Sucio" para actuar antes
  → Se esconde y prepara contraemboscada
  
  Perrin: Dispara arco
  → ELIMINA 1 bandido

FASE DE ENEMIGOS:
  4 bandidos restantes atacan
  → Menos efectivos ahora que los PJs están alertas
```

### Análisis

- La emboscada causó daño pero no fue letal
- La Iniciativa Heroica se restaura después de la sorpresa
- Los PJs recuperan ventaja táctica rápidamente

---

## Escenario B: Los PJs Emboscan

### Contexto
Los héroes preparan una emboscada contra una patrulla enemiga.

### Setup

```
PJs: 4 (escondidos)
Patrulla: 6 soldados + 1 oficial
Terreno: Bosque con buena cobertura
```

### Mecánica: Preparar Emboscada

```
FASE DE PREPARACIÓN:
  1. Elegir posiciones (DJ aprueba)
  2. Tirada de Sigilo grupal vs Percepción del enemigo
  3. Si pasan: Tienen asalto de sorpresa
  
SIGILO GRUPAL:
  Cada PJ tira Sigilo
  Resultado = Promedio de tiradas
  
  Lan: d12 + 1 = 8
  Egwene: d12 + 1 = 7
  Mat: d12 + 3 = 12
  Perrin: d12 + 2 = 9
  Promedio: 9
  
  vs Percepción patrulla: d12 + 2 = 7
  → PJs ganan: SORPRESA
```

### Simulación con Sorpresa

```
ASALTO DE SORPRESA (PJs):
  
  Egwene: Bola de Fuego al grupo
  → 3 soldados en área → ELIMINADOS
  
  Lan: Carga al oficial
  → Daño masivo, oficial Malherido
  
  Perrin + Mat: Atacan soldados restantes
  → 2 más ELIMINADOS
  
Estado después de sorpresa:
  Soldados: 1 restante (de 6)
  Oficial: Malherido
  
ASALTO 1 (normal):
  Los PJs terminan el combate rápidamente
```

### Análisis

- La preparación da enormes ventajas
- Eliminar amenazas en sorpresa cambia el combate
- El oficial sobrevive → puede huir y alertar

---

## Escenario C: Transición Combate → Social

### Contexto
Después de derrotar a los bandidos, los PJs descubren que son aldeanos desesperados, no criminales. Transición a escena social.

### Mecánica: Rendición

```
CUANDO ENEMIGOS SE RINDEN:
  El combate termina inmediatamente
  Transición a modo social
  Los PJs deciden qué hacer

OPCIONES:
  1. Aceptar rendición (social)
  2. Ignorar rendición (combate continúa, posible violación de dogmas)
  3. Condiciones (negociación)
```

### Simulación

```
MOMENTO DE LA RENDICIÓN:
  Bandido líder: "¡Parad! Nos rendimos... Por favor..."
  
  DJ describe: Ves que son campesinos mal armados.
  Algunos son ancianos. Hay un niño escondido.
  
TRANSICIÓN A SOCIAL:
  
Mat: "¿Por qué nos atacasteis?"
  → Tirada de Empatía para leer al líder
  → d12(8) + 2 = 10 vs Voluntad 2 = ÉXITO
  → "Están desesperados, no malvados"

Líder: "El señor feudal nos quitó la cosecha. Teníamos que..."

DECISIÓN DEL GRUPO:
  Opción A: Dejarles ir con advertencia
  Opción B: Ayudarles contra el señor feudal (nueva misión)
  Opción C: Entregarles a las autoridades
  
Si eligen B:
  → Nueva trama secundaria
  → Posible conflicto con el señor feudal
  → Los "bandidos" se convierten en aliados
```

### Impacto en Devoción

```
PALADÍN DE LA LUZ (si está en el grupo):

Si elige A (dejar ir):
  Dogma "Proteger inocentes" ✓
  → +1 Devoción
  
Si elige B (ayudar):
  Dogma "Proteger inocentes" ✓✓
  → +2 Devoción (acto significativo)
  
Si elige C (entregar):
  Dogma "No hacer daño a indefensos" ✗?
  → Discusión sobre si es violación
  → DJ decide según contexto
```

---

## Escenario D: Infiltración que Sale Mal

### Contexto
Los PJs intentan infiltrarse en un castillo. Son descubiertos. Transición de sigilo a combate.

### Setup

```
Objetivo: Robar un documento del despacho del lord
Guardias: 20 en el castillo, 4 en ruta
Alarma: Si suena, +10 guardias en 3 turnos
```

### Mecánica: Modo Infiltración

```
MODO SIGILO:
  Cada "zona" del castillo requiere una tirada
  Fallo: Detección parcial (guardias investigan)
  Fallo crítico: Alarma inmediata
  
ZONAS:
  1. Muralla exterior (Dificultad 8)
  2. Patio interior (Dificultad 10)
  3. Pasillo de guardias (Dificultad 12)
  4. Despacho (Dificultad 8, pero cerrado)
```

### Simulación

```
ZONA 1: Muralla
  Mat (el sigiloso): d12(9) + 3 = 12 vs 8 → ÉXITO
  Grupo pasa sin problemas

ZONA 2: Patio
  Mat: d12(5) + 3 = 8 vs 10 → FALLA
  → Un guardia mira en su dirección
  → "¿Quién anda ahí?"
  
DECISIÓN:
  A) Esconderse (nueva tirada de Sigilo, Dificultad 12)
  B) Distraer al guardia (tirada Social)
  C) Neutralizarlo silenciosamente (tirada de Combate)
  
Eligen C:
  Mat: Intenta noquear silenciosamente
  d12(8) + 4 = 12 vs Guardia d12(6) + 2 = 8
  → ÉXITO, guardia inconsciente
  → Pero otro guardia viene en 2 turnos...
```

**TRANSICIÓN A COMBATE:**

```
ZONA 3: Descubiertos
  Guardia: "¡INTRUSOS!"
  → Alarma suena
  → 3 turnos hasta refuerzos
  
COMBATE RÁPIDO:
  Los PJs deben:
  1. Derrotar a los 4 guardias presentes
  2. Llegar al despacho
  3. Robar el documento
  4. Escapar antes de que lleguen refuerzos
  
  Turnos disponibles: 3 + tiempo de combate
  
  Si tardan más de 6 turnos:
  → Refuerzos llegan
  → Escape se vuelve muy difícil
```

### Mecánica: Escape

```
RUTA DE ESCAPE:
  Opción A: Por donde entraron (conocida, probable que esté vigilada)
  Opción B: Salto desde ventana (Agilidad vs 12, daño por caída)
  Opción C: Por las cloacas (Vigor vs 10 para no enfermarse)
  
PERSECUCIÓN:
  Si les persiguen:
  Tiradas opuestas de Agilidad cada turno
  3 éxitos de los PJs: Escapan
  3 éxitos de guardias: Rodeados
```

---

## Guía: Transiciones de Modo

### De Exploración a Combate

| Trigger | Resultado |
|---------|-----------|
| PJs detectan enemigos | Iniciativa Heroica |
| Enemigos detectan PJs | Enemigos primero |
| Detección mutua | Tirada de Iniciativa |

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
| Traición | Tirada de Percepción para no ser sorprendido |

---

## Registro de Pruebas

| Escenario | Transiciones | Fluidez | Notas |
|-----------|--------------|---------|-------|
| A: Emboscada a PJs | | | |
| B: PJs emboscan | | | |
| C: Combate → Social | | | |
| D: Infiltración → Combate | | | |

---

*La aventura fluye. El sistema debe fluir con ella.*
