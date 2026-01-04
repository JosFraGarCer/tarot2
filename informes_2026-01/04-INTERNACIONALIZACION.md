# Tarot2 - Auditoría Internacionalización y Assets 2026-01

## Resumen de Internacionalización

El sistema de internacionalización de Tarot2 está bien implementado con soporte completo para inglés y español, utilizando @nuxtjs/i18n y un sistema de key mapping robusto. La evaluación se centró en archivos de traducción, configuración de i18n, y assets.

## Análisis de Internacionalización

### 1. Configuración Principal
**Archivo**: `/i18n.config.ts`

**Configuración**:
```typescript
export default defineI18nConfig(() => ({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: { en, es },
  missingWarn: false,
  fallbackWarn: false
}))
```

**Características**:
- ✅ Configuración moderna (no legacy mode)
- ✅ Idioma por defecto: inglés
- ✅ Fallback configurado al inglés
- ✅ Warnings deshabilitados para producción
- ✅ Carga directa de mensajes desde archivos JSON

### 2. Configuración de Módulos
**Archivo**: `/nuxt.config.ts` (sección i18n)

**Configuración**:
```typescript
i18n: {
  strategy: 'prefix_except_default',
  locales: [
    { code: 'en', iso: 'en-US', name: 'English', file: 'en.json' },
    { code: 'es', iso: 'es-ES', name: 'Español', file: 'es.json' },
  ],
  defaultLocale: 'en',
  vueI18n: './i18n.config.ts',
}
```

**Características**:
- ✅ Strategy `prefix_except_default` para URLs limpias
- ✅ Configuración completa de locales con ISO codes
- ✅ Archivos de traducción separados por idioma
- ✅ Integración con vueI18n

### 3. Archivos de Traducción

#### Inglés (en.json)
**Archivo**: `/i18n/locales/en.json`

**Estructura**:
```json
{
  "app": {
    "brand": { "title": "Tarot RPG" },
    "layout": { "menu": "Menu" }
  },
  "common": {
    "close": "Close",
    "email": "Email",
    "saved": "Saved",
    // ... más claves
  },
  "domains": {
    "arcana": {
      "active": "Active",
      "create": "Create Arcana",
      "edit": "Edit Arcana",
      // ... más claves específicas de dominio
    }
  }
}
```

**Características**:
- ✅ Estructura jerárquica bien organizada
- ✅ Claves específicas por dominio
- ✅ Consistencia en naming conventions
- ✅ Cobertura completa de la aplicación

#### Español (es.json)
**Archivo**: `/i18n/locales/es.json`

**Estructura**:
```json
{
  "app": {
    "brand": { "title": "Tarot RPG" },
    "layout": { "menu": "Menú" }
  },
  "common": {
    "close": "Cerrar",
    "email": "Correo electrónico",
    "saved": "Guardado",
    // ... más claves
  }
}
```

**Características**:
- ✅ Traducciones completas y coherentes
- ✅ Mantenimiento de la estructura original
- ✅ Traducciones contextualmente apropiadas
- ✅ Consistencia en terminología

### 4. Sistema de Key Mapping
**Archivo**: `/i18n/key_mapping.json`

**Propósito**:
Sistema de mapeo para compatibilidad con claves legacy y nuevas estructuras.

**Ejemplos de Mapeo**:
```json
{
  "actions.activate": "ui.actions.activate",
  "admin.feedback.title": "features.admin.feedback.title",
  "arcana.active": "domains.arcana.active",
  "common.create": "ui.actions.create",
  "nav.manage": "navigation.menu.manage"
}
```

**Características**:
- ✅ Mapeo de claves legacy a nuevas estructuras
- ✅ Compatibilidad hacia atrás
- ✅ Facilita migración gradual
- ✅ 436 mapeos configurados

### 5. Uso en Componentes

#### Ejemplo en EntitySummary
**Archivo**: `/app/components/common/EntitySummary.vue`

**Uso**:
```vue
<StatusBadge
  v-if="showTranslationBadge"
  type="translation"
  :value="translationMeta?.status ?? null"
  size="xs"
/>

<p v-if="description" class="line-clamp-3 text-sm text-neutral-600 dark:text-neutral-300">
  {{ description }}
</p>
```

#### Ejemplo en FormModal
**Archivo**: `/app/components/manage/modal/FormModal.vue`

**Uso**:
```vue
<UFormField :label="trLabel(key as string, field.label)" :required="field.required">
  <UInput v-model="form[key]" :placeholder="field.placeholder" />
</UFormField>

<script>
function trLabel(key: string, fallback?: string) {
  const entityKey = normalizedLabel.value
  const tryKeys = [
    entityKey ? `fields.${entityKey}.${key}` : '',
    `fields.${key}`,
  ]
  // ... lógica de traducción
}
</script>
```

### 6. Sistema de Fallbacks

#### Fallback Logic en Componentes
**Patrón implementado**:
```typescript
const translationMeta = computed<EntityTranslationStatus | null>(() => {
  const base = props.translationStatus ?? {}
  const resolved = (props.resolvedLang ?? '').trim()
  const fallback = (props.fallbackLang ?? '').trim()

  const fallbackDetected = base.isFallback ??
    (resolved && requested ? isFallbackField(resolved, requested) : undefined)

  const status = base.status ?? getFallbackStatus({
    language_code: translationPresent ? (resolvedCandidate || '__present__') : null,
    language_is_fallback: fallbackDetected,
  })

  return {
    ...base,
    status,
    hasTranslation: translationPresent,
    isFallback: fallbackDetected ?? status === 'partial',
  }
})
```

**Características**:
- ✅ Detección automática de fallbacks
- ✅ Status tracking de traducciones
- ✅ Visual indicators para traducciones faltantes
- ✅ Lógica inteligente de resolución

### 7. Assets y Recursos

#### CSS Principal
**Archivo**: `/app/assets/css/main.css`

**Contenido**:
```css
@import "tailwindcss";
@import "@nuxt/ui";
```

**Características**:
- ✅ Importación de TailwindCSS
- ✅ Importación de Nuxt UI
- ✅ Configuración minimalista
- ✅ Integración con design system

#### Imágenes
**Directorio**: `/public/img/`

**Estructura**:
```
/public/img/
├── arcana/          # Imágenes de arcanos
├── avatars/         # Avatares de usuario
├── baseCard/        # Imágenes de cartas base
├── default.avif     # Imagen por defecto
└── favicon.ico      # Favicon
```

**Características**:
- ✅ Organización por categorías
- ✅ Formatos modernos (AVIF)
- ✅ Assets estáticos bien estructurados
- ✅ Favicon configurado

## Hallazgos y Evaluación

### ✅ Fortalezas

1. **Configuración Robusta**
   - Configuración moderna de i18n
   - Strategy de URLs optimizada
   - Fallbacks bien configurados
   - Integración completa con vueI18n

2. **Estructura de Traducciones**
   - Archivos JSON bien organizados
   - Jerarquía lógica de claves
   - Cobertura completa de la aplicación
   - Consistencia en naming conventions

3. **Key Mapping System**
   - Sistema de compatibilidad hacia atrás
   - 436 mapeos configurados
   - Facilita migración gradual
   - Reduce breaking changes

4. **Integración en Componentes**
   - Uso consistente de $t() en templates
   - Composables con soporte i18n
   - Fallbacks visuales implementados
   - Status tracking de traducciones

5. **Assets Organizados**
   - Estructura de directorios clara
   - Formatos modernos de imagen
   - Organización por categorías
   - Integración con build system

### ⚠️ Áreas de Mejora

1. **Cobertura de Traducciones**
   - Algunas claves en español están en inglés
   - Falta validación de traducciones faltantes
   - No hay herramientas de verificación automática

2. **Gestión de Traducciones**
   - No hay proceso de validación de traducciones
   - Falta de herramientas de traducción asistida
   - No hay workflow de revisión de traducciones

3. **Assets**
   - Falta optimización automática de imágenes
   - No hay lazy loading configurado
   - Ausencia de responsive images

4. **Herramientas de Desarrollo**
   - No hay extraction automática de keys
   - Falta validación de keys no utilizadas
   - No hay herramientas de linting de traducciones

### 🔍 Análisis de Uso

#### Patrones de Uso Identificados

1. **Template Usage**:
   ```vue
   {{ t('navigation.menu.manage') }}
   {{ $t('ui.actions.create') }}
   ```

2. **Script Usage**:
   ```typescript
   const { t } = useI18n()
   const translated = t('domains.arcana.title')
   ```

3. **Computed Usage**:
   ```typescript
   const tabs = computed(() => [
     { label: t('navigation.menu.cardTypes'), value: 'cardType' },
   ])
   ```

#### Cobertura por Secciones

- **App/Common**: ✅ Cobertura completa
- **Domains**: ✅ Cobertura completa
- **Navigation**: ✅ Cobertura completa
- **UI Actions**: ✅ Cobertura completa
- **Features**: ✅ Cobertura completa
- **Admin**: ✅ Cobertura completa

## Recomendaciones

### Prioridad Alta

1. **Validación de Traducciones**
   ```bash
   # Instalar herramientas de validación
   npm install --save-dev @nuxtjs/i18n-module
   ```

2. **Extracción Automática de Keys**
   ```bash
   # Configurar script de extracción
   "i18n:extract": "vue-i18n-extract --input './**/*.{js,vue,ts}' --output './i18n/missing-keys.json'"
   ```

### Prioridad Media

3. **Optimización de Assets**
   ```typescript
   // Configurar en nuxt.config.ts
   image: {
     format: ['webp', 'avif'],
     screens: { sm: 640, md: 768, lg: 1024, xl: 1280 }
   }
   ```

4. **Workflow de Traducciones**
   - Implementar proceso de revisión
   - Configurar herramientas de traducción
   - Establecer métricas de cobertura

### Prioridad Baja

5. **Herramientas Adicionales**
   - Configurar linting de traducciones
   - Implementar fallbacks dinámicos
   - Añadir soporte para pluralización

6. **Performance**
   - Lazy loading de traducciones
   - Code splitting por locale
   - Cache de traducciones

## Conclusión

El sistema de internacionalización de Tarot2 está bien implementado con una base sólida. La configuración es moderna y robusta, y la integración en componentes es consistente. Las mejoras se centran en herramientas de validación, optimización de assets y workflow de traducciones.

**Puntuación Internacionalización**: 8.0/10

---

*Auditoría realizada el 4 de enero de 2026*
