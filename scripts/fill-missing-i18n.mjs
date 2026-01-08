import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const localesDir = path.join(rootDir, 'i18n/locales')

// 1. Cargar todas las llaves de los archivos de locales
function getLocalesData(filePath) {
  if (!fs.existsSync(filePath)) return {}
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
}

function extractKeys(obj, prefix = '', keys = new Set()) {
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'object' && value !== null) {
      extractKeys(value, fullKey, keys)
    } else {
      keys.add(fullKey)
    }
  }
  return keys
}

// 2. Escanear el código para encontrar llaves en uso
function findUsedKeys(dir) {
  const usedKeys = new Set()
  const files = fs.readdirSync(dir, { recursive: true })
  
  // Regex para detectar $t('key'), t('key'), tt('key'), etc.
  const i18nRegex = /(?:\$t|t|tt)\(['"]([^'"]+)['"]/g
  // Regex para detectar descriptionKey: 'key' o labelKey: 'key'
  const objectKeyRegex = /(?:descriptionKey|labelKey):\s*['"]([^'"]+)['"]/g
  
  for (const file of files) {
    const filePath = path.join(dir, file)
    if (fs.statSync(filePath).isDirectory()) continue
    if (!['.vue', '.ts', '.js'].some(ext => file.endsWith(ext))) continue
    
    const content = fs.readFileSync(filePath, 'utf-8')
    let match
    while ((match = i18nRegex.exec(content)) !== null) {
      const key = match[1]
      if (!key.includes('${') && !key.includes(':') && !key.includes(' ') && key.includes('.')) {
        usedKeys.add(key)
      }
    }
    
    // Nueva detección para llaves en objetos de navegación
    while ((match = objectKeyRegex.exec(content)) !== null) {
      const key = match[1]
      if (!key.includes('${') && key.includes('.')) {
        usedKeys.add(key)
      }
    }
  }
  
  return usedKeys
}

// 3. Añadir llaves faltantes al objeto de locale preservando estructura
function setDeep(obj, path, value) {
  const parts = path.split('.')
  let current = obj
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]
    if (!(part in current)) {
      current[part] = {}
    }
    current = current[part]
  }
  const lastPart = parts[parts.length - 1]
  if (!(lastPart in current)) {
    current[lastPart] = value
  }
}

function fillMissingForLocale(localeFile) {
  const filePath = path.join(localesDir, localeFile)
  const data = getLocalesData(filePath)
  const currentKeys = extractKeys(data)
  
  const appUsedKeys = findUsedKeys(path.join(rootDir, 'app'))
  const serverUsedKeys = findUsedKeys(path.join(rootDir, 'server'))
  const allUsedKeys = new Set([...appUsedKeys, ...serverUsedKeys])
  
  const missingKeys = [...allUsedKeys].filter(key => !currentKeys.has(key))
  
  if (missingKeys.length === 0) {
    console.log(`✅ No faltan llaves en ${localeFile}`)
    return false
  }
  
  console.log(`📝 Añadiendo ${missingKeys.length} llaves faltantes a ${localeFile}...`)
  missingKeys.sort().forEach(key => {
    // Generar un valor por defecto legible (el final de la llave capitalizado)
    const defaultValue = key.split('.').pop().replace(/_/g, ' ')
    setDeep(data, key, `[MISSING] ${defaultValue}`)
  })
  
  // Guardar archivo formateado
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8')
  return true
}

console.log('🚀 Iniciando autorelleno de llaves i18n faltantes...')

const esChanged = fillMissingForLocale('es.json')
const enChanged = fillMissingForLocale('en.json')

if (esChanged || enChanged) {
  console.log('\n✨ Proceso completado. Revisa los archivos en i18n/locales/ para traducir los valores marcados como [MISSING].')
} else {
  console.log('\n👍 Nada que actualizar.')
}
