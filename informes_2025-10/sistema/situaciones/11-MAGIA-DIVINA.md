# 🙏 Situación 11: Potencias y Devoción

> **Objetivo:** Testear el sistema universal de fe y poderes superiores
> **Tipo de magia:** Basada en creencias, no en estudio

---

## Sistema de Potencias

### Mecánicas Base

```
DEVOCIÓN:
  Recurso: 0-5 puntos
  Recuperación: Actos de fe, descanso largo, rituales
  
INTERVENCIONES:
  Menor: 1 Devoción, efectos moderados
  Mayor: 3 Devoción, efectos poderosos
  
DOGMAS:
  3 principios que definen tu Potencia
  Seguirlos: Recuperas Devoción
  Romperlos: Pierdes Devoción o la Potencia te abandona
```

### Potencias por Género

| Género | Potencias Ejemplo |
|--------|-------------------|
| **Fantasía Medieval** | La Luz, El Viejo Dios, La Naturaleza |
| **La Rueda del Tiempo** | El Creador, La Rueda, Los Ancestros |
| **Harry Potter** | Dumbledore's Army, La Pureza de Sangre |
| **Warcraft** | La Luz Sagrada, Los Loa, Los Ancestros |
| **Ciencia Ficción** | La Fuerza, El Código Jedi, La Federación |
| **Espionaje** | La Agencia, El Patriotismo, La Justicia |

---

## Escenario A: Paladín de la Luz vs No-Muertos

### Contexto
Un caballero de la Luz defiende una aldea de una horda de no-muertos.

### Setup

**Sir Aldric (Paladín - Sello Viaje)**
```
Físico: Fuerza 4, Vigor 4
PA: 12 | Protección: 4

Potencia: La Luz Sagrada
Devoción: 5/5

Dogmas:
  1. Proteger a los inocentes
  2. No matar a los indefensos
  3. Nunca huir del mal

Intervenciones Menores (1 Devoción):
  - Curación por Imposición: +4 PA a un aliado
  - Luz Sagrada: Ilumina área, no-muertos -2
  - Bendición: +2 a la próxima tirada de un aliado

Intervenciones Mayores (3 Devoción):
  - Exorcismo: Daño 10 a no-muertos, ignora protección
  - Escudo Divino: Inmune a daño 1 turno
  - Consagración: Área sagrada, no-muertos no pueden entrar
```

**Esqueletos (x6)**
```
PA: 4 | Protección: 0
Debilidad: Luz Sagrada (+50% daño, -2 a tiradas)
```

**Ghoul (Líder)**
```
PA: 12 | Protección: 1
Habilidad: Aura de Terror (Voluntad vs 10 o -2)
Debilidad: Luz Sagrada
```

### Simulación

**TURNO 1:**
```
Sir Aldric: Activa Luz Sagrada (1 Devoción)
  → Área iluminada
  → Todos los no-muertos: -2 a tiradas
  Devoción: 5 - 1 = 4

Ghoul: Aura de Terror
  Sir Aldric: Voluntad d12(8) + 3 = 11 vs 10 → RESISTE
  "¡La Luz me protege!"

Esqueletos (con -2): Atacan
  d12 + 2 - 2 = d12 vs Aldric d12 + 4
  → Probablemente todos fallan
```

**TURNO 2:**
```
Sir Aldric: Exorcismo contra el Ghoul (3 Devoción)
  d12(9) + Alma(3) + Luz(+2) = 14 vs Ghoul Voluntad d12(4) + 2 = 6
  → IMPACTA, daño 10 (ignora protección)
  → Ghoul: 12 - 10 = 2 PA (Crítico)
  Devoción: 4 - 3 = 1

Ghoul (Crítico -3): Ataca desesperado
  d12(5) + 4 - 3 = 6 vs Aldric d12(7) + 4 = 11
  → FALLA
```

**TURNO 3:**
```
Sir Aldric: Ataca con espada bendita
  d12(8) + 4 + 2 = 14 vs Ghoul ya debilitado
  → Ghoul ELIMINADO
  
Esqueletos: Moral rota sin líder
  → 4 huyen, 2 atacan
  → Aldric los despacha fácilmente
  
VICTORIA
```

### Recuperación de Devoción

```
Después del combate:
  Sir Aldric protegió a los aldeanos (Dogma 1) ✓
  No mató indefensos (Dogma 2) ✓
  No huyó del mal (Dogma 3) ✓
  
  → Recupera 1 Devoción por dogma cumplido en situación significativa
  → Devoción: 1 + 1 = 2 (parcial, necesita descanso para completo)
```

---

## Escenario B: Druida de la Naturaleza vs Corrupción

### Contexto
Un druida debe purificar un bosque corrompido.

### Setup

**Rowan (Druida - Sello Viaje)**
```
PA: 9 | Protección: 1 (piel de corteza)
Potencia: La Madre Naturaleza
Devoción: 5/5

Dogmas:
  1. Proteger el equilibrio natural
  2. No usar metal forjado
  3. Respetar el ciclo de vida y muerte

Intervenciones Menores:
  - Hablar con Animales: Comunicación animal
  - Curación Natural: +3 PA, solo en exteriores
  - Enredaderas: Inmovilizar enemigo 1 turno

Intervenciones Mayores:
  - Forma Animal: Transformarse en oso/lobo/águila
  - Purificación: Elimina corrupción/veneno
  - Llamar Tormenta: Control del clima
```

**Bosque Corrompido**
```
Corrupción: 10/10 (debe reducirse a 0)
Guardianes Corrompidos (x3): PA 8, Protección 2
Cada turno sin actuar: Corrupción -1 (regenera lentamente)
```

### Mecánica: Purificación Ritual

```
RITUAL DE PURIFICACIÓN:
  Requiere: 3 turnos de concentración sin interrupciones
  Coste: 3 Devoción
  Efecto: Reduce Corrupción en 5
  
Si es interrumpido:
  Pierde el progreso
  Devoción gastada igualmente
```

### Simulación

**TURNO 1:**
```
Rowan: Comienza Ritual de Purificación
  → Debe mantenerse 3 turnos
  
Guardianes detectan la magia:
  → Atacan a Rowan
  
Guardián A: d12(7) + 4 = 11 vs Rowan d12(5) + 2 = 7
  → IMPACTA, daño 3 - 1 = 2
  → Rowan: 9 - 2 = 7 PA
  → Ritual INTERRUMPIDO
  
Rowan: Pierde concentración, sin gasto de Devoción (no completó)
```

**TURNO 2:**
```
Rowan: Cambia táctica - Enredaderas (1 Devoción)
  → Inmoviliza Guardián A
  Devoción: 5 - 1 = 4

Guardianes B y C atacan:
  → Rowan esquiva uno, recibe otro
  → Rowan: 7 - 2 = 5 PA
```

**TURNO 3:**
```
Rowan: Forma Animal - Oso (3 Devoción)
  → PA temporal: 5 + 8 = 13
  → Protección: 3 (piel de oso)
  → Ataque: d12 + 6 (garras)
  Devoción: 4 - 3 = 1

En forma de oso, derrota a los guardianes en 2-3 turnos.
```

**TURNO 6-8:**
```
Guardianes derrotados.
Rowan: Sin Devoción suficiente para Purificación Mayor

Alternativa:
  Descansar y recuperar Devoción (lento)
  O realizar múltiples rituales menores (varios días)
```

### Dilema de Dogmas

```
Si Rowan usa un arma de metal encontrada:
  → Más eficaz contra guardianes
  → PERO viola Dogma 2 (no usar metal forjado)
  → Pierde 2 Devoción
  
Decisión del jugador:
  ¿Pragmatismo o principios?
```

---

## Escenario C: Clérigo de Guerra en Batalla

### Contexto
Un sacerdote de un dios de guerra acompaña a un ejército.

### Setup

**Padre Marcus (Clérigo de Ares)**
```
PA: 10 | Protección: 3 (armadura bendita)
Potencia: Ares, Dios de la Guerra
Devoción: 5/5

Dogmas:
  1. La batalla es sagrada
  2. Morir con honor es la mayor gloria
  3. Nunca rendirse

Intervenciones Menores:
  - Bendición de Guerra: +2 daño a un aliado
  - Resistencia: +3 PA temporal
  - Grito de Guerra: Aliados cercanos +1 a ataques

Intervenciones Mayores:
  - Frenesí Sagrado: Aliado ataca 2 veces este turno
  - Mártir: Recibe todo el daño de un aliado este turno
  - Avatar de Guerra: +4 a Fuerza y Ataque, 3 turnos
```

### Mecánica: Devoción en Batalla

```
RECUPERAR DEVOCIÓN EN COMBATE:
  - Derrotar un enemigo digno: +1 Devoción
  - Sobrevivir herida grave: +1 Devoción
  - Liderar carga exitosa: +1 Devoción
  
PERDER DEVOCIÓN:
  - Huir del combate: -2 Devoción
  - Atacar a enemigo rendido: -1 Devoción
  - Mostrar cobardía: -3 Devoción
```

### Simulación

**Batalla campal: Grupo vs Enemigos**

```
TURNO 1:
Marcus: Grito de Guerra (1 Devoción)
  → Todos los aliados +1 ataque
  → Grupo gana ventaja en el asalto

TURNO 2:
Un aliado cae en combate.
Marcus: Mártir - recibe el daño por él (3 Devoción)
  → El aliado sobrevive
  → Marcus recibe 8 daño
  → Marcus: 10 - 8 = 2 PA (Crítico)
  Devoción: 4 - 3 = 1

TURNO 3:
Marcus (Crítico): No huye (Dogma 3)
  → Avatar de Guerra (pero no tiene Devoción)
  → Ataca con lo que le queda
  
  Si muere en combate:
  → Cumple Dogma 2 (morir con honor)
  → Muerte gloriosa, los aliados se inspiran
```

---

## Tabla de Potencias por Ambientación

### Fantasía Medieval

| Potencia | Dominio | Dogmas |
|----------|---------|--------|
| **La Luz** | Curación, protección | Compasión, verdad, sacrificio |
| **La Naturaleza** | Druídismo, animales | Equilibrio, respeto, ciclos |
| **La Guerra** | Combate, valor | Honor, coraje, no rendirse |
| **La Muerte** | Necrománticos, espíritus | Respeto a muertos, ciclo, verdad |

### La Rueda del Tiempo

| Potencia | Dominio | Dogmas |
|----------|---------|--------|
| **La Torre Blanca** | Orden, conocimiento | Servir a todos, neutralidad, secreto |
| **Los Ancestros** | Sabiduría, tradición | Honor, lealtad al clan, memoria |
| **El Creador** | Luz, esperanza | Fe, perseverancia, bondad |

### Warcraft

| Potencia | Dominio | Dogmas |
|----------|---------|--------|
| **La Luz Sagrada** | Curación, exorcismo | Tenacidad, respeto, compasión |
| **Los Loa** | Naturaleza, espíritus | Ofrendas, equilibrio, respeto |
| **Elune** | Luna, noche | Proteger Azeroth, ciclo lunar, sabiduría |

---

## Registro de Pruebas

| Escenario | Devoción usada | Dogmas probados | Notas |
|-----------|----------------|-----------------|-------|
| A: Paladín vs No-Muertos | | | |
| B: Druida vs Corrupción | | | |
| C: Clérigo en Batalla | | | |

---

*La fe mueve montañas. La Devoción las aplasta.*
