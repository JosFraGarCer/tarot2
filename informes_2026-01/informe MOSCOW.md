# 🛡️ Informe de Seguridad Tarot2 (MosCoW)

## Mensaje
```
Revisa todo el código, encuentra vulnerabilidades de seguridad y dame un informe MosCoW (Must/Should/Could/Won't) 
```

## 🔴 MUST (Crítico - Acción Inmediata)
*   **Corregir IDOR en Endpoints de Usuario:**
    *   **Vulnerabilidad:** Los archivos `server/api/user/[id].get.ts`, `.patch.ts` y `.delete.ts` permiten que cualquier usuario autenticado acceda o modifique a otro usuario simplemente cambiando el ID en la URL.
    *   **Causa:** El middleware [01.auth.guard.ts](cci:7://file:///home/bulu/devel/tarot2/server/middleware/01.auth.guard.ts:0:0-0:0) no verifica si el usuario tiene permiso `canManageUsers` o si es el dueño de la cuenta (propietario del ID).
    *   **Riesgo:** Fuga de datos personales y escalada de privilegios (un usuario podría asignarse el rol `admin` a sí mismo).
*   **Sanitización de Diff en RevisionCompareModal.vue:**
    *   **Vulnerabilidad:** Uso de `v-html` para mostrar diferencias entre versiones. Aunque hay una función [escapeHtml](cci:1://file:///home/bulu/devel/tarot2/app/components/admin/RevisionCompareModal.vue:84:0-84:132), el uso de expresiones regulares para reinsertar etiquetas `<span>` sobre un string HTML es propenso a errores que podrían permitir **XSS (Cross-Site Scripting)** si el JSON contiene strings maliciosos.
    *   **Recomendación:** Usar una librería de diff probada o asegurar que el escape ocurra en el último paso posible antes del renderizado.

## 🟠 SHOULD (Importante - Próximos pasos)
*   **Implementar Protección CSRF:**
    *   No se detectó un sistema de tokens Anti-CSRF (como el que provee `nuxt-security`). Las cookies JWT con `SameSite: strict` ayudan, pero no son infalibles contra todos los vectores de ataque en navegadores antiguos o configuraciones específicas.
*   **Reforzar Límites de Entrada en Zod (Rate Limit & Payload):**
    *   Los esquemas Zod (ej: `loginSchema`) aceptan strings sin límite de longitud máxima. Esto puede facilitar ataques de **DoS (Denial of Service)** por agotamiento de memoria o CPU al procesar hashes de passwords extremadamente largos o payloads gigantes.
*   **Estandarizar Rate Limiting:**
    *   Actualmente solo los endpoints "sensibles" (login, logout, publish) tienen límites estrictos. Se recomienda aplicar un límite general (aunque sea más alto) a todos los métodos `POST/PATCH/DELETE` para evitar ataques coordinados de modificación de datos.

## 🟡 COULD (Mejoras Proactivas)
*   **Implementar Content Security Policy (CSP):**
    *   Añadir cabeceras de seguridad para restringir de dónde se pueden cargar scripts e imágenes, mitigando el impacto de posibles XSS.
*   **Rotación de Secretos y Revocación de Tokens:**
    *   El sistema JWT actual no tiene una "lista negra" de tokens. Si un token es robado, es válido hasta que expire. Implementar una tabla de sesiones o un mecanismo de revocación mejoraría la seguridad post-compromiso.
*   **Logging de Borrados Críticos:**
    *   Añadir un rastro de auditoría (Audit Log) más persistente para acciones `DELETE` en entidades core como [arcana](cci:7://file:///home/bulu/devel/tarot2/server/api/arcana:0:0-0:0) o [world_card](cci:7://file:///home/bulu/devel/tarot2/server/api/world_card:0:0-0:0), incluyendo quién lo borró y el estado anterior del registro.

## ⚪ WON'T (Fuera de alcance actual)
*   **Autenticación Multifactor (MFA):** No se considera necesaria para la fase actual del proyecto, pero se recomienda si el sistema maneja datos financieros o críticos en el futuro.
*   **Escaneo de Vulnerabilidades Automatizado en CI/CD:** No implementado por ahora, pero recomendable a largo plazo.

---

### Resumen de Invariantes de Seguridad Detectadas (Correctas):
*   ✅ **SQL Injection:** El uso de Kysely y plantillas `sql` con parámetros `${...}` es seguro. No se detectaron concatenaciones de strings vulnerables en consultas SQL.
*   ✅ **Subida de Archivos:** La lógica en [server/api/uploads/index.post.ts](cci:7://file:///home/bulu/devel/tarot2/server/api/uploads/index.post.ts:0:0-0:0) es robusta: valida tipos MIME, extensiones, tamaño y utiliza `sharp` para procesar la imagen (lo cual elimina metadatos maliciosos y verifica la integridad del archivo).
*   ✅ **JWT:** Se utiliza la librería `jose` con algoritmos modernos (`HS256`) y las cookies están configuradas como `httpOnly` y `secure` (en producción).

# Próximas Acciones Sugeridas
1.  **Modificar [01.auth.guard.ts](cci:7://file:///home/bulu/devel/tarot2/server/middleware/01.auth.guard.ts:0:0-0:0)** para incluir lógica de validación de propiedad (Self-service access).
2.  **Actualizar `schemas/user.ts`** añadiendo `.max()` a los campos de texto.
3.  **Evaluar `nuxt-security`** para resolver CSP y CSRF de forma nativa en Nuxt.

```
Security Audit Checklist:
☑ SQL Injection reviewed
☑ File Upload safety verified
☑ JWT Implementation checked
⚠ IDOR detected in User API (Needs fix)
⚠ XSS risk in Diff Modal (Needs review)
```

