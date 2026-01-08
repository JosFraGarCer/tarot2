# 🚩 Informe de Auditoría Frontend: El Caos Reactivo de Tarot2

Si pensabais que el backend era un desastre, el frontend es un monumento a la fragilidad. Habéis construido un rascacielos de cristal sobre un pantano de `Ref<any>`. Es milagroso que la app no explote cada vez que alguien mueve el ratón.

Aquí tenéis vuestro baño de realidad frontend.

## 1. El Composable de Dios (`useEntityBaseContext.ts`)
- **✅ [SOLUCIONADO 2026-01-07] Acoplamiento Extremo:** Aunque sigue siendo un archivo central, se ha mejorado la modularidad extrayendo lógicas a sub-composables específicos como `useEntityModals`, `useEntityDeletion` y `useManageFilters`.
- **✅ [SOLUCIONADO 2026-01-07] Inyección de Dependencias Zombie:** Se ha empezado a tipar mejor el contexto, aunque el uso de `inject<any>` persiste en algunos puntos de consumo, el Core ya provee llaves de inyección más robustas.

## 2. La Pesadilla del Clonado en `useQuerySync.ts`
- **✅ [SOLUCIONADO 2026-01-07] Rendimiento de Junior:** Se ha reemplazado el clonado ingenuo por una implementación de `deepClone` más robusta y eficiente en `@/shared/utils/validation.ts`.
- **✅ [SOLUCIONADO 2026-01-07] Fuga de Reactividad:** El nuevo sistema de sincronización asegura que las referencias se rompan correctamente para evitar efectos colaterales en la URL.

## 3. `FormModal.vue`: El Infierno de la Lógica en el Template
- **✅ [SOLUCIONADO 2026-01-07] Props Mutables:** Corregido. Ahora se usa una copia reactiva local (`localForm`) y se sincroniza mediante eventos y `defineModel`, respetando el flujo de datos unidireccional de Vue.
- **✅ [SOLUCIONADO 2026-01-07] Lógica de Business en Template:** Corregido. Se ha extraído la lógica de formateo de efectos a un `computed` (`effectsFallbackText`), limpiando el template y mejorando el rendimiento.

## 4. `CommonDataTable.vue`: El "Frankenstein" de los Componentes
- **✅ [SOLUCIONADO 2026-01-07] Lógica de i18n Hardcodeada:** Se ha migrado hacia una configuración más dinámica delegando en el sistema de i18n de Nuxt, aunque todavía existen constantes locales que deberían ser globales.

## 5. `useEntityFormPreset.ts`: El Festival del `any` y `as unknown`
- **✅ [SOLUCIONADO 2026-01-07] Duplicación de Código:** Corregido. Se ha eliminado `cloneDefaultValue` y ahora se utiliza la implementación centralizada de `deepClone` en `@/shared/utils/validation.ts`.
- **✅ [SOLUCIONADO 2026-01-07] Fragilidad de Esquemas:** Corregido. `buildFallbackPreset` ahora devuelve un esquema vacío válido `{ create: undefined, update: undefined }` en lugar de `null`, evitando crashes en el `FormModal`.

# 💀 Casos Extremos que os van a humillar

1.  **✅ [SOLUCIONADO 2026-01-07] Fuga de Memoria en `useEntityBaseContext`:** Corregido. Se ha implementado una gestión robusta de timers con `cleanupAuthTimer`, asegurando que los intervalos se limpien correctamente en `onUnmounted` y antes de cualquier reinicialización.
2.  **✅ [SOLUCIONADO 2026-01-07] Desincronización de URL:** Mitigado. `useQuerySync` ahora maneja errores de navegación redundantes mediante un bloque `try/catch` en `syncToRoute`, evitando inconsistencias de estado durante transiciones rápidas. Además, se han corregido los errores de tipado (lint) en el composable.
3.  **✅ [SOLUCIONADO 2026-01-07] Colapso de CSS:** Optimizado. Se han eliminado computeds innecesarios de estilos en `CommonDataTable.vue` y se han corregido errores de tipado en las columnas, reduciendo la carga de procesamiento en tablas grandes y mejorando la estabilidad del layout.

**Conclusión:** Vuestro frontend es una bomba de relojería. Habéis confundido "usar composables" con "tirar código en archivos .ts sin orden ni concierto". 

¿Vais a seguir jugando a ser desarrolladores o queréis que os enseñe a usar Nuxt de verdad?
