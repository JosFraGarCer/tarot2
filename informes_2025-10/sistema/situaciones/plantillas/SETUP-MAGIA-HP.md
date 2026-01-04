# ✨ Setup: Magia - Harry Potter

> **Propósito:** Testear sistema de magia académica con varitas
> **Estilo:** Versátil, aprendida, basada en conocimiento

---

## Sistema de Hechicería

### Mecánicas Base

| Mecánica | Descripción |
|----------|-------------|
| **Tirada** | Voluntad + Varitas vs Dificultad del hechizo |
| **Varita** | Afinidad da +1, enemiga da -2 |
| **Conocimiento** | Solo hechizos aprendidos |
| **Improvisación** | -3 a la tirada, riesgo de fallo |

### Tipos de Varitas

| Core | Afinidad | Bonus |
|------|----------|-------|
| Pluma de Fénix | Defensa, Luz | +1 Defensa |
| Pelo de Unicornio | Curación, Encantamientos | +1 Encantamientos |
| Fibra de Dragón | Combate, Fuego | +1 Maldiciones |
| Pelo de Thestral | Muerte, Oscuridad | +1 Oscuro |

---

## Escenario A: Duelo Estudiantil

### Estudiante 1

| Stat | Valor |
|------|-------|
| **Nombre** | |
| **Año** | 5º |
| **Voluntad** | 3 |
| **Varitas** | +2 |
| **Varita** | (tipo) - Afinidad: |
| **PA** | 8 |

### Hechizos Conocidos

| Hechizo | Dificultad | Efecto |
|---------|------------|--------|
| Expelliarmus | 8 | Desarmar |
| Stupefy | 10 | Aturdir, daño 3 |
| Protego | 9 | +4 defensa |
| Impedimenta | 9 | Ralentizar |

### Estudiante 2

| Stat | Valor |
|------|-------|
| **Nombre** | |
| **Año** | 5º |
| **Voluntad** | 3 |
| **Varitas** | +2 |
| **Varita** | (tipo) - Afinidad: |
| **PA** | 8 |

### Hechizos Conocidos

| Hechizo | Dificultad | Efecto |
|---------|------------|--------|
| Stupefy | 10 | Aturdir, daño 3 |
| Flipendo | 8 | Empujar, daño 2 |
| Locomotor Mortis | 9 | Paralizar piernas |
| Serpensortia | 10 | Invocar serpiente |

### Mecánica: Duelo

```
FASE 1: Saludo
  Tradición, ambos se inclinan

FASE 2: Primer Hechizo
  Retador lanza primero
  Defensor puede contrahechizo

CONTRAHECHIZO:
  Si conoces el mismo hechizo o Protego:
  Tirada opuesta
  Ganas: Su hechizo falla
```

---

## Escenario B: Clase de DCAO - Boggart

### Grupo de Estudiantes (×4)

| Estudiante | Voluntad | Miedo | Riddikulus Dif |
|------------|----------|-------|----------------|
| A | 2 | Snape | 18 |
| B | 4 | Fracaso | 16 |
| C | 3 | Arañas | 17 |
| D | 3 | Dementores | 17 |

### Boggart

| Stat | Valor |
|------|-------|
| **Habilidad** | Adopta forma del mayor miedo |
| **Debilidad** | Riddikulus (convertir en ridículo) |
| **Derrota** | 4+ éxitos de Riddikulus |

### Mecánica: Enfrentar Boggart

```
PASO 1: Boggart adopta tu miedo
  Tira Voluntad vs 10 para no paralizarte

PASO 2: Riddikulus
  Dificultad = 10 + (10 - Voluntad)
  Visualizar algo gracioso

PASO 3: Éxito
  Miedo se vuelve ridículo
  Boggart se debilita

PASO 4: Victoria
  Después de 4+ éxitos: explota
```

---

## Escenario C: Combate Serio - Mortífagos

### Grupo Defensor (×3-4 estudiantes)

| Stat | Promedio |
|------|----------|
| Voluntad | 3 |
| Varitas | +1 |
| PA | 8 |
| Hechizos | Stupefy, Protego, Expelliarmus |

### Mortífagos (×2-3)

| Stat | Valor |
|------|-------|
| **Voluntad** | 4 |
| **Varitas** | +2 |
| **PA** | 10 |
| **Ventaja** | Sin escrúpulos morales |

### Imperdonables

| Hechizo | Dificultad | Efecto | Defensa |
|---------|------------|--------|---------|
| Avada Kedavra | 15 | Muerte instantánea | Solo esquivar |
| Crucio | 13 | Dolor, -4 a todo | Voluntad vs resultado |
| Imperio | 14 | Control mental | Voluntad vs resultado |

### Preguntas Clave
- ¿La superioridad numérica compensa?
- ¿Los Imperdonables son demasiado letales?
- ¿Protego funciona contra todo?

---

## Tabla de Hechizos

### Año 1-2

| Hechizo | Dif | Efecto |
|---------|-----|--------|
| Lumos | 6 | Luz |
| Wingardium Leviosa | 7 | Levitar objeto |
| Alohomora | 8 | Abrir cerraduras |

### Año 3-4

| Hechizo | Dif | Efecto |
|---------|-----|--------|
| Expelliarmus | 8 | Desarmar |
| Riddikulus | Variable | vs Boggart |
| Expecto Patronum | 14 | vs Dementores |

### Año 5+

| Hechizo | Dif | Efecto |
|---------|-----|--------|
| Stupefy | 10 | Aturdir |
| Protego | 9 | Escudo |
| Reducto | 11 | Explosión, daño 5 |

### Prohibidos

| Hechizo | Dif | Efecto |
|---------|-----|--------|
| Avada Kedavra | 15 | Muerte |
| Crucio | 13 | Tortura |
| Imperio | 14 | Control |

---

## Variables a Probar

| Variable | Pregunta |
|----------|----------|
| Desarme | ¿Expelliarmus termina el duelo muy rápido? |
| Protego | ¿+4 defensa es suficiente? |
| Imperdonables | ¿Dificultad 15 hace Avada raro pero posible? |
| Aprendizaje | ¿Solo hechizos conocidos limita demasiado? |

---

## Métricas Específicas

| Métrica | Objetivo |
|---------|----------|
| Duelo estudiantil | 2-4 turnos |
| Boggart grupal | 4-6 turnos |
| Combate vs Mortífagos | Tenso, posibles bajas |

---

*La magia no hace al mago. El conocimiento y el corazón sí.*
