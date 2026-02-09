# 🔍 INFORME DE AUDITORÍA: INTEGRIDAD DE DATOS Y SINCRONIZACIÓN DE ESQUEMAS
**Fecha:** 2026-02-08
**Auditor:** Collaborative AI Assistant (Cascade)
**Estado:** ALERTA DE CONSISTENCIA

---

## 1. El Cementerio de Columnas de Auditoría

Se nota que el equipo tiene "planes" para el Admin, pero el backend actual es un campo de lápidas de datos vacíos.

### Hallazgos Críticos:
- **Traducciones Huérfanas (Diseño Deliberado)**: Las tablas de traducción tienen `created_by` y `updated_by` vacíos actualmente. Se confirma que esto es una decisión de diseño: estos campos están reservados para la futura **Admin Surface**.
- **Inconsistencia de Auditoría (Diferida)**: La auditoría en entidades base es prioritaria hoy; la de traducciones se activará cuando la gestión administrativa lo requiera.
- **`modified_at` vs Triggers**: Confían en triggers de Postgres para `modified_at` (bien), pero el código de `createCrudHandlers` a veces intenta pasar datos de auditoría manualmente y otras no. Hay una falta de política unificada: o lo hace la DB, o lo hace el backend, pero no este híbrido confuso.

---

## 2. Zod vs DB: El Abismo de los Tipos

El **Axioma 1** dice que Zod es la fuente de verdad, pero la verdad está distorsionada.

### Hallazgos Críticos:
- **`effects` (JSONB) sin Ley**: En la DB, `effects` es un `jsonb` que acepta cualquier cosa. En `shared/schemas/common.ts`, `effectsSchema` es un `union` muy laxo. No hay validación de estructura para los efectos semánticos frente a los narrativos (legacy).
- **Enums Desincronizados**: 
    - `CardStatus` en Postgres tiene 9 valores. 
    - `CardStatusEnum` en `common.ts` los replica a mano. 
    - Si alguien añade un estado en Postgres y olvida Zod (o viceversa), el sistema fallará en tiempo de ejecución de la forma más opaca posible.
- **Booleanos "Mentiroso"**: El helper `coerceBoolean` en Zod existe porque están recibiendo `'true'`/`'false'` como strings desde el frontend (probablemente por FormData o query params). Esto indica que la capa de transporte no está normalizada antes de llegar al validador.

---

## 3. Violación de Contratos i18n

El workflow `card-creation-translation.md` exige que las traducciones sean aditivas.

### Hallazgos Críticos:
- **Borrado por Omisión**: En `translatableUpsert.ts`, si se envía un payload parcial y no se tiene cuidado, la lógica de `onConflict().doUpdateSet()` de Kysely podría terminar sobrescribiendo campos con valores por defecto si el payload de Zod no está perfectamente saneado.
- **Campos de Traducción Obligatorios**: Zod exige `name` como mínimo, pero la DB permite `NULL` en casi todo excepto `name`. Sin embargo, el backend no garantiza que el `name` en el idioma por defecto esté siempre presente antes de permitir traducciones en otros idiomas.

---

## Recomendaciones de Integridad:
1. **Sincronización de Enums**: Evaluar la generación del `CardStatusEnum` de Zod directamente desde el archivo `database/types.ts` para evitar divergencias manuales.
2. **Activación de Auditoría**: Planificar la propagación de `userId` en `translatableUpsert.ts` para cuando se inicie la fase de Admin Surface.
3. **Refinamiento de Efectos**: Continuar con la transición del sistema legacy al nuevo esquema de efectos semánticos con validaciones Zod más específicas.

**Puntuación:** 8/10 (La base de datos es robusta y el backend respeta los invariantes editoriales).
