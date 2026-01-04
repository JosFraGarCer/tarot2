# ⚡ Setup: Magia - Warcraft

> **Propósito:** Testear sistema de magia profesional con clases y recursos
> **Estilo:** Definida por clase, recursos específicos, roles claros

---

## Sistema de Clases

### Recursos por Clase

| Clase | Recurso | Regeneración |
|-------|---------|--------------|
| Mago | Maná 20-30 | Descanso |
| Brujo | Maná + Fragmentos | Maná: descanso / Fragmentos: en combate |
| Sacerdote | Maná 25-30 | Descanso |
| Paladín | Maná + Poder Sagrado | Maná: descanso / PS: en combate |
| Chamán | Maná 30 | Descanso |
| Druida | Variable | Según forma |

---

## Escenario A: Mago vs Elementales

### Mago

| Stat | Valor |
|------|-------|
| **Nombre** | |
| **Especialización** | Fuego / Escarcha / Arcano |
| **Voluntad** | 5 |
| **Magia** | +3 |
| **Maná** | /20 |
| **PA** | 8 |
| **Protección** | 0 |

### Habilidades Fuego

| Habilidad | Daño | Maná | Notas |
|-----------|------|------|-------|
| Bola de Fuego | 5 | 2 | - |
| Pirotecnia | 8 (área) | 4 | CD 3 turnos |
| Combustión | +50% fuego | 3 | 1/combate |

### Habilidades Escarcha

| Habilidad | Daño | Maná | Notas |
|-----------|------|------|-------|
| Descarga Escarcha | 4 | 2 | Ralentiza |
| Cono de Frío | 4 (cono) | 3 | - |
| Bloque de Hielo | Inmune | 4 | 1/combate |

### Elementales (×3)

| Stat | Valor |
|------|-------|
| **Tipo** | Fuego / Agua / Tierra |
| **PA** | 10 |
| **Resistencia** | Inmune a su elemento |
| **Debilidad** | Vulnerable a opuesto (+50%) |
| **Ataque** | d12 + 5 |
| **Daño** | 4 |

### Pregunta Clave
¿El mago debe cambiar de escuela según enemigo?

---

## Escenario B: Grupo de Mazmorra (5 jugadores)

### Composición Clásica

#### Tanque: Guerrero Protección

| Stat | Valor |
|------|-------|
| **PA** | 18 |
| **Protección** | 5 |
| **Ira** | 0/100 |
| **Rol** | Mantener amenaza |

| Habilidad | Efecto | Coste |
|-----------|--------|-------|
| Devastar | +100% amenaza | 20 Ira |
| Muro de Escudo | +50% bloqueo | 30 Ira |
| Último Recurso | Inmune 1 turno | 1/combate |

#### Curador: Sacerdote

| Stat | Valor |
|------|-------|
| **PA** | 8 |
| **Maná** | /30 |
| **Rol** | Mantener vivo al grupo |

| Habilidad | Efecto | Coste |
|-----------|--------|-------|
| Curación | +6 PA | 3 Maná |
| Renovar | +2 PA/turno, 3t | 2 Maná |
| Espíritu Guardián | Previene muerte | 10 Maná, 1/combate |

#### DPS Melee: Pícaro

| Stat | Valor |
|------|-------|
| **PA** | 10 |
| **Energía** | 100/100 |
| **Regenera** | 20/turno |

| Habilidad | Daño | Coste |
|-----------|------|-------|
| Siniestro | 4 | 40 Energía |
| Eviscerar | 6 + combo | 35 Energía |
| Evasión | Esquiva 100% | 1/combate |

#### DPS Caster: Brujo

| Stat | Valor |
|------|-------|
| **PA** | 8 |
| **Maná** | /25 |
| **Fragmentos** | 0/3 |

| Habilidad | Daño | Coste |
|-----------|------|-------|
| Descarga Sombra | 5 | 3 Maná, +1 Frag |
| Mano de Gul'dan | 7 (área) | 1 Fragmento |
| Invocar Infernal | Aliado | 3 Fragmentos |

#### DPS Ranged: Cazador

| Stat | Valor |
|------|-------|
| **PA** | 10 |
| **Mascota** | Lobo (PA 8, Daño 3) |

| Habilidad | Daño | Notas |
|-----------|------|-------|
| Disparo Firme | 4 | - |
| Disparo Múltiple | 3×3 | 3 objetivos |
| Aspecto Guepardo | +50% mov | - |

### Jefe de Mazmorra

| Stat | Valor |
|------|-------|
| **Nombre** | |
| **PA** | 60 |
| **Protección** | 3 |
| **Fases** | 2 (100-50%, 50-0%) |

#### Fase 1

| Habilidad | Efecto |
|-----------|--------|
| Golpe Terrible | 8 daño al tanque |
| Invocar Adds | 2 enemigos menores |

#### Fase 2 (50% PA)

| Habilidad | Efecto |
|-----------|--------|
| Aura de Muerte | 2 daño/turno a todos |
| Frenesí | +50% daño |

---

## Escenario C: Chamán Épico

### Chamán

| Stat | Valor |
|------|-------|
| **Nombre** | |
| **Voluntad** | 5 |
| **Elementos** | +4 |
| **Maná** | /40 |
| **PA** | 20 |

### Habilidades

| Habilidad | Daño/Efecto | Coste |
|-----------|-------------|-------|
| Rayo | 6 | 3 Maná |
| Cadena Rayos | 4×3 | 5 Maná |
| Tormenta | 8 (área) | 8 Maná, CD 5t |
| Ancestros | +3 a todo, 1t | 1/combate |

### Enemigo Épico

| Stat | Valor |
|------|-------|
| **PA** | 80 |
| **Protección** | 5 |
| **Resistencias** | Inmune fuego |
| **Ataques** | 2/turno |
| **Daño** | 8-12 |

---

## Mecánica: Amenaza

```
TANQUE:
  Cada punto de daño genera 1 amenaza
  Habilidades de tanque: ×2 o ×3 amenaza
  
DPS:
  Cada punto de daño genera 1 amenaza
  Si supera al tanque: Jefe cambia objetivo
  
CURADOR:
  Cada punto curado genera 0.5 amenaza
  Debe evitar aggro
```

---

## Variables a Probar

| Variable | Pregunta |
|----------|----------|
| Recursos | ¿Maná 20-30 es suficiente para un combate? |
| Amenaza | ¿El tanque puede mantener aggro? |
| Curación | ¿El sacerdote puede mantener vivo al grupo? |
| DPS race | ¿El grupo puede matar antes de quedarse sin recursos? |

---

## Métricas Específicas

| Métrica | Objetivo |
|---------|----------|
| Combate de mazmorra | 5-8 turnos |
| Recursos al final | 20-40% |
| Muertes | 0-1 con buena coordinación |
| Tanque aggro | 90%+ del tiempo |

---

*El poder de la clase define tu rol. El trabajo en equipo define la victoria.*
