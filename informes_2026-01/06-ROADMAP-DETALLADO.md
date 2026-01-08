# Tarot2 - Roadmap Detallado de Mejoras 2026-01

## Hitos Alcanzados (Enero 2026)

### 🛡️ Seguridad y Autenticación
- **Protección IDOR**: Validación de propiedad en endpoints de usuario (`[id].get.ts`, `.patch.ts`, `.delete.ts`).
- **Sanitización de UI**: Eliminación de `v-html` en modales de comparación, sustituido por renderizado seguro línea por línea.
- **Hardening de API**: Integración de `nuxt-security` (CSRF, CSP), límites estrictos en Zod y Rate Limiting global.
- **Optimización JWT**: Singleton para codificación del secreto y uso de `getCookie` nativo de H3.

### ⚡ Performance y Backend
- **N+1 Solucionado**: Implementación de `eagerTags.ts` para carga masiva de etiquetas en entidades core.
- **Optimización de Auth**: Reducción de queries pesadas en el middleware de hidratación y carga perezosa de roles.
- **Estabilidad de DB**: Configuración de timeouts (`statement_timeout`) para evitar bloqueos del pool.

### 🏗️ Arquitectura Frontend
- **Refactorización de EntityBase**: Migración de lógica monolítica a `useEntityBaseContext`.
- **Formularios Robustos**: Eliminación de la introspección mágica de Zod en `FormModal.vue` en favor de presets declarativos.
- **UX Crítica**: Implementación de avisos de "Cambios no guardados" y bloqueo optimista real basado en `modified_at`.
- **Sincronización de URL**: Optimización de `useQuerySync` para evitar bucles de reactividad y clones profundos innecesarios.

## Cronograma General Actualizado

```
Fase 1: Estabilización y Fixes Críticos │✅ COMPLETADO│ 2 semanas
Fase 2: Escalabilidad y Caché (Redis)    │████████████│ 8 semanas
Fase 3: Refactor UI/UX Progresivo       │████████████│ 12 semanas
Fase 4: Herramientas y Automatización   │████████│    8 semanas
```

## Fase 2: Escalabilidad y Caché (Redis) - 8 semanas

### Semana 1-4: Integración de Redis y Sesiones
- **Implementación de Redis**: Configuración de Redis para gestión de sesiones y caché de corto plazo.
- **Revocación de Tokens**: Sistema de "lista negra" de JWT en Redis para cierres de sesión instantáneos.
- **Caché de Traducciones**: Mover el `translatableUpsert` y fallbacks a un sistema de caché en memoria para reducir latencia de DB.
- **Rate Limiting Distribuido**: Migrar el rate limit actual de memoria local a Redis para soporte multi-instancia.

### Semana 5-8: Optimización de Datos Complejos
- **Batching de Mutaciones**: Refactorizar `useBatchMutation` para manejar volúmenes altos de datos sin bloquear el Event Loop.
- **Caché de Relaciones**: Implementar TTL en previews de entidades y relaciones profundas (`world_card` -> `world` -> `arcana`).
- **Optimización de JSONB**: Límites de tamaño en payloads para evitar el "JSON Bloat" en `card_effects`.

## Fase 3: Refactor UI/UX Progresivo - 12 semanas

Debido a los arreglos estructurales realizados, la interfaz requiere una actualización para mejorar la consistencia y usabilidad.

### Semana 9-14: Estandarización de Componentes
- **Migración Legacy**: Eliminar definitivamente `EntityTableWrapper.vue` y `PreviewModal.vue`.
- **Jerarquía de Capas**: Estandarizar Z-Index y Focus Trap usando exclusivamente `USlideover` para inspección y `UModal` para diálogos.
- **Navegación Fluida**: Implementación de transiciones suaves y `flush: 'sync'` en sincronización de estado para evitar parpadeos.

### Semana 15-20: Feedback y Accesibilidad
- **Skeleton Loaders 2.0**: Implementar estados de carga granulares que no causen saltos de layout (CLS).
- **Consola de Errores UX**: Sistema de notificaciones que diferencie errores de red, validación y concurrencia.
- **Accesibilidad (A11y)**: Auditoría y corrección de roles ARIA y navegación por teclado en tablas complejas.

## Fase 4: Herramientas y Automatización (8 semanas)

### Semana 21-22: Herramientas de Desarrollo

#### Tarea 4.1: Pre-commit Hooks
**Duración**: 3 días
**Recursos**: 1 desarrollador
**Dependencias**: Ninguna
**Entregables**:
- Husky configuration
- Linting automático
- Tests pre-commit
- Commit message validation

```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npm run lint
npm run typecheck
npm run test:unit
```

#### Tarea 4.2: Bundle Analysis
**Duración**: 2 días
**Recursos**: 1 desarrollador
**Dependencias**: 2.1
**Entregables**:
- Webpack bundle analyzer
- Bundle size monitoring
- Dependency analysis
- Optimization recommendations

#### Tarea 4.3: Security Scanning
**Duración**: 3 días
**Recursos**: 1 desarrollador
**Dependencias**: Ninguna
**Entregables**:
- Dependency vulnerability scanning
- Code security analysis
- SAST integration
- Security reports

### Semana 23-24: CI/CD Pipeline

#### Tarea 4.4: Pipeline de Testing
**Duración**: 4 días
**Recursos**: 1 DevOps engineer
**Dependencias**: 3.1
**Entregables**:
- GitHub Actions workflow
- Automated testing pipeline
- Quality gates
- Test reporting

#### Tarea 4.5: Deployment Automatizado
**Duración**: 4 días
**Recursos**: 1 DevOps engineer
**Dependencias**: 3.4
**Entregables**:
- Automated deployment
- Environment management
- Rollback procedures
- Health checks

### Semana 25-26: Documentación Avanzada

#### Tarea 4.6: Storybook Setup
**Duración**: 5 días
**Recursos**: 1 desarrollador frontend
**Dependencias**: 1.6, 1.7
**Entregables**:
- Storybook configuration
- Component documentation
- Design system docs
- Interactive examples

#### Tarea 4.7: API Documentation
**Duración**: 4 días
**Recursos**: 1 technical writer
**Dependencias**: 1.8
**Entregables**:
- Swagger UI integration
- Interactive API docs
- Code examples
- SDK documentation

#### Tarea 4.8: Developer Onboarding
**Duración**: 3 días
**Recursos**: 1 technical writer
**Dependencias**: 3.6, 3.7
**Entregables**:
- Setup guide completo
- Architecture overview
- Development workflow
- Troubleshooting guide

## Recursos Necesarios

### Equipo Requerido
- **1 Arquitecto de Software** (tiempo completo)
- **2 Desarrolladores Frontend** (tiempo completo)
- **1 Desarrollador Backend** (tiempo completo)
- **1 DevOps Engineer** (50% tiempo)
- **1 Technical Writer** (50% tiempo)

### Herramientas y Licencias
- **GitHub Actions**: Incluido en GitHub
- **Storybook**: Open source
- **Sentry**: $26/mes para error tracking
- **Lighthouse CI**: Open source
- **Bundle Analyzer**: Open source

### Infraestructura
- **Staging Environment**: $50/mes
- **Monitoring Tools**: $100/mes
- **CDN**: $20/mes
- **Backup Storage**: $30/mes

**Total estimado**: $200/mes adicional

## Hitos y Entregables

### Hito 1 - Fin Fase 1 (Semana 8)
- ✅ Estabilización y Fixes Críticos Completados
- ✅ Refactorización de Arquitectura Core (EntityBase, FormModal)
- ✅ Optimización de Performance Backend (N+1, Auth)
- ✅ Hardening de Seguridad (IDOR, CSRF, CSP)

### Hito 2 - Fin Fase 2 (Semana 16)
- ✅ Integración de Redis funcional
- ✅ Sistema de caché de traducciones y sesiones
- ✅ Rate limiting distribuido

### Hito 3 - Fin Fase 3 (Semana 28)
- ✅ Interfaz UI/UX completamente renovada y estandarizada
- ✅ Eliminación de deuda técnica legacy (EntityTableWrapper, etc.)
- ✅ Accesibilidad y feedback de errores mejorados

### Hito 4 - Fin Fase 4 (Semana 36)
- ✅ CI/CD pipeline completo
- ✅ Herramientas de desarrollo configuradas
- ✅ Documentación avanzada completa
- ✅ Developer onboarding automatizado

## Métricas de Éxito

### Técnicas
- **Test Coverage**: 70% → 85%
- **Performance Score**: 75 → 90+
- **Bundle Size**: -25% reduction
- **Build Time**: -40% reduction

### Calidad
- **Bug Reports**: -60% reduction
- **Developer Satisfaction**: +40%
- **Onboarding Time**: -50%
- **Code Complexity**: -30%

### Negocio
- **Time to Market**: +25% faster feature delivery
- **Maintenance Cost**: -40% reduction
- **Developer Productivity**: +30% increase
- **System Reliability**: 99.9% uptime

## Riesgos y Mitigaciones

### Riesgos Técnicos
1. **Refactoring Complexity**
   - **Mitigación**: Implementación gradual con testing continuo
   - **Plan B**: Rollback automático en caso de problemas

2. **Performance Regression**
   - **Mitigación**: Performance budgets y monitoring continuo
   - **Plan B**: Revert a versiones optimizadas anteriores

3. **Testing Coverage Gaps**
   - **Mitigación**: Coverage reports automáticos
   - **Plan B**: Manual testing adicional

### Riesgos de Proyecto
1. **Resource Constraints**
   - **Mitigación**: Priorización clara de features
   - **Plan B**: Extensión de timeline

2. **Scope Creep**
   - **Mitigación**: Change management process
   - **Plan B**: Features opcionales para siguiente release

## Conclusión

Este roadmap proporciona una ruta clara y ejecutable para llevar Tarot2 de su estado actual (**8.49/10**) a un nivel de excelencia técnica (9.5/10). La implementación exitosa de este plan resultará en:

- **Mayor mantenibilidad** del código
- **Mejor experiencia de desarrollador**
- **Performance significativamente mejorada**
- **Sistema más robusto y escalable**

El timeline de 28 semanas es realista y permite implementar mejoras significativas sin comprometer la estabilidad del sistema en producción.

---

*Roadmap detallado actualizado el 8 de enero de 2026*
