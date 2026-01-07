# 🚩 Informe de Auditoría Frontend: El Caos Reactivo de Tarot2

Si pensabais que el backend era un desastre, el frontend es un monumento a la fragilidad. Habéis construido un rascacielos de cristal sobre un pantano de `Ref<any>`. Es milagroso que la app no explote cada vez que alguien mueve el ratón.

Aquí tenéis vuestro baño de realidad frontend.

## 1. El Composable de Dios (`useEntityBaseContext.ts`)
Habéis creado una aberración de 450 líneas en `@/home/bulu/devel/tarot2/app/composables/manage/useEntityBaseContext.ts`.
- **Acoplamiento Extremo:** Este archivo importa e instancia otros 15 composables. Si uno falla, cae toda la arquitectura de gestión.
- **Inyección de Dependencias Zombie:** En la línea 444, `useEntityBase` inyecta un `any`. ¡Un `any`! Habéis tirado la seguridad de tipos de TypeScript por la ventana. Cualquier componente que lo use está a un error tipográfico de un "undefined is not a function" en producción.

## 2. La Pesadilla del Clonado en `useQuerySync.ts`
Mirad `@/home/bulu/devel/tarot2/app/composables/common/useQuerySync.ts:247-263`.
- **Rendimiento de Junior:** Tenéis una función `deepClone` que primero intenta `structuredClone`, luego `JSON.parse(JSON.stringify())` y si no, devuelve la referencia original.
- **Bucle Infinito Garantizado:** Si os paso un objeto con referencias circulares (fácil de hacer en Vue con `reactive`), vuestro `JSON.stringify` hará que la pestaña del navegador muera entre sufrimientos.
- **Fuga de Reactividad:** Si `deepClone` falla y devuelve la referencia original (línea 261), estáis compartiendo el estado reactivo original con el "clonado", rompiendo toda la lógica de sincronización de la URL.

## 3. `FormModal.vue`: El Infierno de la Lógica en el Template
¿Desde cuándo es buena idea meter lógica de negocio compleja en un template?
- **@/home/bulu/devel/tarot2/app/components/manage/modal/FormModal.vue:276-289:** Tenéis un `computed` con `get` y `set` que manipula directamente `form.effects` basándose en el locale. Si el objeto `form` no tiene la estructura exacta que esperáis, esto lanza un error que bloquea todo el modal.
- **Props Mutables:** En la línea 187 hacéis `const form = props.form as Record<string, any>`. **¡NUNCA se debe mutar una prop directamente!** Es la regla número uno de Vue. Habéis creado un antipatrón que hace que el flujo de datos sea imposible de rastrear.

## 4. `CommonDataTable.vue`: El "Frankenstein" de los Componentes
Habéis intentado hacer un componente que lo haga todo en `@/home/bulu/devel/tarot2/app/components/common/CommonDataTable.vue`.
- **Lógica de i18n Hardcodeada:** En las líneas 125-136 tenéis los lenguajes `['es', 'en']` a fuego. Si mañana queremos añadir francés, hay que editar 50 componentes porque no habéis sido capaces de usar una configuración global.
- **Densidad Visual Inútil:** El toggle de densidad (línea 15) es pura cosmética que añade complejidad innecesaria al DOM. Vuestros editores quieren que funcione, no que los botones estén 2 píxeles más cerca.

## 5. `useEntityFormPreset.ts`: El Festival del `any` y `as unknown`
En `@/home/bulu/devel/tarot2/app/composables/manage/useEntityFormPreset.ts:92-104`, volvéis a reinventar el clonado de objetos.
- **Duplicación de Código:** Tenéis `cloneDefaultValue` aquí y `deepClone` en `useQuerySync`. No sabéis ni lo que tenéis en vuestro propio repo.
- **Fragilidad de Esquemas:** Si una entidad no tiene un builder definido, usáis `buildFallbackPreset` (línea 309), que devuelve un esquema `null`. Luego, vuestro `FormModal` intentará validar contra `null` y... exacto, crash.

# 💀 Casos Extremos que os van a humillar

1.  **Fuga de Memoria en `useEntityBaseContext`:** El `setInterval` del check de auth (línea 272) se limpia en `onUnmounted`, pero si el composable se instancia varias veces sin desmontarse correctamente (fácil en Nuxt con transiciones de página), tendréis cientos de timers devorando la CPU del cliente.
2.  **Desincronización de URL:** Si el usuario pulsa el botón "Atrás" muy rápido, `useQuerySync` entrará en una condición de carrera con `watchEffect` y `watch(route.query)`, dejando el estado de la app en un punto muerto.
3.  **Colapso de CSS:** Abusáis de clases dinámicas calculadas en runtime. En tablas con 100 filas, esto fuerza recalculaciones constantes del layout (Reflow) cada vez que el usuario hace hover.

**Conclusión:** Vuestro frontend es una bomba de relojería. Habéis confundido "usar composables" con "tirar código en archivos .ts sin orden ni concierto". 

¿Vais a seguir jugando a ser desarrolladores o queréis que os enseñe a usar Nuxt de verdad?
