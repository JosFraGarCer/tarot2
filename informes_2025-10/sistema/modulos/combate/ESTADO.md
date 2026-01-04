# ⚔️ Módulo de Combate: Estado

> **Estado global:** 🔄 EN PRUEBAS
> **Versión:** 0.3.0
> **Responsable:** [Asignar]

---

## Dashboard del Módulo

### Componentes

| Componente | Estado | Notas |
|------------|--------|-------|
| Iniciativa | 🔄 Probando | Heroica vs Tirada |
| Ataque/Defensa | 🔄 Probando | Tirada vs Pasiva |
| Daño | ✅ Estable | Arma + Margen - Protección |
| Heridas | ✅ Estable | -1/-2/-3 por estado |
| Acciones | ✅ Estable | 1 acción + 1 movimiento |
| Talentos | 🔄 Probando | 3/2/1 vs flat |

### Propuestas Activas

| ID | Propuesta | Estado | Prioridad |
|----|-----------|--------|-----------|
| COM-01 | Defensa Pasiva | 🔄 Testeando | Alta |
| COM-02 | Iniciativa Heroica | 🔄 Testeando | Alta |
| COM-03 | Talentos 3/2/1 | 🔄 Testeando | Media |
| COM-04 | Daño Escalado | 📋 Propuesta | Media |
| COM-05 | Golpe de Gracia | ✅ Confirmado | - |

---

## Pruebas Pendientes

### Alta Prioridad

| Situación | Propuestas a Probar | Ejecutado |
|-----------|---------------------|-----------|
| SETUP-COMBATE-DUELO Esc.A | COM-01, COM-03 | ☐ |
| SETUP-COMBATE-DUELO Esc.C | COM-01 (desnivel) | ☐ |
| SETUP-COMBATE-GRUPO Esc.A | COM-01, COM-02 | ☐ |
| SETUP-COMBATE-HORDA Esc.A | COM-01 | ☐ |

### Media Prioridad

| Situación | Propuestas a Probar | Ejecutado |
|-----------|---------------------|-----------|
| SETUP-COMBATE-JEFE Esc.A | COM-02, acciones jefe | ☐ |
| SETUP-COMBATE-DUELO Esc.D | Balance ranged | ☐ |

---

## Métricas Objetivo

| Métrica | Objetivo | Actual | Fuente |
|---------|----------|--------|--------|
| Turnos por combate | 5-10 | ~12-15 | Estimado |
| Tiradas por turno | ≤3 | ~4-5 | Estimado |
| Letalidad | Baja-Media | Media | Diseño |
| Decisiones/turno | ≥2 | ? | Pendiente test |

---

## Dependencias

| Este módulo depende de... | Estado |
|---------------------------|--------|
| Core: Dados 2d12 | ✅ Estable |
| Core: Facetas | ✅ Estable |
| Core: Competencias | ✅ Estable |

| Dependen de este módulo... | Estado |
|----------------------------|--------|
| Módulo: Magia (combate) | 🔄 En pruebas |
| Contenido: Bestiario | 📋 Propuesta |
| Contenido: Armas | ✅ Estable |

---

## Historial de Pruebas

| Fecha | Prueba | Resultado | Notas |
|-------|--------|-----------|-------|
| - | - | - | Sin pruebas formales aún |

---

## Próximos Pasos

1. [ ] Ejecutar SETUP-COMBATE-DUELO con reglas base
2. [ ] Ejecutar SETUP-COMBATE-DUELO con Defensa Pasiva ON
3. [ ] Comparar métricas
4. [ ] Ajustar umbrales si necesario
5. [ ] Repetir con GRUPO y HORDA

---

*Actualizar este archivo después de cada sesión de pruebas.*
