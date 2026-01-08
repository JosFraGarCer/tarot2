import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const localesDir = path.join(rootDir, 'i18n/locales')

// 1. Cargar todas las llaves de los archivos de locales
function getLocalesKeys(filePath) {
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
  return { keys, content }
}

// 2. Escanear el código para encontrar llaves en uso
function findUsedKeys(dir) {
  const usedKeys = new Set()
  const files = fs.readdirSync(dir, { recursive: true })
  
  const i18nRegex = /(?:\$t|t|tt)\(['"]([^'"]+)['"]/g
  
  for (const file of files) {
    const filePath = path.join(dir, file)
    if (fs.statSync(filePath).isDirectory()) continue
    if (!['.vue', '.ts', '.js'].some(ext => file.endsWith(ext))) continue
    
    const content = fs.readFileSync(filePath, 'utf-8')
    let match
    while ((match = i18nRegex.exec(content)) !== null) {
      usedKeys.add(match[1])
    }
  }
  
  return usedKeys
}

console.log('🔍 Buscando llaves de i18n huérfanas...')

const { keys: esKeys, content: esContent } = getLocalesKeys(path.join(localesDir, 'es.json'))
const usedKeys = findUsedKeys(path.join(rootDir, 'app'))
const serverUsedKeys = findUsedKeys(path.join(rootDir, 'server'))

// Combinar llaves usadas
const allUsedKeys = new Set([...usedKeys, ...serverUsedKeys])

// Encontrar huérfanas
const orphans = [...esKeys].filter(key => !allUsedKeys.has(key))

if (orphans.length === 0) {
  console.log('✅ No se encontraron llaves huérfanas.')
} else {
  console.log(`⚠️ Se encontraron ${orphans.length} llaves huérfanas:`)
  orphans.sort().forEach(key => console.log(`  - ${key}`))
  
  console.log('\n💡 Nota: Algunas llaves pueden ser dinámicas y este script no las detecta.')
  console.log('Revisa la lista antes de borrarlas manualmente.')
}
