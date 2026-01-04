# 🧪 Protocolo de Pruebas del Sistema

> **Objetivo:** Validar reglas mediante pruebas sistemáticas y reproducibles

---

## Cómo Usar Este Laboratorio

### 1. Elegir Plantilla

Selecciona una plantilla de `SETUP-*.md` según lo que quieras probar:
- **Combate:** Duelos, grupos, hordas, jefes
- **Habilidades:** Sociales, exploración, conocimiento
- **Magia:** Por ambientación (WoT, HP, Warcraft, Divina)

### 2. Definir Reglas a Probar

Antes de cada prueba, marca qué reglas están activas:

```markdown
## Reglas Activas en Esta Prueba
- [x] Sistema base 2d12 "Giro Tarot"
- [x] Defensa Pasiva (si diferencia ≥3 niveles)
- [ ] Iniciativa Heroica (PJs primero)
- [x] Talentos 3/2/1
- [ ] Daño Escalado por margen
- [x] Heridas Acumulativas (-1/-2/-3)
- [ ] Golpe de Gracia (0 PA = muerte/KO)
```

### 3. Crear Archivo de Prueba

Copia la plantilla `REGISTRO-PRUEBA-TEMPLATE.md` y renómbrala:

```
PRUEBA-[FECHA]-[SETUP]-[VARIANTE].md
Ejemplo: PRUEBA-2024-12-04-DUELO-01-DefensaPasiva.md
```

### 4. Ejecutar la Prueba

Simula la situación paso a paso:
1. Resuelve cada turno según las reglas activas
2. Anota TODAS las tiradas (aunque uses simulador)
3. Registra el tiempo real si es posible
4. Anota sensaciones y problemas

### 5. Analizar Resultados

Completa la sección de métricas y compara con objetivos:

| Métrica | Objetivo | Aceptable | Problema |
|---------|----------|-----------|----------|
| Turnos totales | 5-10 | 4-12 | <4 o >12 |
| Tiradas/turno | ≤3 | ≤4 | >5 |
| Tiempo real | 15-30 min | 10-45 min | >60 min |
| Decisiones/turno | ≥2 | ≥1 | 0 |

---

## Estructura de Carpetas

```
plantillas/
├── 00-PROTOCOLO-PRUEBAS.md      # Este archivo
├── REGISTRO-PRUEBA-TEMPLATE.md   # Plantilla vacía para copiar
│
├── SETUP-COMBATE-DUELO.md        # Setup: 1v1
├── SETUP-COMBATE-GRUPO.md        # Setup: Grupo vs Grupo
├── SETUP-COMBATE-HORDA.md        # Setup: vs Muchos
├── SETUP-COMBATE-JEFE.md         # Setup: vs Boss
│
├── SETUP-HABILIDAD-SOCIAL.md     # Setup: Negociación, etc.
├── SETUP-HABILIDAD-EXPLORACION.md
│
├── SETUP-MAGIA-WOT.md            # Setup: Canalización
├── SETUP-MAGIA-HP.md             # Setup: Varitas
├── SETUP-MAGIA-WARCRAFT.md       # Setup: Clases
├── SETUP-MAGIA-DIVINA.md         # Setup: Potencias
│
├── SETUP-MIXTA-EMBOSCADA.md      # Setup: Transiciones
│
└── pruebas/                      # Resultados de pruebas ejecutadas
    ├── PRUEBA-2024-12-04-DUELO-01.md
    └── ...
```

---

## Checklist Pre-Prueba

- [ ] Setup leído y entendido
- [ ] Reglas activas marcadas
- [ ] Personajes con stats completos
- [ ] Método de tirada definido (dados físicos / simulador)
- [ ] Plantilla de registro preparada

## Checklist Post-Prueba

- [ ] Todas las tiradas registradas
- [ ] Métricas calculadas
- [ ] Problemas identificados
- [ ] Sensación de juego anotada
- [ ] Archivo guardado en `/pruebas/`

---

## Reglas Disponibles para Probar

### Core
| Código | Regla | Descripción |
|--------|-------|-------------|
| R-CORE-01 | 2d12 Giro Tarot | Sistema base de dados |
| R-CORE-02 | Facetas 1-5 | Atributos principales |
| R-CORE-03 | Competencias +0 a +3 | Habilidades entrenadas |

### Combate
| Código | Regla | Descripción |
|--------|-------|-------------|
| R-COM-01 | Defensa Pasiva | No tirar si diferencia ≥3 |
| R-COM-02 | Iniciativa Heroica | PJs primero por defecto |
| R-COM-03 | Talentos 3/2/1 | Bonus por especialización |
| R-COM-04 | Daño Escalado | +1 daño por cada 3 de margen |
| R-COM-05 | Heridas Acumulativas | -1/-2/-3 según PA |
| R-COM-06 | Golpe de Gracia | 0 PA = muerte o KO |

### Magia
| Código | Regla | Descripción |
|--------|-------|-------------|
| R-MAG-01 | Devoción 0-5 | Recurso de fe |
| R-MAG-02 | Fatiga WoT | Acumulación por canalizar |
| R-MAG-03 | Maná Warcraft | Recurso regenerable |
| R-MAG-04 | Hechizos Aprendidos HP | Solo lo que sabes |

---

*Prueba, registra, analiza, mejora.*
