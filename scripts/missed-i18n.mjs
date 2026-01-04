// script/missed-i18n.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 📂 Rutas a revisar
const ROOT = path.resolve(__dirname, '..')
const LOCALES = path.join(ROOT, 'i18n/locales')

// Archivos donde buscar claves
const SCAN_DIRS = [
  path.join(ROOT, 'pages'),
  path.join(ROOT, 'components'),
  path.join(ROOT, 'layouts'),
  path.join(ROOT, 'plugins'),
  path.join(ROOT, 'utils'), // Agregar utils para encontrar labelKey
  ROOT // para app.vue, nuxt.config etc.
]

// regex que captura claves t('...'), $t("..."), v-t="'...", y también tt('...', fallback)
// Captura claves dinámicas como las usadas en labelKey: 'ui.status.draft' y label: 'fields.name'
const KEY_REGEX = /(?:\$t|t|i18n\.t|tt)\(\s*['"`]([a-zA-Z][a-zA-Z0-9_-]*(?:\.[a-zA-Z][a-zA-Z0-9_-]*)*)['"`]\s*(?:,\s*['"`][^'"`]*['"`]\s*)?\)|v-t=['"`]([a-zA-Z][a-zA-Z0-9_-]*(?:\.[a-zA-Z][a-zA-Z0-9_-]*)*)['"`]|labelKey:\s*['"`]([a-zA-Z][a-zA-Z0-9_-]*(?:\.[a-zA-Z][a-zA-Z0-9_-]*)*)['"`]|label:\s*['"`]([a-zA-Z][a-zA-Z0-9_-]*(?:\.[a-zA-Z][a-zA-Z0-9_-]*)*)['"`]/g

// 🔍 Recorrer directorios
function getAllFiles(dir) {
  if (!fs.existsSync(dir)) return []
  let results = []
  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file)
    const relative = path.relative(ROOT, full)
    
    // Ignorar node_modules, .nuxt, .output, dist, y archivos de idioma
    if (relative.startsWith('node_modules') || relative.startsWith('.nuxt') || 
        relative.startsWith('.output') || relative.startsWith('dist') ||
        relative.includes('i18n/locales')) {
      continue
    }
    
    const stat = fs.statSync(full)
    if (stat.isDirectory()) {
      results = results.concat(getAllFiles(full))
    } else if (/\.(vue|js|ts|mjs)$/.test(file)) {
      results.push(full)
    }
  }
  return results
}

// 🧠 Leer JSON como objeto plano
function flatten(obj, prefix = '') {
  let out = {}
  for (const key in obj) {
    const value = obj[key]
    const full = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(out, flatten(value, full))
    } else {
      out[full] = value
    }
  }
  return out
}

// 📤 Cargar los archivos de idioma
function loadLocale(file) {
  const full = path.join(LOCALES, file)
  const raw = fs.readFileSync(full, 'utf8')
  return flatten(JSON.parse(raw))
}

// 👀 Extraer claves del código
function extractKeysFromFile(file) {
  const content = fs.readFileSync(file, 'utf8')
  const keys = []
  let match
  while ((match = KEY_REGEX.exec(content)) !== null) {
    const key = match[1] || match[2] || match[3] || match[4] // Ahora tenemos 4 grupos de captura
    // Ignorar claves demasiado cortas o que parezcan inválidas
    if (key && key.length > 1 && !/^[a-z]$/.test(key) && !/^[;=?]$/.test(key)) {
      keys.push(key)
    }
  }
  return keys
}

// 🚀 Ejecutar
const files = SCAN_DIRS.flatMap(getAllFiles)
const usedKeys = new Set(files.flatMap(extractKeysFromFile))

// 🤖 Generar claves dinámicas de campos de entidad conocidas
// Estas claves se construyen en tiempo de ejecución (ej: fields.card_type.name) y no se detectan por regex
const KNOWN_ENTITIES = ['arcana', 'base_card', 'card_type', 'facet', 'skill', 'world', 'tag']
const COMMON_FIELDS = [
  'name', 'code', 'description', 'short_text', 'is_active', 'sort', 'status', 
  'image', 'language_code', 'created_by', 'content_version_id', 'category', 'parent_id',
  'facet_id', 'arcana_id', 'card_type_id', 'effects', 'legacy_effects'
]

KNOWN_ENTITIES.forEach(entity => {
  COMMON_FIELDS.forEach(field => {
    usedKeys.add(`fields.${entity}.${field}`)
  })
})

console.log(`🔎 Claves encontradas en código (incluyendo dinámicas): ${usedKeys.size}`)
console.log(`📁 Archivos escaneados: ${files.length}`)

const locales = {
  en: loadLocale('en.json'),
  es: loadLocale('es.json')
}

function findMissing(localeObj) {
  return [...usedKeys].filter(key => !(key in localeObj))
}

const missing = {
  en: findMissing(locales.en),
  es: findMissing(locales.es)
}

// 📊 Estadísticas
console.log(`\n📊 Estadísticas:`)
console.log(`  - Claves únicas en código: ${usedKeys.size}`)
console.log(`  - Claves en en.json: ${Object.keys(locales.en).length}`)
console.log(`  - Claves en es.json: ${Object.keys(locales.es).length}`)
console.log(`  - Faltantes en en.json: ${missing.en.length}`)
console.log(`  - Faltantes en es.json: ${missing.es.length}`)

// 📝 Output
if (missing.en.length > 0) {
  console.log('\n⛔ FALTANTES en en.json:')
  missing.en.forEach(k => console.log('  -', k))
} else {
  console.log('\n✅ en.json está completo')
}

if (missing.es.length > 0) {
  console.log('\n⛔ FALTANTES en es.json:')
  missing.es.forEach(k => console.log('  -', k))
} else {
  console.log('\n✅ es.json está completo')
}

// 🔄 Claves que podrían sobrar (opcional)
const enKeys = new Set(Object.keys(locales.en))
const esKeys = new Set(Object.keys(locales.es))
const unusedEn = [...enKeys].filter(key => !usedKeys.has(key))
const unusedEs = [...esKeys].filter(key => !usedKeys.has(key))

if (unusedEn.length > 0) {
  console.log('\n🗑️  Posiblemente sin uso en en.json (revisar):')
  unusedEn.slice(0, 10).forEach(k => console.log('  -', k))
  if (unusedEn.length > 10) console.log(`  ... y ${unusedEn.length - 10} más`)
}

if (unusedEs.length > 0) {
  console.log('\n🗑️  Posiblemente sin uso en es.json (revisar):')
  unusedEs.slice(0, 10).forEach(k => console.log('  -', k))
  if (unusedEs.length > 10) console.log(`  ... y ${unusedEs.length - 10} más`)
}

console.log('\n✨ Listo!')
