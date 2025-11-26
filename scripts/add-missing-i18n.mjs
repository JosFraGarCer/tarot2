// script/add-missing-i18n.mjs
// Agrega automáticamente las claves faltantes a los archivos de idioma
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ROOT = path.resolve(__dirname, '..')
const LOCALES = path.join(ROOT, 'i18n/locales')

// Leer claves faltantes del script anterior
function getMissingKeys() {
  // Ejecutar missed-i18n.mjs y capturar salida
  const output = execSync('node scripts/missed-i18n.mjs', { encoding: 'utf8', cwd: ROOT })
  
  const lines = output.split('\n')
  const missing = { en: [], es: [] }
  let currentLocale = null
  
  for (const line of lines) {
    if (line.includes('FALTANTES en en.json:')) {
      currentLocale = 'en'
      continue
    }
    if (line.includes('FALTANTES en es.json:')) {
      currentLocale = 'es'
      continue
    }
    if (line.startsWith('  - ') && currentLocale) {
      const key = line.slice(4)
      if (key && key.length > 1) {
        missing[currentLocale].push(key)
      }
    }
  }
  
  return missing
}

// Construir objeto anidado desde clave plana
function buildNested(keys) {
  const result = {}
  for (const key of keys) {
    const parts = key.split('.')
    let current = result
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) current[parts[i]] = {}
      current = current[parts[i]]
    }
    const lastPart = parts[parts.length - 1]
    if (!current[lastPart]) {
      current[lastPart] = `TODO: Translate ${key}`
    }
  }
  return result
}

// Leer JSON existente
function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return {}
  }
}

// Escribir JSON con formato
function writeJson(file, obj) {
  const json = JSON.stringify(obj, null, 2) + '\n'
  fs.writeFileSync(file, json, 'utf8')
}

// Mezclar objetos de forma profunda
function deepMerge(target, source) {
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!target[key] || typeof target[key] !== 'object') {
        target[key] = {}
      }
      deepMerge(target[key], source[key])
    } else {
      target[key] = source[key]
    }
  }
}

// Main
console.log('🔍 Buscando claves faltantes...')
const missing = getMissingKeys()

if (missing.en.length === 0 && missing.es.length === 0) {
  console.log('✅ No hay claves faltantes')
  process.exit(0)
}

console.log(`📝 Claves faltantes: en=${missing.en.length}, es=${missing.es.length}`)

// Procesar en.json
if (missing.en.length > 0) {
  console.log('\n📄 Procesando en.json...')
  const enFile = path.join(LOCALES, 'en.json')
  const existing = readJson(enFile)
  const toAdd = buildNested(missing.en)
  deepMerge(existing, toAdd)
  writeJson(enFile, existing)
  console.log(`✅ Agregadas ${missing.en.length} claves a en.json`)
}

// Procesar es.json
if (missing.es.length > 0) {
  console.log('\n📄 Procesando es.json...')
  const esFile = path.join(LOCALES, 'es.json')
  const existing = readJson(esFile)
  const toAdd = buildNested(missing.es)
  deepMerge(existing, toAdd)
  writeJson(esFile, existing)
  console.log(`✅ Agregadas ${missing.es.length} claves a es.json`)
}

console.log('\n✨ Listo! Ahora puedes traducir las claves marcadas como TODO:')
