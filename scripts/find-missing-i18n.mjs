import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const localesDir = path.join(rootDir, 'i18n/locales')

// 1. Cargar todas las llaves de los archivos de locales
function getLocalesKeys(filePath) {
  if (!fs.existsSync(filePath)) return new Set()
  const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  const keys = new Set()
  
  function extract(obj, prefix = '') {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key
      if (typeof value === 'object' && value !== null) {
        extract(value, fullKey)
      } else {
        keys.add(fullKey)
      }
    }
  }
  
  extract(content)
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

console.log('🔍 Buscando llaves de i18n faltantes en los locales...')

const esKeys = getLocalesKeys(path.join(localesDir, 'es.json'))
const enKeys = getLocalesKeys(path.join(localesDir, 'en.json'))

const appUsedKeys = findUsedKeys(path.join(rootDir, 'app'))
const serverUsedKeys = findUsedKeys(path.join(rootDir, 'server'))

// Combinar todas las llaves usadas en el código
const allUsedKeys = new Set([...appUsedKeys, ...serverUsedKeys])

const missingInEs = [...allUsedKeys].filter(key => !esKeys.has(key))
const missingInEn = [...allUsedKeys].filter(key => !enKeys.has(key))

console.log(`\n📊 Resumen de auditoría:`)
console.log(`- Llaves detectadas en el código: ${allUsedKeys.size}`)
console.log(`- Llaves en es.json: ${esKeys.size}`)
console.log(`- Llaves en en.json: ${enKeys.size}\n`)

if (missingInEs.length === 0 && missingInEn.length === 0) {
  console.log('✅ ¡Excelente! No faltan llaves en ningún idioma.')
} else {
  if (missingInEs.length > 0) {
    console.log(`❌ Faltan ${missingInEs.length} llaves en es.json:`)
    missingInEs.sort().forEach(key => console.log(`  - ${key}`))
    console.log('')
  }
  
  if (missingInEn.length > 0) {
    console.log(`❌ Faltan ${missingInEn.length} llaves en en.json:`)
    missingInEn.sort().forEach(key => console.log(`  - ${key}`))
    console.log('')
  }

  console.log('💡 Nota: Algunas llaves pueden ser detectadas por error si el nombre coincide con funciones comunes.')
}
