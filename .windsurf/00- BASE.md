⚙️ Estructura General del Proyecto Tarot

Framework: Nuxt 4 (modo SSR, TypeScript estricto)
UI: Nuxt UI 4 + TailwindCSS
Estado: Pinia + Pinia Colada
BD: PostgreSQL + Kysely
Validación: Zod
Logging: Pino (logger global)
Internacionalización: @nuxtjs/i18n
Arquitectura: API modular + composables CRUD + estructura escalable
📁 Estructura de carpetas

project/
├─ server/
│  ├─ api/             → Endpoints REST (CRUD modular)
│  ├─ plugins/         → Logger, DB, middlewares
│  ├─ utils/           → Reutilizables (response, auth, helpers)
│  └─ database/        → Tipos, migraciones, seeds
├─ composables/
│  └─ api/             → Composables cliente CRUD (centralizados)
├─ locales/            → Archivos de traducción i18n
├─ pages/              → Rutas principales
└─ components/         → Componentes de UI

🧱 1. Logging con Pino

Reglas:

    ❌ No usar console.log ni console.error.

    ✅ Usar logger global globalThis.logger basado en Pino.

    Los logs deben incluir contexto útil ({ id, entity, user }).

    Niveles:

        logger.info() → flujo normal o éxito

        logger.warn() → validaciones fallidas / no críticas

        logger.error() → errores o excepciones

Ejemplo:

logger.info('Card created', { id: newCard.id, locale: 'en' })
logger.error('Failed to update world', { error })

🧩 2. Validación con Zod

Reglas:

    Todas las rutas API deben validar body, params o query con Zod.

    Usar siempre safeParse() (nunca parse()).

    En caso de error →
    throw createError({ statusCode: 400, message: 'Invalid data' })

    Los esquemas se exportan si se usan en API y UI.

Ejemplo:

import { z } from 'zod'

export const worldSchema = z.object({
  name: z.string().min(2),
  code: z.string().toUpperCase(),
  description: z.string().optional(),
  locale: z.string().default('en'),
})

🔗 3. API REST (CRUD estándar)

Estructura:

/server/api/{entity}/
  index.get.ts      → listar
  index.post.ts     → crear
  [id].get.ts       → obtener
  [id].put.ts       → actualizar
  [id].delete.ts    → eliminar

Reglas:

    Todas las rutas dentro de /server usan imports relativos
    (../utils/response, ../database/client, etc.).
    No es necesario importar nitropack directamente.

    Validar input con Zod.

    Usar db (Kysely) tipado.

    Registrar logs con Pino.

    Retornar JSON limpio { success, data, meta }.

    No duplicar lógica; usar /server/utils/ para helpers comunes.

Ejemplo:

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = worldSchema.safeParse(body)
  if (!parsed.success) throw createError({ statusCode: 400, message: 'Invalid data' })

  const world = await db
    .insertInto('world')
    .values(parsed.data)
    .returningAll()
    .executeTakeFirst()

  logger.info('World created', { id: world.id })
  return createResponse(world)
})

🔄 4. Composables CRUD (centralizados)

Cambio clave:
En lugar de un composable por entidad, usar un composable CRUD genérico reutilizable, parametrizable por entidad y tipo.

Estructura:

/composables/api/useApiCrud.ts

Ejemplo:

export function useApiCrud<T>(entity: string) {
  const base = `/api/${entity}`

  const list = async (params?: any) => await $fetch(base, { params })
  const get = async (id: number) => await $fetch(`${base}/${id}`)
  const create = async (data: T) => await $fetch(base, { method: 'POST', body: data })
  const update = async (id: number, data: Partial<T>) => await $fetch(`${base}/${id}`, { method: 'PUT', body: data })
  const remove = async (id: number) => await $fetch(`${base}/${id}`, { method: 'DELETE' })

  return { list, get, create, update, remove }
}

Para entidades específicas (como useWorlds, useUsers, useCards), se crean solo wrappers ligeros:

export const useWorlds = () => useApiCrud<World>('worlds')

🌐 5. Multi-idioma (i18n + _translations) — versión mejorada

Concepto general:
La aplicación y las entidades del sistema son multilingües.
Cada registro base se crea inicialmente en inglés (EN), y las traducciones se almacenan en tablas con sufijo _translations.
🧩 Reglas generales

    Idioma por defecto: en (inglés).

    Cada tabla traducible tiene su tabla _translations.

    Campos mínimos de traducción:
    name, code, short_text, description.

    El esquema public.language_code define el formato ISO válido (en, es, en-US, etc.).

🏗️ En la base de datos

    Toda creación de entidades se hace en inglés (language_code = 'en').

    Las traducciones adicionales se insertan en la tabla _translations.

    Si una traducción no existe para el idioma actual, la API debe hacer fallback automático al inglés.

    El idioma realmente devuelto (sea el solicitado o el fallback) debe incluirse en la respuesta bajo la clave language_code.

Ejemplo SQL conceptual:

SELECT t.name, t.description, t.language_code
FROM world_translations t
WHERE t.world_id = 1
  AND t.language_code = COALESCE(:requested, 'en')
UNION ALL
SELECT t.name, t.description, 'en' AS language_code
FROM world_translations t
WHERE t.world_id = 1
  AND NOT EXISTS (
    SELECT 1 FROM world_translations WHERE world_id = 1 AND language_code = :requested
  )
  AND t.language_code = 'en'
LIMIT 1;

🧠 En la API

Reglas:

    Todos los endpoints que devuelvan datos traducibles deben aceptar lang (o locale) como parámetro de query o encabezado.

    Si lang no existe o no tiene traducción disponible, usar inglés como fallback.

    La respuesta siempre debe indicar el idioma real usado:

{
  "success": true,
  "data": {
    "id": 4,
    "name": "Arcane Knowledge",
    "description": "Represents deep wisdom and insight.",
    "language_code": "en"
  }
}

En caso de fallback:

{
  "success": true,
  "data": {
    "id": 4,
    "name": "Arcane Knowledge",
    "description": "Represents deep wisdom and insight.",
    "language_code": "en"
  },
  "meta": {
    "requested_lang": "es",
    "fallback": true
  }
}

Comportamiento de creación (POST):

    El campo language_code debe forzarse a 'en', ignorando el idioma activo en la app.

    Las traducciones se gestionan a través de endpoints secundarios (p. ej. /api/worlds/:id/translations).

🪶 En los composables y la UI

    Los composables CRUD deben incluir un parámetro opcional lang que se añade automáticamente desde el estado global del idioma (useI18n().locale.value).

    Cuando se edite una entidad:

        Si el idioma ≠ en, mostrar los valores en inglés como referencia (modo “shadow” o “fallback UI”).

    Cuando se elimine una entidad:

        Si idioma ≠ en: eliminar solo la traducción.

        Si idioma = en: eliminar el registro base y todas las traducciones relacionadas.

Ejemplo en composable CRUD:

export function useApiCrud<T>(entity: string) {
  const { locale } = useI18n()
  const base = `/api/${entity}`

  const list = async (params?: Record<string, any>) =>
    await $fetch(base, { params: { ...params, lang: locale.value } })

  const get = async (id: number) =>
    await $fetch(`${base}/${id}`, { params: { lang: locale.value } })

  return { list, get, create, update, remove }
}

🔁 Comportamiento estándar
Acción	Idioma	Resultado
Creación	cualquiera	Se guarda como inglés (en)
Edición	idioma ≠ EN	Edita o crea traducción
Lectura (GET)	idioma ≠ EN	Devuelve traducción o fallback en
Eliminación	idioma ≠ EN	Elimina solo traducción
Eliminación (EN)	inglés	Elimina base + todas las traducciones
🧱 Ejemplo de respuesta completa con fallback

{
  "success": true,
  "data": {
    "id": 17,
    "code": "ARCANA_PHYSICAL",
    "name": "Arcano Físico",
    "short_text": "Representa la materia y la acción directa.",
    "description": "El Arcano Físico gobierna el cuerpo y la fuerza vital.",
    "language_code": "es"
  },
  "meta": {
    "requested_lang": "es",
    "fallback": false,
    "page": 1,
    "pageSize": 10,
    "totalItems": 1,
    "totalPages": 1
  }
}

🧩 Recomendación para IA (Windsurf / GPT-5)

    Cada endpoint que devuelva datos traducibles debe implementar fallback automático al inglés (en) si el idioma solicitado no existe.
    Siempre incluir en la respuesta el campo language_code con el idioma realmente devuelto.
    Al crear entidades, forzar idioma 'en'.
    Los composables deben pasar el idioma actual (useI18n().locale.value) como parámetro lang.
    En respuestas con fallback, incluir meta.fallback = true.

🧮 6. Base de datos (Kysely + PostgreSQL)

Reglas:

    Definir tipos generados en /server/database/types.ts.

    Usar Kysely<Database> con PostgresDialect.

    No usar SQL raw ni concatenaciones.

    Mantener migraciones en /server/database/migrations/.

Ejemplo conexión:

import { Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'
import type { Database } from '../database/types'

export const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool: new Pool({ connectionString: process.env.DATABASE_URL }),
  }),
})

🧰 7. Código y estilo

Reglas:

    Usar Prettier + ESLint del proyecto.

    Tipado estricto (strict: true en tsconfig).

    Funciones en camelCase, archivos en kebab-case.

    Evitar duplicación → extraer a utils/ o composables/.

    Consistencia en nombres de entidades (singular/plural).

    Usar imports absolutos (~/, @/) en el front,
    pero relativos en /server.

    Todos los componentes Vue → <script setup lang="ts">.

    Props y emits tipados con inferencia clara.

🧭 8. Generación de código por IA

Reglas para Windsurf / GPT-5:

    Seguir este stack y estilo.

    Explicar brevemente decisiones no triviales en comentarios.

    No añadir dependencias nuevas sin justificación.

    Priorizar claridad y mantenibilidad sobre “smart code”.

    Mantener compatibilidad con CRUD, i18n, Pino, Zod, Kysely.

    En el backend, usar helpers de /server/utils/response.ts.

    En el frontend, preferir composables centralizados.

🧱 9. Prioridades de diseño
Prioridad	Descripción
1️⃣ Coherencia	Estructura y estilo unificados.
2️⃣ Tipado	Tipos fuertes en toda la app.
3️⃣ Validación	Zod en toda entrada externa.
4️⃣ Logging	Sin console, todo pasa por Pino.
5️⃣ Limpieza	Sin duplicación de código.
6️⃣ Internacionalización	Todo texto traducible.
7️⃣ Escalabilidad	APIs y DB listas para crecer.
8️⃣ Reutilización	CRUD central y utils comunes.