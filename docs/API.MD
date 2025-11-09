# API tarot2

Esta guía documenta exhaustivamente los endpoints bajo `/server/api` y los utilitarios y helpers que usa la API. Cubre autenticación, formato de respuestas, paginación, ordenación, filtros, errores y cada recurso (CRUD completo, parámetros y retorno).

## Convenciones generales

- **Base URL**: `/api`
- **Autenticación**: Casi todos los endpoints requieren usuario autenticado vía cookie `auth_token` (JWT). Solo son públicos:
  - `POST /api/auth/login`
  - `POST /api/auth/logout`
- **Idiomas (traducciones)**:
  - Muchos recursos tienen tabla de traducciones y aceptan `lang` (o `language`/`locale`), por defecto `en`.
  - Los GET resuelven los campos traducibles con `coalesce(traducción solicitada, traducción EN)`, devolviendo además `language_code_resolved`.
  - En `DELETE` de recursos traducibles: si `lang !== 'en'` borra solo la traducción del idioma indicado; si `lang === 'en'` borra toda la entidad y sus traducciones.
- **Paginación** (listados):
  - `page` (>=1, por defecto 1), `pageSize` (1..100, por defecto 20)
  - Respuesta con `meta` incluye: `page, pageSize, totalItems, totalPages, count, search`
- **Búsqueda y ordenación**:
  - Búsqueda: `q` y/o `search` (según endpoint) sobre columnas traducibles y códigos.
  - Ordenación: `sort` y `direction` (`asc|desc`) con campos permitidos por endpoint (whitelist). Si se pasa un `sort` no permitido, retorna 400.
- **Filtros comunes**: `status`, `is_active`, `created_by`, FKs relacionados (p. ej. `card_type_id`, `facet_id`, `arcana_id`, `world_id`).
- **Tags**:
  - Varios listados admiten filtros `tags` (nombres, string o array o CSV/JSON), y `tag_ids` (ids numéricos).
  - Semántica: OR entre las etiquetas proporcionadas.
  - Filtros por FKs (multi-valor): `card_type_id`, `arcana_id`, `facet_id` aceptan valores múltiples (CSV/JSON) y se aplican con semántica OR.
- **Formato de respuesta**:
  - Éxito: `{ success: true, data, meta? }`
  - Error (validador/zod/h3): HTTP `statusCode` con `statusMessage`. Algunos helpers también exponen `{ success: false, error: { message, statusCode } }`.
- **Errores estándar** (helpers): 400 `badRequest`, 401 `unauthorized`, 403 `forbidden`, 404 `notFound`, 409 `conflict`, 422 `unprocessable`, 500 `serverError`.

## Autenticación y seguridad

- `POST /api/auth/login`
  - Body: `{ identifier: string (email o username), password: string (>=6) }`
  - Busca usuario activo y compara contraseña. Genera JWT con `JWT_SECRET` y expiración `JWT_EXPIRES_IN` (por defecto `1d`).
  - Setea cookie `auth_token` (HttpOnly, `SameSite=strict`, `secure` en producción). Devuelve `{ token, user { id, username, email, image, status, created_at, modified_at, roles[], permissions{} } }`.
- `POST /api/auth/logout`
  - Limpia cookie `auth_token`. Respuesta `{ success: true, message }`.
- Middleware:
  - `00.auth.hydrate`: Si hay cookie `auth_token`, hidrata `event.context.user` con usuario, roles y `permissions` (merge de roles).
  - `01.auth.guard`: Protege todos los `/api/*` excepto login/logout. Requiere `event.context.user`. Niega usuarios `suspended`. Deja pasar admin o `canManageUsers`. Aplica ejemplo granular para `/api/role`.

## Configuración y plugins

- DB: Postgres vía `kysely`. `DATABASE_URL` requerido. Conexión en `server/plugins/db.ts` expone `globalThis.db`.
- Logger: `pino` expone `globalThis.logger`.
- JWT: `server/plugins/auth.ts` con helpers de `hashPassword`, `verifyPassword`, `createToken`, `verifyToken`, `getUserFromEvent`.

## Utilidades de respuesta/validación/filtros/i18n

- `server/utils/response.ts`:
  - `createResponse(data, meta?)`, `createPaginatedResponse(data, totalItems, page, pageSize, search?)`
- `server/utils/validate.ts`:
  - `safeParseOrThrow(zodSchema, input)` lanza 400 con detalles de validación.
- `server/utils/filters.ts`:
  - `buildFilters(qb, { page, pageSize, search, status, statusColumn, applySearch, searchColumns, countDistinct, sort, defaultSort, sortColumnMap })`
  - Aplica filtros, conteo total, ordenación segura (whitelist), `offset/limit`.
- `server/utils/i18n.ts`:
  - `getRequestedLanguage(query)` (acepta `lang|language|locale`) y utilidades de fallback.
- `server/utils/zod.ts`:
  - `queryBoolean` para parsear booleanos en query (`true|1|yes|on|t` etc.).
- `server/utils/entityCrudHelpers.ts`:
  - `exportEntities({ event, table, idField?, translationsTable?, translationForeignKey?, translationFields?, languageKey?, where?, extraJoins?, userId? })` → `{ success:true, data: { [table]: [...] } }` con `translations` por idioma si hay tabla de traducciones.
  - `importEntities({ ... })`: Body debe ser `{ [table]: [ { ...base, translations?: { [lang]: { name, short_text, description, ... } } } ] }`. Intenta upsert por `id` o `code`. Devuelve `{ created, updated, errors[] }`.
  - `batchUpdateEntities({ ... })`: Body `{ ids: number[], ...patch }`. Devuelve `{ updated }`.

---

# Endpoints por recurso

A continuación se documentan todos los recursos bajo `/api`. Para cada uno se indican parámetros, comportamiento y retorno. A menos que se especifique lo contrario, requieren autenticación.

## Users

- `GET /api/user`
  - Query: `page, pageSize, q|search, status, is_active (boolean), role_id, sort (username|email|created_at|modified_at|status|is_active), direction`.
  - Retorna usuarios con agregación de roles (JSON) y `permissions` combinados.
- `POST /api/user`
  - Body: `{ username, email, password, image?, status='active', is_active? (mapea a status), role_ids: number[] }`
  - Valida email único. Inserta usuario y roles. Retorna usuario enriquecido con roles y `permissions`.
- `GET /api/user/me`
  - Retorna el usuario autenticado (via cookie/JWT) con roles y `permissions`.
- `GET /api/user/:id`
  - Retorna usuario con roles agregados y `permissions`.
- `PATCH /api/user/:id`
  - Body parcial: `{ email?, username?, image?, status?, is_active?, password?, role_ids? }`
  - Actualiza usuario y (si se incluyen) reemplaza roles. Retorna usuario actualizado con roles y `permissions`.
- `DELETE /api/user/:id`
  - Desactiva usuario (`status='inactive'`) y elimina sus roles. Retorna `{ ok:true }`.

### Campos y validación

- **POST /api/user**
  - Requeridos: `username (min 3)`, `email (email)`, `password (min 6)`, `role_ids (array<number> no vacío)`
  - Opcionales: `image (string|null)`, `status (string, default 'active')`, `is_active (boolean, default true)`
- **PATCH /api/user/:id**
  - Todos los campos del POST son opcionales. `password` si se envía debe cumplir min 6.

### Ejemplos de salida

- GET `/api/user`:
```json
{
  "success": true,
  "data": [
    {
      "id": 7,
      "username": "editor",
      "email": "editor@example.com",
      "image": null,
      "status": "active",
      "created_at": "2025-01-01T10:00:00.000Z",
      "modified_at": "2025-01-02T10:00:00.000Z",
      "roles": [{ "id": 2, "name": "Editor", "description": null, "permissions": { "canEditContent": true } }],
      "permissions": { "canEditContent": true, "canPublish": false, "canManageUsers": false }
    }
  ],
  "meta": { "page": 1, "pageSize": 20, "totalItems": 1, "totalPages": 1, "count": 1 }
}
```
- POST `/api/user`:
```json
{
  "success": true,
  "data": {
    "id": 8,
    "username": "newuser",
    "email": "newuser@example.com",
    "image": null,
    "status": "active",
    "created_at": "2025-01-03T10:00:00.000Z",
    "modified_at": "2025-01-03T10:00:00.000Z",
    "roles": [{ "id": 2, "name": "Editor", "description": null, "permissions": { "canEditContent": true } }],
    "permissions": { "canEditContent": true }
  }
}
```

## Roles

- `GET /api/role`
  - Query: `page, pageSize, q|search, sort (name|created_at), direction`.
- `POST /api/role`
  - Body: `{ name, description?, permissions: { canReview, canPublish, canTranslate, canAssignTags, canEditContent, canManageUsers, canResolveFeedback } }`
- `GET /api/role/:id`
  - Retorna rol. Campo `permissions` normalizado a objeto.
- `PATCH /api/role/:id`
  - Body parcial: `{ name?, description?, permissions? }`.
- `DELETE /api/role/:id`
  - Borra el rol. `{ ok:true }`.

### Campos y validación

- **POST /api/role**
  - Requeridos: `name (min 2)`, `permissions (objeto con flags booleanos)`
  - Opcionales: `description (string)`
- **PATCH /api/role/:id**
  - Todos opcionales: `name`, `description`, `permissions`

### Ejemplos de salida

- GET `/api/role`:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Admin",
      "description": "Full access",
      "permissions": {
        "canReview": true,
        "canPublish": true,
        "canTranslate": true,
        "canAssignTags": true,
        "canEditContent": true,
        "canManageUsers": true,
        "canResolveFeedback": true
      },
      "created_at": "2025-01-01T10:00:00.000Z"
    }
  ],
  "meta": { "page": 1, "pageSize": 20, "totalItems": 1, "totalPages": 1, "count": 1 }
}
```
- POST `/api/role`:
```json
{
  "success": true,
  "data": {
    "id": 3,
    "name": "Translator",
    "description": null,
    "permissions": { "canTranslate": true },
    "created_at": "2025-01-03T10:00:00.000Z"
  }
}
```

## Auth

- `POST /api/auth/login` (público) — ver sección Autenticación.
- `POST /api/auth/logout` (público) — ver sección Autenticación.

## Tags

- `GET /api/tag`
  - Query: `page, pageSize, q|search, is_active, category, parent_id, lang, sort (created_at|modified_at|code|category|name|is_active|created_by), direction`.
  - Incluye `parent_name` si tiene padre.
- `POST /api/tag`
  - Body: `{ code, category?, parent_id?, sort?, is_active?, created_by?, name, short_text?, description? }`
  - Crea tag y su traducción inicial en EN.
- `GET /api/tag/:id`
  - Query: `lang`.
  - Resuelve traducciones para idioma solicitado con fallback EN. Incluye `parent_name`.
- `PATCH /api/tag/:id`
  - Query: `lang`.
  - Body parcial base `{ code?, category?, parent_id?, sort?, is_active?, created_by? }` y/o traducción para `lang` `{ name?, short_text?, description? }`.
  - Si no existe traducción para `lang` y se pretende crear, `name` es requerido.
- `DELETE /api/tag/:id`
  - Query: `lang`. Si `lang==='en'` borra tag + todas traducciones. Si no, borra solo traducción `lang`.
- `PATCH /api/tag/batch`
  - Body: `{ ids: number[], ...patchBase }` sobre tabla `tags`.
- `GET /api/tag/export`
  - Exporta `{ tags: [...] }` (ver helpers de exportación).
- `POST /api/tag/import`
  - Importa `{ tags: [ ... ] }` (ver helpers de importación). Respuesta con `counts` y `errors`.

### Campos y validación

- **POST /api/tag**
  - Requeridos: `code`, `name`
  - Opcionales: `category`, `parent_id (number|null)`, `sort (int)`, `is_active (boolean, default true)`, `created_by (number)`, `short_text (string|null)`, `description (string|null)`
- **PATCH /api/tag/:id** (con `lang` opcional, por defecto `en`)
  - Base opcional: `code`, `category`, `parent_id (number|null)`, `sort`, `is_active`, `created_by`
  - Traducción opcional para `lang`: `name`, `short_text (string|null)`, `description (string|null)`

### Ejemplos de salida

- GET `/api/tag`:
```json
{
  "success": true,
  "data": [
    {
      "id": 10,
      "code": "element.fire",
      "category": "element",
      "parent_id": null,
      "sort": 0,
      "is_active": true,
      "created_by": 2,
      "created_at": "2025-01-01T10:00:00.000Z",
      "modified_at": "2025-01-02T10:00:00.000Z",
      "name": "Fire",
      "short_text": null,
      "description": null,
      "language_code_resolved": "en",
      "parent_name": null
    }
  ],
  "meta": { "page": 1, "pageSize": 20, "totalItems": 1, "totalPages": 1, "count": 1 }
}
```
- GET `/api/tag/:id`:
```json
{
  "success": true,
  "data": {
    "id": 10,
    "code": "element.fire",
    "category": "element",
    "parent_id": null,
    "sort": 0,
    "is_active": true,
    "created_by": 2,
    "created_at": "2025-01-01T10:00:00.000Z",
    "modified_at": "2025-01-02T10:00:00.000Z",
    "name": "Fire",
    "short_text": null,
    "description": null,
    "language_code_resolved": "en",
    "parent_name": null
  }
}
```

## Tag Links

- `POST /api/tag_links`
  - Body: `{ entity_type: 'arcana'|'facet'|'base_card'|'base_card_type'|'world'|'world_card'|'base_skills', entity_ids: number[]|number, tag_ids: number[]|number }`
  - Inserta vínculos (ignora duplicados). Usa `created_by` si hay usuario en contexto.
- `DELETE /api/tag_links`
  - Body: igual que attach. Elimina coincidencias exactas.

Nota: los listados de recursos usan `tag_links` con `entity_type` específico por recurso (p.ej. `'arcana'`, `'base_card'`, `'facet'`, `'world'`, `'world_card'`, y en habilidades se usa `'skills'` en los filtros de consulta). Alinear el `entity_type` de `tag_links` con lo esperado por cada listado.

### Campos y validación

- **POST/DELETE /api/tag_links**
  - Requeridos: `entity_type` (enum), `entity_ids` (number|number[]), `tag_ids` (number|number[])
  - Normalización: `entity_ids` y `tag_ids` se aceptan como número o array; se deduplican internamente.

### Ejemplo de salida

```json
{
  "success": true,
  "data": { "entity_type": "base_card", "entity_ids": [1,2], "tag_ids": [10, 11] }
}
```

## Uploads

- `POST /api/uploads?type={carpeta}`
  - Multipart form; primer archivo es la imagen.
  - Validaciones: tamaño ≤ 15MB, formato soportado `jpeg|jpg|png|webp|gif|svg|avif`, coherencia MIME vs contenido real.
  - Optimiza (si procede) a AVIF con tamaño máximo 1600px conservando proporción; guarda en `public/img/{type}/`.
  - Respuesta: `{ success: true, type, filename, path, url }`.

### Campos y validación

- **POST /api/uploads**
  - Query requerido: `type` (carpeta destino; alfanumérico, `_` y `-`)
  - Body: `multipart/form-data` con un único archivo (imagen)
  - Restricciones: tamaño ≤ 15MB; formatos: `jpeg|jpg|png|webp|gif|svg|avif`; el MIME debe coincidir con el contenido real.

### Ejemplo de salida

```json
{ "success": true, "type": "arcana", "filename": "image-1700000000-a1b2c3.avif", "path": "arcana/image-...avif", "url": "/img/arcana/image-...avif" }
```

## Arcana

- `GET /api/arcana`
  - Query: `page, pageSize, q|search, status, is_active, created_by, lang, sort (created_at|modified_at|code|status|name|is_active|created_by), direction, tags, tag_ids`.
  - Respuesta: lista con campos base + campos traducidos y `tags` (array `{ id, name, language_code_resolved }`).
- `POST /api/arcana`
  - Body: `{ code, image?, status?, is_active?, name, short_text?, description? }`.
  - Crea base + traducción EN. (El campo `is_active` puede usar valor por defecto de DB si no se persiste explícitamente).
- `GET /api/arcana/:id`
  - Query: `lang`.
- `PATCH /api/arcana/:id`
  - Query: `lang`. Body parcial base `{ code?, image?, status?, is_active? }` y/o traducción `{ name?, short_text?, description? }` (upsert por idioma).
- `DELETE /api/arcana/:id`
  - Query: `lang`. Ver regla de borrado por idioma.
- `PATCH /api/arcana/batch`
  - Body: `{ ids: number[], ...patchBase }`.
- `GET /api/arcana/export` / `POST /api/arcana/import`
  - Ver helpers de exportación/importación.

### Campos y validación

- **POST /api/arcana**
  - Requeridos: `code`, `name`
  - Opcionales: `image (string|null)`, `status (string)`, `is_active (boolean)`
  - Nota: `is_active` no se persiste explícitamente en la creación; aplica el valor por defecto de BD.
- **PATCH /api/arcana/:id** (con `lang` opcional, por defecto `en`)
  - Base opcional: `code`, `image (string|null)`, `status`, `is_active`
  - Traducción opcional para `lang`: `name`, `short_text (string|null)`, `description (string|null)`

### Ejemplos de salida

- GET `/api/arcana` (item):
```json
{
  "id": 1,
  "code": "ARC_FOOL",
  "status": "draft",
  "is_active": true,
  "created_by": 2,
  "created_at": "2025-01-01T10:00:00.000Z",
  "modified_at": "2025-01-02T10:00:00.000Z",
  "name": "El Loco",
  "short_text": null,
  "description": "Descripción...",
  "language_code_resolved": "es",
  "create_user": "admin",
  "tags": [{ "id": 3, "name": "major", "language_code_resolved": "en" }]
}
```
- POST `/api/arcana`:
```json
{
  "success": true,
  "data": {
    "id": 5,
    "code": "ARC_HIEROPHANT",
    "status": "draft",
    "created_at": "2025-01-03T10:00:00.000Z",
    "modified_at": "2025-01-03T10:00:00.000Z",
    "name": "The Hierophant",
    "short_text": null,
    "description": null,
    "language_code": "en"
  }
}
```

## Base Card

- `GET /api/base_card`
  - Query: `page, pageSize, q|search, status, is_active, created_by, card_type_id, lang, sort (created_at|modified_at|code|status|name|is_active|created_by|card_type_id), direction, tags, tag_ids`.
  - Incluye `card_type` resuelto por traducciones.
- `POST /api/base_card`
  - Body: `{ code, card_type_id, image?, status?, name, short_text?, description? }`.
- `GET /api/base_card/:id`
  - Query: `lang`.
- `PATCH /api/base_card/:id`
  - Query: `lang`. Body parcial base `{ code?, card_type_id?, image?, status? }` y/o traducción `{ name?, short_text?, description? }`.
- `DELETE /api/base_card/:id`
  - Query: `lang`.
- `PATCH /api/base_card/batch`
  - Body: `{ ids: number[], ...patchBase }`.
- `GET /api/base_card/export` / `POST /api/base_card/import`
  - Usa `translationForeignKey: 'card_id'` para traducciones.

### Campos y validación

- **POST /api/base_card**
  - Requeridos: `code`, `card_type_id`, `name`
  - Opcionales: `image (string|null)`, `status (string)`, `short_text (string|null)`, `description (string|null)`
- **PATCH /api/base_card/:id** (con `lang` opcional)
  - Base opcional: `code`, `card_type_id`, `image (string|null)`, `status`
  - Traducción opcional para `lang`: `name`, `short_text (string|null)`, `description (string|null)`

### Ejemplos de salida

- GET `/api/base_card` (item):
```json
{
  "id": 11,
  "code": "FIRE_01",
  "card_type_id": 2,
  "status": "draft",
  "is_active": true,
  "created_by": 2,
  "image": "/img/cards/fire_01.avif",
  "created_at": "2025-01-01T10:00:00.000Z",
  "modified_at": "2025-01-02T10:00:00.000Z",
  "name": "Fuego",
  "short_text": null,
  "description": null,
  "language_code_resolved": "es",
  "card_type": "Elemental",
  "create_user": "admin",
  "tags": []
}
```

## Card Type (Base Card Type)

- `GET /api/card_type`
  - Query: `page, pageSize, q|search, status, is_active, created_by, lang, sort (created_at|modified_at|code|status|name|is_active|created_by), direction`.
- `POST /api/card_type`
  - Body: `{ code, image?, status?, is_active?, name, short_text?, description? }`.
- `GET /api/card_type/:id` — Query: `lang`.
- `PATCH /api/card_type/:id` — Query: `lang`. Body parcial base y/o traducción.
- `DELETE /api/card_type/:id` — Query: `lang`.
- `PATCH /api/card_type/batch` — Body: `{ ids: number[], ...patchBase }`.
- `GET /api/card_type/export` / `POST /api/card_type/import`
  - NOTA: Estos endpoints invocan helpers con `table: 'card_type'`, mientras el esquema DB usa `base_card_type`. Asegúrate de contar con una tabla/vista `card_type` o ajusta según tu despliegue.

### Campos y validación

- **POST /api/card_type**
  - Requeridos: `code`, `name`
  - Opcionales: `image (string|null)`, `status (string)`, `is_active (boolean)`, `short_text (string|null)`, `description (string|null)`
- **PATCH /api/card_type/:id** (con `lang` opcional)
  - Base opcional: `code`, `image (string|null)`, `status`, `is_active`
  - Traducción opcional: `name`, `short_text (string|null)`, `description (string|null)`

### Ejemplos de salida

- GET `/api/card_type` (item):
```json
{
  "id": 3,
  "code": "ELEMENTAL",
  "status": "active",
  "is_active": true,
  "created_by": 1,
  "image": null,
  "created_at": "2025-01-01T10:00:00.000Z",
  "modified_at": "2025-01-02T10:00:00.000Z",
  "name": "Elemental",
  "short_text": null,
  "description": null,
  "language_code_resolved": "en",
  "create_user": "admin"
}
```

## Facet

- `GET /api/facet`
  - Query: `page, pageSize, q|search, status, is_active, created_by, arcana_id, lang, sort (created_at|modified_at|status|name|is_active|created_by|arcana_id), direction, tags, tag_ids`.
  - Incluye `arcana` resuelto por traducciones.
- `POST /api/facet`
  - Body: `{ code, arcana_id, image?, status?, is_active?, name, short_text?, description? }`.
- `GET /api/facet/:id` — Query: `lang`.
- `PATCH /api/facet/:id` — Query: `lang`. Body parcial base y/o traducción.
- `DELETE /api/facet/:id` — Query: `lang`.
- `PATCH /api/facet/batch` — Body: `{ ids: number[], ...patchBase }`.
- `GET /api/facet/export` / `POST /api/facet/import` — Ver helpers.

### Campos y validación

- **POST /api/facet**
  - Requeridos: `code`, `arcana_id`, `name`
  - Opcionales: `image (string|null)`, `status (string)`, `is_active (boolean)`, `short_text (string|null)`, `description (string|null)`
- **PATCH /api/facet/:id** (con `lang` opcional)
  - Base opcional: `code`, `arcana_id`, `image (string|null)`, `status`, `is_active`
  - Traducción opcional: `name`, `short_text (string|null)`, `description (string|null)`

### Ejemplos de salida

- GET `/api/facet` (item):
```json
{
  "id": 6,
  "code": "ARC_FIRE",
  "arcana_id": 1,
  "status": "active",
  "is_active": true,
  "created_by": 1,
  "created_at": "2025-01-01T10:00:00.000Z",
  "modified_at": "2025-01-02T10:00:00.000Z",
  "name": "Fuego",
  "short_text": null,
  "description": null,
  "language_code_resolved": "es",
  "arcana": "Major Arcana",
  "create_user": "admin",
  "tags": []
}
```

## Skills (Base Skills)

- `GET /api/skill`
  - Query: `page, pageSize, q|search, status, is_active, created_by, facet_id, lang, sort (created_at|modified_at|code|status|name|is_active|created_by|facet_id), direction, tags, tag_ids`.
  - Incluye `facet` resuelto por traducciones.
- `POST /api/skill`
  - Body: `{ code, facet_id, image?, status?, name, short_text?, description? }`.
- `GET /api/skill/:id` — Query: `lang`.
- `PATCH /api/skill/:id` — Query: `lang`. Body parcial base y/o traducción.
- `DELETE /api/skill/:id` — Query: `lang`.
- `PATCH /api/skill/batch` — Body: `{ ids: number[], ...patchBase }`.
- `GET /api/skill/export` / `POST /api/skill/import` — Ver helpers.

### Campos y validación

- **POST /api/skill**
  - Requeridos: `code`, `facet_id`, `name`
  - Opcionales: `image (string|null)`, `status (string)`, `short_text (string|null)`, `description (string|null)`
- **PATCH /api/skill/:id** (con `lang` opcional)
  - Base opcional: `code`, `facet_id`, `image (string|null)`, `status`
  - Traducción opcional: `name`, `short_text (string|null)`, `description (string|null)`

### Ejemplos de salida

- GET `/api/skill` (item):
```json
{
  "id": 12,
  "code": "IGNITE",
  "facet_id": 6,
  "status": "draft",
  "is_active": true,
  "created_by": 2,
  "image": null,
  "created_at": "2025-01-01T10:00:00.000Z",
  "modified_at": "2025-01-02T10:00:00.000Z",
  "name": "Encender",
  "short_text": null,
  "description": null,
  "language_code_resolved": "es",
  "facet": "Fuego",
  "create_user": null,
  "tags": []
}
```

## World

- `GET /api/world`
  - Query: `page, pageSize, q|search, status, is_active, created_by, lang, sort (created_at|modified_at|code|status|name|is_active|created_by), direction, tags, tag_ids`.
- `POST /api/world`
  - Body: `{ code, image?, status?, name, short_text?, description? }`.
- `GET /api/world/:id` — Query: `lang`.
- `PATCH /api/world/:id` — Query: `lang`. Body parcial base y/o traducción.
- `DELETE /api/world/:id` — Query: `lang`.
- `PATCH /api/world/batch` — Body: `{ ids: number[], ...patchBase }`.
- `GET /api/world/export` / `POST /api/world/import` — Ver helpers.

### Campos y validación

- **POST /api/world**
  - Requeridos: `code`, `name`
  - Opcionales: `image (string|null)`, `status (string)`, `short_text (string|null)`, `description (string|null)`
- **PATCH /api/world/:id** (con `lang` opcional)
  - Base opcional: `code`, `image (string|null)`, `status`
  - Traducción opcional: `name`, `short_text (string|null)`, `description (string|null)`

### Ejemplos de salida

- GET `/api/world` (item):
```json
{
  "id": 2,
  "code": "EARTH",
  "status": "active",
  "is_active": true,
  "created_by": 1,
  "image": null,
  "created_at": "2025-01-01T10:00:00.000Z",
  "modified_at": "2025-01-02T10:00:00.000Z",
  "name": "Tierra",
  "short_text": null,
  "description": null,
  "language_code_resolved": "es",
  "create_user": "admin",
  "tags": []
}
```

## World Card

- `GET /api/world_card`
  - Query: `page, pageSize, q|search, status, is_active, created_by, world_id, lang, sort (created_at|modified_at|status|name|is_active|created_by|world_id), direction, tags, tag_ids`.
- `POST /api/world_card`
  - Body: `{ code, world_id, base_card_id?, image?, status?, is_override?, name, short_text?, description? }`.
- `GET /api/world_card/:id` — Query: `lang`.
- `PATCH /api/world_card/:id` — Query: `lang`. Body parcial base y/o traducción.
- `DELETE /api/world_card/:id` — Query: `lang`.
- `PATCH /api/world_card/batch` — Body: `{ ids: number[], ...patchBase }`.
- `GET /api/world_card/export` / `POST /api/world_card/import` — Ver helpers. Usa `translationForeignKey: 'card_id'`.

### Campos y validación

- **POST /api/world_card**
  - Requeridos: `code`, `world_id`, `name`
  - Opcionales: `base_card_id (number|null)`, `is_override (boolean)`, `image (string|null)`, `status (string)`, `short_text (string|null)`, `description (string|null)`
- **PATCH /api/world_card/:id** (con `lang` opcional)
  - Base opcional: `code`, `world_id`, `base_card_id (number|null)`, `is_override`, `image (string|null)`, `status`
  - Traducción opcional: `name`, `short_text (string|null)`, `description (string|null)`

### Ejemplos de salida

- GET `/api/world_card` (item):
```json
{
  "id": 21,
  "code": "EARTH_FIRE_01",
  "world_id": 2,
  "base_card_id": 11,
  "is_override": false,
  "status": "draft",
  "is_active": true,
  "created_by": 1,
  "image": null,
  "created_at": "2025-01-01T10:00:00.000Z",
  "modified_at": "2025-01-02T10:00:00.000Z",
  "name": "Fuego (Tierra)",
  "short_text": null,
  "description": null,
  "language_code_resolved": "es",
  "create_user": "admin",
  "tags": []
}
```

## Content Feedback

- `GET /api/content_feedback`
  - Query: `page, pageSize, search, entity_type, entity_id, version_number, language_code, status, category, created_by, resolved_by, has_resolution (boolean), sort (created_at|resolved_at|status|entity|version_number), direction`.
- `POST /api/content_feedback`
  - Body: `{ entity_type, entity_id, comment, category?, language_code?, version_number?, status? }`. Usa `created_by` del usuario en contexto.
- `GET /api/content_feedback/:id` — Retorna feedback con `created_by_name` y `resolved_by_name`.
- `PATCH /api/content_feedback/:id`
  - Body parcial: `{ comment?, category?, language_code?(nullable), status?, version_number?(nullable), resolved_by?(nullable), resolved_at?(date|null) }`.
- `DELETE /api/content_feedback/:id` — Borra feedback. `{ ok:true }`.

### Campos y validación

- **POST /api/content_feedback**
  - Requeridos: `entity_type (enum)`, `entity_id (int)`, `comment (string)`
  - Opcionales: `category (string)`, `language_code (string<=5)`, `version_number (int)`, `status (open|resolved|dismissed)`
- **PATCH /api/content_feedback/:id**
  - Opcionales: `comment`, `category`, `language_code (string|null)`, `status`, `version_number (int|null)`, `resolved_by (int|null)`, `resolved_at (date|null)`

### Ejemplos de salida

- GET `/api/content_feedback` (item):
```json
{
  "id": 30,
  "entity_type": "base_card",
  "entity_id": 11,
  "version_number": 1,
  "language_code": "es",
  "comment": "Corregir acento",
  "category": "orthography",
  "status": "open",
  "created_by": 2,
  "resolved_by": null,
  "created_at": "2025-01-02T10:00:00.000Z",
  "resolved_at": null,
  "created_by_name": "editor",
  "resolved_by_name": null
}
```

## Content Revisions

- `GET /api/content_revisions`
  - Query: `page, pageSize, search, entity_type, entity_id, version_number, status, language_code, content_version_id, created_by, sort (created_at|version_number|status), direction`.
- `POST /api/content_revisions`
  - Body: `{ entity_type, entity_id, version_number, diff (obj JSON), notes?, status?, language_code?, content_version_id?, prev_snapshot?, next_snapshot? }`. Usa `created_by` del usuario en contexto.
- `GET /api/content_revisions/:id` — Retorna revisión con `created_by_name` y `content_version_semver`.
- `PATCH /api/content_revisions/:id`
  - Valida `version_number` único por entidad. Body parcial admite `{ diff?, notes?(nullable), status?, language_code?(nullable), version_number?, content_version_id?(nullable), prev_snapshot?, next_snapshot? }`.
- `DELETE /api/content_revisions/:id` — Borra revisión. `{ ok:true }`.

### Campos y validación

- **POST /api/content_revisions**
  - Requeridos: `entity_type (enum)`, `entity_id (int)`, `version_number (int>=1)`
  - Opcionales: `diff (obj JSON, default {})`, `notes (string)`, `status (string, default 'draft')`, `language_code (string<=5)`, `content_version_id (int)`, `prev_snapshot (obj|null)`, `next_snapshot (obj|null)`
- **PATCH /api/content_revisions/:id**
  - Opcionales: `diff (obj)`, `notes (string|null)`, `status (string)`, `language_code (string|null)`, `version_number (int>=1, único por entidad)`, `content_version_id (int|null)`, `prev_snapshot (obj|null)`, `next_snapshot (obj|null)`

### Ejemplos de salida

- GET `/api/content_revisions` (item):
```json
{
  "id": 41,
  "entity_type": "base_card",
  "entity_id": 11,
  "version_number": 2,
  "status": "draft",
  "language_code": null,
  "content_version_id": null,
  "created_by": 2,
  "created_at": "2025-01-03T10:00:00.000Z",
  "notes": null,
  "diff": {},
  "prev_snapshot": null,
  "next_snapshot": null,
  "created_by_name": "editor",
  "content_version_semver": null
}
```

## Content Versions

- `GET /api/content_versions`
  - Query: `page, pageSize, search, version_semver, created_by, release, sort (created_at|version_semver), direction`.
- `POST /api/content_versions`
  - Body: `{ version_semver, description?, metadata? (obj), release? }` (único `version_semver`). Usa `created_by` del usuario en contexto. Devuelve fila con `created_by_name` y `release`.
- `GET /api/content_versions/:id`
  - Retorna versión con `created_by_name` y `release`.
- `PATCH /api/content_versions/:id`
  - Valida `version_semver` único si cambia. Body parcial `{ version_semver?, description?(nullable), metadata? (obj), release? }`.
- `DELETE /api/content_versions/:id` — Borra versión. `{ ok:true }`.

### Campos y validación

- **POST /api/content_versions**
  - Requeridos: `version_semver (string)`
  - Opcionales: `description (string)`, `metadata (obj, default {})`, `release (dev|alfa|beta|candidate|release|revision, default alfa)`
- **PATCH /api/content_versions/:id**
  - Opcionales: `version_semver (string, único)`, `description (string|null)`, `metadata (obj)`, `release (enum)`

### Ejemplos de salida

- GET `/api/content_versions` (item):
```json
{
  "id": 5,
  "version_semver": "1.0.0",
  "description": "Primera versión",
  "metadata": {},
  "release": "alfa",
  "created_by": 1,
  "created_at": "2025-01-01T10:00:00.000Z",
  "created_by_name": "admin"
}
```

## Database (export/import)

Requiere permisos administrativos: `canManageUsers` o `canAccessAdmin`.

- `GET /api/database/export.json`
  - Exporta datos normalizados por entidades: `world, world_card, arcana, base_card, card_type, skill, facet, tag` (keys) con `counts` en `meta`.
- `GET /api/database/export.sql`
  - Genera dump SQL (DELETE + INSERT) ordenado para respetar dependencias básicas. Devuelve `{ sql }` y `{ size }` en `meta`.
- `POST /api/database/import.json`
  - Body: objeto con arrays por key (p. ej. `{ arcana: [...], base_card: [...], ... }`). Orden de importación respeta FKs. Respuesta con `counts` `{ created, updated }` y `errors` (por índice y mensaje).
- `POST /api/database/import.sql`
  - Body: texto con SQL o `{ sql: string }`. Ejecuta por sentencias (best-effort) dentro de transacción; no hace rollback por errores parciales. `meta: { executed, errors[] }`.

### Ejemplos de salida

- GET `/api/database/export.json` (fragmento):
```json
{
  "success": true,
  "data": {
    "arcana": [ { "id": 1, "code": "ARC_FOOL", "status": "active", "created_at": "..." } ],
    "base_card": [ { "id": 11, "code": "FIRE_01", "card_type_id": 2, "status": "draft", "created_at": "..." } ]
  },
  "meta": { "counts": { "arcana": 22, "base_card": 78 } }
}
```
- POST `/api/database/import.json` (resultado):
```json
{ "success": true, "data": { "created": 10, "updated": 5, "errors": [] } }
```

---

# Índices recomendados (sugerencias en código)

Para listados con traducciones y búsquedas por nombre/código:
- `*_code`, `*_status`
- Traducciones: índices compuestos `(<fk> , language_code)` e índice por `language_code`.

---

# Detalles de implementación (cómo lo hace)

- Consultas construidas con Kysely, usando `left join` a tablas de traducción para idioma solicitado y fallback a EN mediante `coalesce`.
- Agregaciones de `tags` hechas con subconsulta JSON, resolviendo nombre en idioma solicitado y fallback EN.
- `buildFilters` aplica:
  - Búsqueda full-text ligera (`ilike` en columnas mapeadas o `applySearch`).
  - Conteo total (distinct si se especifica) y ordenación segura vía `sortColumnMap`.
- `safeParseOrThrow` centraliza validación Zod y genera errores 400 con mensajes agregados. Normaliza mensajes de sort inválido.
- En endpoints de importación/exportación por entidad se usan los helpers `entityCrudHelpers` para detectar tablas de traducción automáticamente y empaquetar/desempaquetar `translations`.

---

# Variables de entorno

- `DATABASE_URL`: cadena de conexión Postgres (obligatoria).
- `JWT_SECRET`: secreto para firmar/verificar JWT (obligatoria para auth).
- `JWT_EXPIRES_IN`: duración del token. Acepta segundos o formatos `Xs|Xm|Xh|Xd` (por defecto `1d`).
- `NODE_ENV`: si es `production` fuerza cookies seguras y logging compacto.

---

# Ejemplos breves

- Listar base cards (paginado y búsqueda):
```
GET /api/base_card?page=1&pageSize=20&search=fire&lang=es&sort=name&direction=asc
```
Respuesta:
```
{
  "success": true,
  "data": [ { "id": 1, "code": "FIRE_01", "name": "Fuego", ... } ],
  "meta": { "page": 1, "pageSize": 20, "totalItems": 123, "totalPages": 7, "count": 20, "search": "fire" }
}
```

- Crear tag:
```
POST /api/tag
{
  "code": "element.fire",
  "name": "Fire",
  "category": "element"
}
```

- Subir imagen:
```
POST /api/uploads?type=arcana
Content-Type: multipart/form-data
(file: image/jpeg)
```
Respuesta: `{ success: true, path: "arcana/xxx.avif", url: "/img/arcana/xxx.avif" }`

---

# Notas

- En `card_type/* (export/import/batch)` se usa `table: 'card_type'` en helpers; el esquema DB es `base_card_type`. Verifica que exista una vista/tabla `card_type` o ajusta antes de usar estos endpoints.
- Para que los listados de `skill` muestren tags, los `tag_links` deben usar el `entity_type` esperado por el listado (en el código de listados se usa `'skills'`).

---

# Changelog de esta documentación

- v1: Primera versión, generada a partir del código fuente en `/server/api` y utilidades relacionadas.
