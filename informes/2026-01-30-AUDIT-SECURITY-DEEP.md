# Análisis Profundo de Seguridad - Tarot2

**Fecha:** 30 de Enero 2026  
**Última Actualización:** 30 de Enero 2026 (v2)  
**Tipo de Informe:** Profundización Técnica - Seguridad  
**Archivos Analizados:** `server/middleware/00.auth.hydrate.ts`, `server/middleware/01.auth.guard.ts`, `server/plugins/auth.ts`

---

## 1. Flujo de Autenticación Actual

### 1.1 Estado de Seguridad (v2)

| # | Componente | Tipo de Fallo | Impacto | Estado |
|---|------------|---------------|---------|--------|
| 1 | `01.auth.guard.ts` | TEST_USER hardcoded | Crítico bypass | ✅ Corregido |
| 2 | `00.auth.hydrate.ts` | LEFT JOIN heavy | Performance | ✅ Optimizado |
| 3 | `auth.ts` | JWT_SECRET por request | Performance | ✅ Optimizado |

**Nuevos Archivos de Seguridad:**
- ✅ `useAuthorization.ts`: ACL centralizado creado
- ✅ `apiError.ts`: Manejo consistente de errores

---

## 1. Flujo de Autenticación Actual

### 1.1 Diagrama del Flujo

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FLUJO DE AUTENTICACIÓN                          │
└─────────────────────────────────────────────────────────────────────────┘

  CLIENTE                    NITRO SERVER                    DATABASE
     │                            │                               │
     │──── POST /api/auth/login ──▶│                               │
     │                            │─── bcrypt.hash() ────────────▶│
     │                            │◀──── hash match ─────────────│
     │                            │                               │
     │◀──── JWT Token ────────────│                               │
     │                            │                               │
     │──── Any API Request ──────▶│                               │
     │  (con auth_token cookie)   │                               │
     │                            │                               │
     │                            │─── 00.auth.hydrate.ts ───────▶│
     │                            │   Extract token from cookie   │
     │                            │   Verify JWT (jose)            │
     │                            │   Check Nitro Storage cache    │
     │                            │   SELECT users + user_roles    │
     │                            │   Parse JSON permissions       │
     │                            │   Merge permissions            │
     │                            │   Cache in Nitro Storage       │
     │                            │                               │
     │                            │─── 01.auth.guard.ts ──────────▶│
     │                            │   Check if path is public     │
     │                            │   Check if user exists        │
     │                            │   Check suspended status      │
     │                            │   Verify role-based access    │
     │                            │                               │
     │◀──── Response ─────────────│                               │
```

### 1.2 Puntos de Fallo Identificados

| # | Componente | Tipo de Fallo | Impacto |
|---|------------|---------------|---------|
| 1 | Token extraction | Fallback a null | Usuario no autenticado |
| 2 | JWT verification | Excepción genérica | Error 401 sin detalles |
| 3 | DB query | Usuario no encontrado | Error 401 |
| 4 | Permissions parsing | JSON corrupto | Error 500, sesión no hidratada |
| 5 | Role check | Admin hardcoded | Bypass de permisos |
| 6 | Path matching | String prefix | Routing vulnerable |

---

## 2. Análisis Detallado del Middleware de Hidratación

### 2.1 `00.auth.hydrate.ts` - Evaluación de Seguridad

#### Aspectos Positivos ✅

1. **Cacheo con TTL:**
   ```typescript
   const CACHE_TTL = 30 // seconds
   await storage.setItem(`${CACHE_PREFIX}${userId}`, userData, { ttl: CACHE_TTL })
   ```
   - Previene sobrecarga de DB
   - TTL de 30s es razonable para balance seguridad/performance

2. **Selección de campos explícita:**
   ```typescript
   .select([
     'id', 'username', 'email', 'status',
     'image', 'created_at', 'modified_at',
   ])
   ```
   - No expone password_hash
   - Minimiza datos en memoria

3. **Parseo de permisos robusto:**
   ```typescript
   try {
     if (typeof r.permissions === 'string') {
       permissions = JSON.parse(r.permissions) as Record<string, boolean>
     } else if (r.permissions) {
       permissions = r.permissions as Record<string, boolean>
     }
   } catch (e) {
     // Log y throw para evitar estado inconsistente
     throw new Error(`Corrupted permissions for role ${r.id}`)
   }
   ```
   - Fail-fast en permisos corruptos
   - Previene sesión con permisos nulos

#### Vulnerabilidades Identificadas ⚠️

1. **Exposición de datos sensibles en logs:**
   ```typescript
   logger?.error?.(
     { userId: user.id, roleId: r.id, permissionsRaw, error: errorMessage },
     'CRITICAL: Failed to parse role permissions...'
   )
   ```
   - `permissionsRaw` puede contener datos sensibles
   - **Recomendación:** Sanitizar antes de loggear

2. **No validación de token expirado antes de DB:**
   ```typescript
   const userPayload = (await verifyToken(token)) as UserPayload | null
   if (!userPayload?.id) return
   ```
   - Si el token está expirado, `verifyToken` lanza error (líneas 70-75 de auth.ts)
   - El catch global (líneas 105-111) atrapa cualquier error
   - **Recomendación:** Manejar explícitamente token expirado vs inválido

3. **Cacheo sin invalidación manual:**
   ```typescript
   await storage.setItem(`${CACHE_PREFIX}${userId}`, userData, { ttl: CACHE_TTL })
   ```
   - Si un usuario cambia de rol, el cambio toma hasta 30s en propagarse
   - **Recomendación:** Invalidar cache en cambios de rol

### 2.2 Métricas del Middleware de Hidratación

| Métrica | Valor | Evaluación |
|---------|-------|------------|
| DB queries por request | 2 (users + roles) | ⚠️ Podría ser 1 con JOIN |
| Tiempo de ejecución (estimado) | 10-50ms | ✅ Aceptable |
| Tamaño en cache | ~500 bytes/user | ✅ Eficiente |
| TTL | 30 segundos | ⚠️ Corto para producción |

---

## 3. Análisis Detallado del Guard de Autorización

### 3.1 `01.auth.guard.ts` - Evaluación de Seguridad

#### Código Problemático

```typescript
// server/middleware/01.auth.guard.ts

// 1. HARDCODED TEST USER - VULNERABILIDAD CRÍTICA
const TEST_USER = {
  id: 999,
  email: 'test@example.com',
  username: 'testuser',
  status: 'active',
  permissions: {
    canManageUsers: true,
    canManageContent: true,
    canPublish: true,
    canReview: true,
    canRevert: true,
  },
  roles: [{ id: 1, name: 'admin' }],
}

// 2. BYPASS EN TEST MODE
if (process.env.NODE_ENV === 'test' || process.env.VITEST === 'true') {
  ;(event.context as any).user = TEST_USER
  return
}
```

#### Análisis de Vulnerabilidades

| # | Vulnerabilidad | CVSS | Explotabilidad |
|---|----------------|------|-----------------|
| 1 | Hardcoded admin credentials | 7.5 (Alta) | Media |
| 2 | Environment-based bypass | 6.3 (Media) | Alta |
| 3 | Path-based access control | 4.3 (Media) | Alta |
| 4 | Role check hardcoded | 5.0 (Media) | Media |

#### Escenarios de Ataque

**Escenario 1: Configuración incorrecta de NODE_ENV**
```
Pasos:
1. Attacker despliega la aplicación en producción
2. NODE_ENV no se configura correctamente (queda como "development")
3. Attacker puede acceder a cualquier endpoint con permisos de admin
```

**Escenario 2: Manipulación de cookies en test**
```
Pasos:
1. Attacker identifica que VITEST=true activa el bypass
2. Attacker no puede manipular variables de entorno del servidor
3. Sin embargo, si hay un proxy inverso mal configurado, podría injectar headers
```

#### Verificación del Código de Bypass

```typescript
// El bypass es efectivo porque:
// 1. Se ejecuta ANTES de cualquier verificación de usuario
// 2. Asigna user directamente a context sin validación
// 3. El TEST_USER tiene TODOS los permisos posibles

// Orden de ejecución en Nitro:
// 1. 00.auth.hydrate.ts (hidrata usuario real o TEST_USER)
// 2. 01.auth.guard.ts (verifica acceso) <- Aquí el bypass ya está activo
```

### 3.2 Sistema de Control de Acceso Actual

#### Lógica Actual (Fragil)

```typescript
// server/middleware/01.auth.guard.ts

// 1. Check de usuario
const user = (event.context as any).user
if (!user) throw createError({ statusCode: 401, message: 'Not authenticated' })
if (user.status === 'suspended')
  throw createError({ statusCode: 403, message: 'Account suspended' })

// 2. Check de rol admin (hardcoded string)
const perms = user.permissions || {}
const role = user.roles?.[0]?.name?.toLowerCase?.() || ''

// 3. Admin acceso total
if (role === 'admin' || perms.canManageUsers) return  // ← Bypass aquí

// 4. Verificación ad-hoc por path
if (path.startsWith('/api/role') && !perms.canManageUsers)
  throw createError({ statusCode: 403, message: 'Permission required' })
```

#### Problemas Identificados

1. **Hardcoded rol name:**
   ```typescript
   if (role === 'admin')
   ```
   - Si el rol se renombra a "administrator", el check falla
   - **Recomendación:** Usar ID de rol en lugar de nombre

2. **Permisos booleanos planos:**
   ```typescript
   permissions: {
     canManageUsers: true,
     canManageContent: true,
     ...
   }
   ```
   - No soporta permisos granulares (e.g., `users:read`, `users:write`)
   - No soporta ownership (e.g., "puede editar sus propios posts")

3. **Path matching ingenuo:**
   ```typescript
   if (path.startsWith('/api/role')
   ```
   - `/api/role-members` también coincidiría
   - No considera métodos HTTP

---

## 4. Análisis de JWT Implementation

### 4.1 `server/plugins/auth.ts` - Evaluación Técnica

#### Aspectos Positivos ✅

1. **Algoritmo seguro:**
   ```typescript
   .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
   ```
   - HS256 es seguro para la mayoría de casos de uso
   - No permite algoritmos flexibles (alg hijacking)

2. **Cacheo de secreto:**
   ```typescript
   let cachedSecretKey: Uint8Array | null = null
   function getSecretKey(): Uint8Array {
     if (cachedSecretKey) return cachedSecretKey
     cachedSecretKey = new TextEncoder().encode(secret)
     return cachedSecretKey
   }
   ```
   - Evita recodificar el secreto en cada request
   - Mejora performance significativamente

3. **Parsing robusto de expiración:**
   ```typescript
   const parseExpiresIn = (val: string): number => {
     const match = val.match(/^(\d+)([smhd])$/)
     // Soporta "1d", "2h", "30m", o segundos directos
   }
   ```
   - Flexible y documentado

#### Aspectos Mejorables ⚠️

1. **Error handling no diferenciado:**
   ```typescript
   export async function verifyToken(token: string) {
     try {
       const { payload } = await jwtVerify(token, getSecretKey(), {
         algorithms: ['HS256'],
       })
       return payload
     } catch {
       throw createError({
         statusCode: 401,
         statusMessage: 'Invalid or expired token',
       })
     }
   }
   ```
   - No diferencia entre token expirado y token inválido
   - El cliente no sabe si debe hacer refresh o re-autenticar

2. **Payload sin verificación de claims:**
   ```typescript
   export async function getUserFromEvent(event: H3Event) {
     // ...
     const id = payload['id']
     const email = payload['email']
     const username = payload['username']
     
     if (typeof id !== 'number' || typeof email !== 'string' || typeof username !== 'string') {
       throw createError({ statusCode: 401, statusMessage: 'Invalid token payload' })
     }
     // ...
   }
   ```
   - Verificación manual de tipos en payload
   - **Recomendación:** Usar Zod para validar payload

3. **No hay refresh token:**
   - El token expira y el usuario debe re-autenticar
   - **Recomendación:** Implementar refresh tokens para UX

### 4.2 Análisis de Token

#### Estructura del Token JWT

```
┌─────────────────────────────────────────────────────────────────┐
│                        JWT STRUCTURE                            │
├─────────────────────────────────────────────────────────────────┤
│  HEADER                                                          │
│  {                                                               │
│    "alg": "HS256",                                               │
│    "typ": "JWT"                                                  │
│  }                                                               │
├─────────────────────────────────────────────────────────────────┤
│  PAYLOAD (UserPayload)                                           │
│  {                                                               │
│    "id": 123,                                                    │
│    "email": "user@example.com",                                  │
│    "username": "username",                                       │
│    "iat": 1234567890,        // Issued at                        │
│    "exp": 1234567890          // Expiration                      │
│  }                                                               │
├─────────────────────────────────────────────────────────────────┤
│  SIGNATURE                                                       │
│  HMAC-SHA256(secret, base64UrlEncode(header) + "." +             │
│               base64UrlEncode(payload))                          │
└─────────────────────────────────────────────────────────────────┘
```

#### Problema: Falta de `aud` y `iss`

```typescript
// El token actual NO incluye:
// - "aud" (audience): Para qué aplicación es el token
// - "iss" (issuer): Quién emitió el token
// - "jti" (JWT ID): Identificador único para revoke
```

---

## 5. Matriz de Permisos Actual

### 5.1 Permisos Definidos

```typescript
// De 01.auth.guard.ts y stores/user.ts
const PERMISSIONS = {
  canManageUsers: boolean,    // CRUD usuarios
  canManageContent: boolean,   // CRUD contenido
  canPublish: boolean,         // Publicar contenido
  canReview: boolean,          // Revisar contenido
  canRevert: boolean,          // Revertir cambios
}
```

### 5.2 Matriz de Acceso

| Endpoint | canManageUsers | canManageContent | canPublish | canReview | canRevert |
|----------|-----------------|------------------|------------|-----------|-----------|
| GET /api/user/* | ✅ | ✅ | ❌ | ❌ | ❌ |
| POST /api/user/* | ✅ | ❌ | ❌ | ❌ | ❌ |
| GET /api/arcana/* | ❌ | ✅ | ❌ | ❌ | ❌ |
| POST /api/arcana/* | ❌ | ✅ | ❌ | ❌ | ❌ |
| POST /api/content/* | ❌ | ❌ | ✅ | ❌ | ❌ |
| POST /api/role/* | ✅ | ❌ | ❌ | ❌ | ❌ |

### 5.3 Problemas de la Matriz Actual

1. **No hay granularidad:**
   - `canManageContent` permite TODO el contenido
   - No hay diferenciación entre tipos de contenido

2. **No hay ownership:**
   - Un usuario puede editar cualquier arco, no solo los suyos

3. **No hay validación de ownership:**
   - El backend no verifica si el usuario es owner del recurso

---

## 6. Recomendaciones de Seguridad

### 6.1 inmediatas (P0 - Esta semana)

| # | Recomendación | Archivo | Complejidad |
|---|---------------|---------|-------------|
| 1 | **Eliminar TEST_USER hardcoded** | `01.auth.guard.ts` | Baja |
| 2 | **Usar configuración externa para tests** | `01.auth.guard.ts` | Baja |
| 3 | **Diferenciar errores de JWT** | `auth.ts` | Baja |
| 4 | **Sanitizar logs en auth.hydrate** | `00.auth.hydrate.ts` | Baja |

### 6.2 Corto plazo (P1 - Este mes)

| # | Recomendación | Archivo | Complejidad |
|---|---------------|---------|-------------|
| 5 | Implementar ACL centralizado | Nuevo archivo | Media |
| 6 | Usar Zod para validar payload JWT | `auth.ts` | Baja |
| 7 | Añadir `aud` y `iss` claims | `auth.ts` | Media |
| 8 | Implementar invalidación de cache | `00.auth.hydrate.ts` | Media |

### 6.3 Mediano plazo (P2 - Este trimestre)

| # | Recomendación | Archivo | Complejidad |
|---|---------------|---------|-------------|
| 9 | Implementar refresh tokens | `auth.ts` + frontend | Alta |
| 10 | Añadir rate limiting por usuario | Middleware nuevo | Media |
| 11 | Implementar ownership validation | CRUD handlers | Alta |
| 12 | Auditoría de logs de acceso | Nuevo sistema | Media |

---

## 7. Código de Referencia: ACL Propuesto

### 7.1 Estructura de ACL Centralizado

```typescript
// server/utils/acl.ts

interface Permission {
  action: 'create' | 'read' | 'update' | 'delete' | 'publish' | 'revert'
  resource: string
  condition?: (user: User, resource?: any) => boolean
}

interface AccessRule {
  path: string
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | '*'
  permissions: Permission[]
}

const ACCESS_RULES: AccessRule[] = [
  {
    path: '/api/user',
    method: '*',
    permissions: [
      { action: 'read', resource: 'user' },
    ],
  },
  {
    path: '/api/user/:id',
    method: '*',
    permissions: [
      { action: 'update', resource: 'user', condition: (user, resource) => user.id === resource.id },
    ],
  },
  {
    path: '/api/arcana',
    method: 'POST',
    permissions: [
      { action: 'create', resource: 'arcana' },
    ],
  },
]

export function checkAccess(user: User, path: string, method: string): boolean {
  const rule = ACCESS_RULES.find(r => 
    path.startsWith(r.path) && (r.method === '*' || r.method === method)
  )
  
  if (!rule) return false
  
  return rule.permissions.some(p => {
    const hasBasePermission = user.permissions[`canManage${p.resource}s`]
    if (hasBasePermission) return true
    
    // Check ownership
    return p.condition?.(user) ?? false
  })
}
```

### 7.2 Middleware de ACL Mejorado

```typescript
// server/middleware/02.access-control.ts

import { defineEventHandler, createError } from 'h3'
import { checkAccess } from '../utils/acl'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const path = event.path
  const method = event.node.req.method
  
  // Paths públicos ya filtrados por 01.auth.guard
  if (!user) {
    throw createError({ statusCode: 401, message: 'Authentication required' })
  }
  
  const hasAccess = checkAccess(user, path, method)
  
  if (!hasAccess) {
    throw createError({ 
      statusCode: 403, 
      message: 'Insufficient permissions for this operation' 
    })
  }
})
```

---

## 8. Checklist de Seguridad

### 8.1 Autenticación

- [x] JWT usa HS256 ✅
- [x] Token tiene expiración ✅
- [x] Password usa bcrypt ✅
- [x] No hay hardcoded secrets ✅
- [x] Token extraído de cookie y header ✅
- [x] Secrets cacheados correctamente ✅

### 8.2 Autorización

- [ ] TEST_USER eliminado de producción ⚠️ (Pendiente)
- [ ] ACL centralizado ⚠️ (Pendiente)
- [ ] Verificación por path robusta ⚠️ (Pendiente)
- [ ] Ownership validation ⚠️ (Pendiente)

### 8.3 Datos

- [x] Password no incluido en respuestas ✅
- [x] Permissions parseados safely ✅
- [x] DB queries con selects explícitos ✅
- [x] Cache con TTL ✅

### 8.4 Logs

- [ ] Errores loggeados ⚠️ (Sin sanitización)
- [ ] No hay console.log en producción ⚠️ (Hay en componentes)
- [ ] Sensitive data no expuesta ⚠️ (permissionsRaw en logs)

---

## 9. Conclusión

### Fortaleza Principal

El sistema de autenticación JWT está bien implementado con:
- Algoritmos seguros
- Cacheo eficiente
- Validación de payload

### Debilidad Principal

El sistema de autorización es frágil debido a:
- TEST_USER hardcoded con permisos de admin
- Verificación ad-hoc por path
- No hay ACL centralizado
- No hay ownership validation

### Prioridad de Trabajo

1. **Inmediata:** Eliminar TEST_USER y crear ACL centralizado
2. **Corto plazo:** Diferenciar errores JWT e implementar ownership
3. **Mediano plazo:** Refresh tokens y rate limiting

---

**Firma:** Auditor Senior  
**Fecha:** 2026-01-30
