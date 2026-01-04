# ⚡ Situación 10: Magia - Warcraft

> **Objetivo:** Testear sistema de magia profesional con clases
> **Tipo de magia:** Definida por clase, recursos específicos

---

## Sistema de Magia Warcraft

### Mecánicas Base

```
MAGIA DE CLASE:
  Cada clase tiene acceso a escuelas específicas
  No puedes lanzar hechizos fuera de tu clase
  
RECURSOS:
  Maná: Regenera con descanso (Magos, Sacerdotes)
  Ira: Se genera en combate (Guerreros)
  Energía: Regenera rápido (Pícaros)
  Furia: Se acumula con daño (Druidas Feral)
  
COOLDOWNS:
  Habilidades poderosas tienen tiempo de recarga
  "Una vez por combate" o "Una vez por día"
```

### Clases y Escuelas

| Clase | Escuelas | Recurso |
|-------|----------|---------|
| **Mago** | Fuego, Escarcha, Arcano | Maná |
| **Brujo** | Fuego Vil, Sombra, Demonología | Maná + Fragmentos |
| **Sacerdote** | Luz, Sombra | Maná |
| **Paladín** | Luz, Protección | Maná + Poder Sagrado |
| **Chamán** | Elementos, Restauración | Maná + Totems |
| **Druida** | Naturaleza, Formas | Maná/Ira/Energía |

---

## Escenario A: Mago Fuego vs Elementales

### Contexto
Jaina Proudmoore enfrenta elementales de fuego invocados por un brujo.

### Setup

**Jaina (Mago Fuego/Escarcha - Sello Héroe)**
```
Voluntad: 5
Magia Arcana: +3
Maná: 20/20

Hechizos Fuego:
  - Bola de Fuego: Daño 5, Maná 2
  - Pirotecnia: Daño 8 (área), Maná 4, Cooldown 3 turnos
  - Combustión: +50% daño fuego 3 turnos, Maná 3, 1/combate

Hechizos Escarcha:
  - Descarga de Escarcha: Daño 4 + Ralentizar, Maná 2
  - Cono de Frío: Daño 4 (área cono), Maná 3
  - Bloque de Hielo: Inmune 1 turno, Maná 4, 1/combate
  
Hechizos Arcanos:
  - Misiles Arcanos: Daño 3×3, Maná 3
  - Traslación: Teletransporte corto, Maná 2
```

**Elemental de Fuego (x3)**
```
PA: 10 | Protección: 0
Resistencia: Inmune a Fuego
Debilidad: Vulnerable a Escarcha (+50% daño)
Ataque: d12 + 5, daño 4 (fuego)
```

### Simulación

**TURNO 1:**
```
Jaina: Cono de Frío (área, vs debilidad)
  d12(8) + 5 + 3 = 16 vs Defensa Pasiva 8
  Daño: 4 × 1.5 (vulnerable) = 6 cada uno
  → Elemental A: 10 - 6 = 4 PA
  → Elemental B: 10 - 6 = 4 PA
  → Elemental C: 10 - 6 = 4 PA
  Maná: 20 - 3 = 17

Elementales atacan:
  3 × (d12 + 5) vs Jaina d12 + 3
  → Probablemente 2 impactan
  → Jaina recibe ~8 daño
```

**TURNO 2:**
```
Jaina (herida): Otro Cono de Frío
  → 3 Elementales ELIMINADOS
  Maná: 17 - 3 = 14
  
Combate terminado: 2 turnos
```

### Análisis

- Conocer debilidades es crucial
- El Mago es efectivo contra enemigos correctos
- Gestión de Maná importa en combates largos

---

## Escenario B: Grupo de Mazmorra (5 jugadores)

### Contexto
Grupo clásico: Tanque, Curador, 3 DPS. Enfrentan un jefe de mazmorra.

### Setup del Grupo

**Tanque - Guerrero Protección**
```
PA: 18 | Protección: 5
Ira: 0/100 (genera con golpes recibidos)
Habilidades:
  - Devastar: Amenaza +100%, Ira 20
  - Muro de Escudo: +50% bloqueo, Ira 30
  - Último Recurso: Inmune 3 seg, 1/combate
```

**Curador - Sacerdote Luz**
```
PA: 8 | Maná: 30/30
Habilidades:
  - Curación: +6 PA, Maná 3
  - Renovar: +2 PA/turno durante 3 turnos, Maná 2
  - Espíritu Guardián: Previene muerte 1 vez, Maná 10, 1/combate
```

**DPS Melee - Pícaro**
```
PA: 10 | Energía: 100/100 (regenera 20/turno)
Habilidades:
  - Siniestro: Daño 4, Energía 40
  - Eviscerar: Daño 6 + Puntos Combo, Energía 35
  - Evasión: Esquiva 100% 1 turno, 1/combate
```

**DPS Caster - Brujo**
```
PA: 8 | Maná: 25/25 | Fragmentos: 0/3
Habilidades:
  - Descarga de Sombra: Daño 5, Maná 3, genera 1 Fragmento
  - Mano de Gul'dan: Daño 7 (área), Fragmentos 1
  - Invocación Infernal: Invoca aliado, Fragmentos 3, 1/combate
```

**DPS Ranged - Cazador**
```
PA: 10 | Munición: ∞ | Mascota: Lobo (PA 8, Daño 3)
Habilidades:
  - Disparo Firme: Daño 4
  - Disparo Múltiple: Daño 3 (3 objetivos)
  - Aspecto del Guepardo: +50% movimiento
```

### Setup del Jefe

**Señor de la Cripta (No-Muerto)**
```
PA: 60 | Protección: 3

Fases:
  FASE 1 (100-50% PA):
    - Golpe Terrible: Daño 8 al tanque
    - Llamada de la Tumba: Invoca 2 esqueletos
    
  FASE 2 (50-0% PA):
    - Aura de Muerte: Todos reciben 2 daño/turno
    - Furia del No-Muerto: +50% daño
    - Frenesí Final: 2 ataques/turno
```

### Mecánica: Roles de Grupo

```
TANQUE:
  - Mantiene "Amenaza" del jefe
  - Si otro hace más amenaza, el jefe cambia de objetivo
  
CURADOR:
  - Mantiene vivo al tanque
  - Triage si hay daño grupal
  
DPS:
  - Maximizar daño sin superar amenaza del tanque
  - Eliminar adds (enemigos adicionales)
```

### Simulación Fase 1

**TURNO 1:**
```
Guerrero: Devastar (establece amenaza)
  Ira: +20 (daño recibido previo)
  Amenaza: 100

Jefe: Golpe Terrible al Guerrero
  Daño: 8 - 5 = 3
  Guerrero: 18 - 3 = 15 PA
  Ira generada: +30

Sacerdote: Renovar al Guerrero
  Guerrero recuperará +2 PA/turno durante 3 turnos
  Maná: 30 - 2 = 28

Pícaro: Siniestro
  Daño: 4 - 3 = 1
  Jefe: 60 - 1 = 59 PA
  Amenaza: 50

Brujo: Descarga de Sombra
  Daño: 5 - 3 = 2
  Jefe: 59 - 2 = 57 PA
  Fragmento: +1
  
Cazador: Disparo Firme
  Daño: 4 - 3 = 1
  Jefe: 57 - 1 = 56 PA
```

**TURNO 2:**
```
Jefe: Llamada de la Tumba
  → 2 Esqueletos aparecen (PA 5 cada uno)
  
Decisión táctica:
  - ¿DPS elimina esqueletos primero?
  - ¿O siguen al jefe?
  
Cazador: Disparo Múltiple a esqueletos
  → Daño 3 a cada uno
  → Esqueletos: 5 - 3 = 2 PA cada uno
  
Pícaro: Cambia a esqueleto, Siniestro
  → Esqueleto A eliminado
```

### Análisis de Fase 2

```
Al llegar a 30 PA:
  - Jefe activa Aura de Muerte (2 daño/turno a todos)
  - El Sacerdote debe curar grupo, no solo tanque
  - El Maná se agota más rápido
  
Decisión:
  - ¿Quemar cooldowns para terminar rápido?
  - ¿O conservar para emergencias?
```

---

## Escenario C: Thrall vs Mannoroth (Épico)

### Contexto
Recreación de la escena cinemática. Combate épico 1v1.

### Setup

**Thrall (Chamán - Sello Leyenda)**
```
PA: 20 | Maná: 40/40
Voluntad: 5
Elementos: +4

Habilidades:
  - Rayo: Daño 6, Maná 3
  - Cadena de Rayos: Daño 4 (3 objetivos), Maná 5
  - Tormenta: Daño 8 (área), Maná 8, Cooldown 5 turnos
  - Lobo Espiritual: Forma de lobo (+50% velocidad)
  - Ancestros: Invoca espíritus, +3 a todas las tiradas 1 turno, 1/combate
```

**Mannoroth (Demonio Mayor)**
```
PA: 80 | Protección: 5

Habilidades:
  - Golpe Demoledor: Daño 12
  - Aliento Vil: Daño 8 (cono), corrupción
  - Grito de Mannoroth: Todos tiran Voluntad vs 15 o Aterrados
  - Sangre de Mannoroth: Si bebes, ganas poder pero te corrompes
  
Resistencias:
  - Inmune a fuego
  - Resistente a físico (-3 daño)
```

### Simulación

**TURNO 1:**
```
Thrall: Invoca Ancestros
  → +3 a todo durante este turno
  → Los espíritus de los chamanes aparecen

Mannoroth: Grito de Mannoroth
  Thrall: d12(9) + 5 + 3 = 17 vs 15 → RESISTE
  "¡No nos arrodillaremos!"
```

**TURNO 2:**
```
Thrall: Tormenta (todo el poder)
  d12(10) + 5 + 4 + 3 (Ancestros) = 22 vs Mannoroth defensa
  Daño: 8 + bonus = 12 - 5 = 7
  Mannoroth: 80 - 7 = 73 PA

Mannoroth: Aliento Vil
  Thrall: esquiva d12(7) + 4 = 11 vs d12(8) + 8 = 16
  → IMPACTA, daño 8
  → Thrall: 20 - 8 = 12 PA
```

**TURNO 3-5:** Intercambio de golpes...

**TURNO 6:**
```
Thrall (PA bajo, desesperado):
  Canaliza toda su energía en un último Rayo
  Gasta TODO el Maná restante
  
  "¡Por Azeroth!"
  d12(12) + 5 + 4 + bonus por Maná extra = 30+
  
Giro del Destino: Dados iguales (6-6)
  → El hacha de Grom (que Thrall porta) brilla
  → Daño multiplicado por 2
  
  Mannoroth: 0 PA → DERROTADO
```

---

## Tabla de Habilidades por Clase

### Mago

| Habilidad | Daño | Maná | Efecto |
|-----------|------|------|--------|
| Bola de Fuego | 5 | 2 | - |
| Pirotecnia | 8 (área) | 4 | CD 3 turnos |
| Descarga Escarcha | 4 | 2 | Ralentizar |
| Bloque de Hielo | - | 4 | Inmune 1 turno |

### Sacerdote

| Habilidad | Efecto | Maná | Notas |
|-----------|--------|------|-------|
| Curación | +6 PA | 3 | Objetivo |
| Renovar | +2 PA/turno | 2 | 3 turnos |
| Escudo de Luz | Absorbe 5 | 4 | - |
| Espíritu Guardián | Previene muerte | 10 | 1/combate |

### Chamán

| Habilidad | Daño/Efecto | Maná | Notas |
|-----------|-------------|------|-------|
| Rayo | 6 | 3 | - |
| Cadena de Rayos | 4×3 | 5 | 3 objetivos |
| Tormenta | 8 (área) | 8 | CD 5 turnos |
| Curación Telúrica | +8 PA | 5 | - |

---

## Registro de Pruebas

| Escenario | Turnos | Recursos usados | Notas |
|-----------|--------|-----------------|-------|
| A: Jaina vs Elementales | | | |
| B: Grupo Mazmorra | | | |
| C: Thrall vs Mannoroth | | | |

---

*El poder de la clase define tu rol. Pero el trabajo en equipo define la victoria.*
