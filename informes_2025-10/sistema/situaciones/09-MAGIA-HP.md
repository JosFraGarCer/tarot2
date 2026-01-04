# ✨ Situación 09: Magia - Harry Potter

> **Objetivo:** Testear sistema de magia académica con varitas
> **Tipo de magia:** Versátil, aprendida, basada en conocimiento

---

## Sistema de Magia HP

### Mecánicas Base

```
LANZAR HECHIZO:
  Tirada: Voluntad + Varitas vs Dificultad del hechizo
  
VARITA:
  Cada varita tiene afinidad con ciertos tipos de magia
  Varita afín: +1 al hechizo
  Varita enemiga: -2 al hechizo
  
CONOCIMIENTO:
  Solo puedes lanzar hechizos que conoces
  Hechizos se aprenden en clases o libros
  Improvisación: -3 al hechizo, posible fallo catastrófico
```

### Tipos de Hechizos

| Tipo | Descripción | Ejemplos |
|------|-------------|----------|
| **Encantamientos** | Efectos sobre objetos | Wingardium Leviosa, Lumos |
| **Transfiguración** | Cambiar forma | Vera Verto, Animago |
| **Defensa** | Protección y combate | Expelliarmus, Protego |
| **Maldiciones** | Efectos negativos | Stupefy, Impedimenta |
| **Imperdonables** | Prohibidas, muy poderosas | Avada Kedavra, Crucio, Imperio |

### Varitas y Afinidades

| Core | Afinidad | Bonus |
|------|----------|-------|
| Pluma de Fénix | Defensa, Luz | +1 Defensa |
| Pelo de Unicornio | Curación, Encantamientos | +1 Encantamientos |
| Fibra de Dragón | Combate, Fuego | +1 Maldiciones |
| Pelo de Thestral | Muerte, Oscuridad | +1 Imperdonables |

---

## Escenario A: Duelo en el Club

### Contexto
Harry vs Draco en el Club de Duelo. Combate mágico académico.

### Setup

**Harry (Estudiante 5º año)**
```
Voluntad: 3
Varitas: +2
Varita: Pluma de Fénix (+1 Defensa)

Hechizos conocidos:
  - Expelliarmus: Desarmar, Dif 8
  - Stupefy: Aturdir, Dif 10, daño 3
  - Protego: Escudo, Dif 9, +4 defensa
  - Expecto Patronum: vs Dementores, Dif 14
```

**Draco (Estudiante 5º año)**
```
Voluntad: 3
Varitas: +2
Varita: Pelo de Unicornio (+1 Encantamientos)

Hechizos conocidos:
  - Serpensortia: Invocar serpiente, Dif 10
  - Stupefy: Aturdir, Dif 10, daño 3
  - Locomotor Mortis: Paralizar piernas, Dif 9
  - Flipendo: Empujar, Dif 8, daño 2
```

### Mecánica: Duelo Mágico

```
FASE 1: Saludo
  Ambos se inclinan (tradición)
  
FASE 2: Primer Hechizo
  El retador (Draco) lanza primero
  El defensor puede intentar contrahechizo
  
CONTRAHECHIZO:
  Si conoces el mismo hechizo o Protego:
  Tirada opuesta: Tu hechizo vs Su hechizo
  Ganas: Su hechizo falla
  Pierdes: Recibes el efecto completo
```

### Simulación

**TURNO 1:**
```
Draco: ¡Serpensortia!
  d12(7) + 3 + 2 = 12 vs Dificultad 10 → ÉXITO
  Una serpiente aparece y ataca a Harry

Harry: Responde con Parsel (habilidad especial)
  La serpiente se detiene, no ataca
  Draco confundido
```

**TURNO 2:**
```
Harry: ¡Expelliarmus!
  d12(9) + 3 + 2 + 1 (Defensa) = 15 vs Draco esquiva
  Draco: d12(4) + 3 = 7
  → Harry gana por 8, Draco desarmado

Draco: Sin varita, no puede lanzar hechizos
  → Harry gana el duelo
```

### Análisis

- Los duelos HP son rápidos (2-4 turnos)
- Desarmar es muy efectivo
- Las habilidades especiales (Parsel) cambian las reglas

---

## Escenario B: Defensa Contra las Artes Oscuras

### Contexto
Un grupo de estudiantes se enfrenta a un Boggart.

### Setup

**Boggart**
```
Habilidad: Adopta la forma de tu mayor miedo
Debilidad: Riddikulus (convertir miedo en ridículo)
Mecánica: Cada estudiante enfrenta su propio miedo
```

**Estudiantes (x4)**
```
Neville: Miedo a Snape, Voluntad 2
Hermione: Miedo a fracasar, Voluntad 4
Ron: Miedo a arañas, Voluntad 3
Harry: Miedo a Dementores, Voluntad 3
```

### Mecánica: Enfrentar el Boggart

```
PASO 1: El Boggart adopta tu miedo
  Tira Voluntad vs 10 para no quedar paralizado
  
PASO 2: Lanzar Riddikulus
  Dificultad = 10 + (10 - tu Voluntad)
  Neville: Dificultad 18 (muy difícil)
  Hermione: Dificultad 16
  
PASO 3: Si tienes éxito
  El miedo se vuelve ridículo
  El Boggart se debilita
  
PASO 4: Después de 4+ éxitos
  El Boggart explota
```

### Simulación

```
Neville vs Boggart-Snape:
  Voluntad: d12(3) + 2 = 5 vs 10 → FALLA, paralizado
  Hermione ayuda: "¡Piensa en algo gracioso!"
  Neville reintenta con +2: d12(8) + 2 + 2 = 12 vs 10 → ÉXITO
  
  Riddikulus: d12(6) + 2 + 2 = 10 vs 18 → FALLA
  El Boggart sigue siendo aterrador
  
  Lupin interviene: "Imagina a Snape con ropa de tu abuela"
  Riddikulus con ayuda (+4): d12(9) + 2 + 2 + 4 = 17 vs 18 → FALLA por 1
  
  Escala del Destino: d12 Destino = 2, Habilidad = 9
  Balanza: +7 → Bendición Mayor
  → ¡El hechizo funciona de forma espectacular!
  → Snape-Boggart aparece con vestido y bolso
```

---

## Escenario C: Batalla de Hogwarts

### Contexto
Combate a gran escala. Estudiantes y profesores vs Mortífagos.

### Setup Simplificado

**Grupo de Estudiantes del ED (x5)**
```
Promedio: Voluntad 3, Varitas +1
Hechizos: Stupefy, Protego, Expelliarmus
```

**Mortífagos (x3)**
```
Promedio: Voluntad 4, Varitas +2
Hechizos: Avada Kedavra, Crucio, Stupefy
Ventaja: Sin escrúpulos morales
```

### Mecánica: Imperdonables

```
AVADA KEDAVRA (Maldición Asesina):
  Dificultad: 15
  Efecto: Muerte instantánea si impacta
  Defensa: Solo esquivar o bloqueo físico
  Protego NO funciona
  
CRUCIO (Maldición Cruciatus):
  Dificultad: 13
  Efecto: Dolor incapacitante, -4 a todo
  Defensa: Voluntad vs 15 para resistir
  
IMPERIO (Maldición Imperius):
  Dificultad: 14
  Efecto: Control mental total
  Defensa: Voluntad vs resultado del lanzador
```

### Simulación

**TURNO 1:**
```
Mortífago A: ¡Avada Kedavra! a Estudiante 1
  d12(8) + 4 + 2 = 14 vs Dificultad 15 → FALLA
  El hechizo pasa de largo
  
Estudiante 1: ¡Stupefy!
  d12(7) + 3 + 1 = 11 vs Mortífago esquiva d12(5) + 4 = 9
  → IMPACTA, Mortífago A inconsciente

Mortífago B: ¡Crucio! a Estudiante 2
  d12(9) + 4 + 2 = 15 vs Dificultad 13 → ÉXITO
  Estudiante 2: Voluntad d12(4) + 3 = 7 vs 15 → FALLA
  → Estudiante 2 incapacitado por dolor
```

### Análisis

- Los Imperdonables son devastadores pero difíciles
- La ventaja numérica de los estudiantes compensa
- El combate HP es letal y rápido

---

## Tabla de Hechizos HP

| Hechizo | Dificultad | Efecto | Año |
|---------|------------|--------|-----|
| Lumos | 6 | Luz | 1º |
| Wingardium Leviosa | 7 | Levitar objeto | 1º |
| Alohomora | 8 | Abrir cerraduras | 1º |
| Expelliarmus | 8 | Desarmar | 2º |
| Stupefy | 10 | Aturdir | 4º |
| Protego | 9 | Escudo (+4 def) | 4º |
| Reducto | 11 | Explosión (daño 5) | 4º |
| Expecto Patronum | 14 | vs Dementores | 3º+ |
| Avada Kedavra | 15 | Muerte | Prohibido |
| Crucio | 13 | Tortura | Prohibido |
| Imperio | 14 | Control | Prohibido |

### Aprendizaje de Hechizos

```
En clase:
  Tirada de Ingenio + Estudio vs Dificultad del hechizo
  Éxito: Aprendes el hechizo
  Fallo: Puedes reintentar la próxima clase

Por libro:
  Dificultad +2
  Sin supervisión, riesgo de accidente

Improvisación:
  -3 a la tirada
  Fallo crítico: Efecto inesperado (DJ decide)
```

---

## Registro de Pruebas

| Escenario | Turnos | Heridos | Notas |
|-----------|--------|---------|-------|
| A: Duelo Club | | | |
| B: Boggart | | | |
| C: Batalla | | | |

---

*La magia no hace al mago. El conocimiento y el corazón sí.*
