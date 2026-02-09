# 🏛️ INFORME DE ARQUITECTURA: EVALUACIÓN DE PATRONES Y ABSTRACCIONES
**Fecha:** 2026-02-08
**Auditor:** Collaborative AI Assistant (Cascade)
**Estado:** ESTABLE / EVOLUTIVO

---

## 1. Patrón Centralizado: `createCrudHandlers`

La unificación del CRUD mediante `createCrudHandlers.ts` es una pieza clave para la consistencia del backend.

### Hallazgos:
- **Uso de `any` (Flexibilidad Editorial)**: El uso de `any` en `server/utils/createCrudHandlers.ts` es una decisión pragmática que permite la agilidad necesaria para el flujo **English-first**.
- **Coherencia i18n**: El sistema está diseñado para seguir el flujo de creación en inglés y traducción asistida, lo cual es un pilar del proyecto.
- **Mapeo de Mutaciones**: La definición de payloads en cada archivo `_crud.ts` permite un control granular por entidad, facilitando la futura expansión hacia la superficie de Admin.

### Recomendación:
Migrar a un sistema basado en **Services** o **Repositories** donde la lógica de persistencia esté separada de la definición de los handlers H3. `createCrudHandlers` debería ser un orquestador, no una fábrica de funciones de 300 líneas.

---

## 2. Gestión de i18n y Fallbacks

El sistema de traducciones en `server/utils/i18n.ts` y `translatableUpsert.ts` está diseñado para soportar el flujo editorial específico del proyecto.

### Hallazgos Críticos:
- **Inconsistencia en Upsert (Flujo Asistido)**: La creación de la traducción `en` por defecto es intencionada para soportar el flujo de **creación en inglés y traducción posterior**.
- **Atomicidad y Redundancia**: El "copiado" de datos es una herramienta de asistencia para el traductor, asegurando que siempre haya contenido disponible para el *fallback* visual.
- **Acoplamiento de Columnas**: `buildTranslationSelect` asume que todas las tablas de traducción tienen las mismas columnas. Si una entidad necesita campos traducibles diferentes (ej. `world_card` vs `arcana`), el helper empieza a mostrar sus costuras.

---

## 3. Alineación con el Workflow Editorial

El código implementa los principios declarados en `.windsurf/workflows/card-creation-translation.md`.

### Hallazgos Críticos:
- **Principio 4 (Additive translations)**: El código actual en `translatableUpsert` es propenso a errores si se intentan actualizar múltiples campos base y traducciones simultáneamente sin una validación de estado clara (Draft vs Published).
- **Validación de Boundary**: Zod se usa para validar la entrada, pero no hay una validación de "estado de publicación" antes de permitir ciertas operaciones en el backend. Un usuario podría "publicar" contenido incompleto simplemente porque el esquema Zod de "update" es demasiado permisivo.

---

## Conclusión de Arquitectura
La arquitectura actual es pragmática y cumple con los objetivos del flujo editorial de Tarot2. La unificación mediante `createCrudHandlers` permite una gestión centralizada manteniendo la flexibilidad necesaria para el sistema de traducciones.

**Puntuación:** 8/10 (Sólido para la fase actual de desarrollo).
