import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const typesPath = path.join(rootDir, 'server/database/types.ts')
const schemasDir = path.join(rootDir, 'shared/schemas/entities')

// 1. Extraer Enums del archivo de tipos generado por Kysely
function extractDBEnums(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8')
  const enums = {}
  
  // Regex para capturar tipos de unión de strings (enums generados por kysely-codegen)
  const enumRegex = /export type (\w+) = (["'][\w| ]+["'](?: \| ["'][\w| ]+["'])*);/g
  let match
  while ((match = enumRegex.exec(content)) !== null) {
    const name = match[1]
    const values = match[2].split('|').map(v => v.trim().replace(/['"]/g, ''))
    enums[name] = values
  }
  return enums
}

// 2. Escanear esquemas Zod para encontrar validaciones de enums
function scanZodSchemas(dir) {
  const schemas = fs.readdirSync(dir).filter(f => f.endsWith('.ts'))
  const zodEnums = []

  for (const file of schemas) {
    const content = fs.readFileSync(path.join(dir, file), 'utf-8')
    // Regex simplificada para detectar .enum([...])
    const zodEnumRegex = /\.enum\(\[([\s\S]*?)\]\)/g
    let match
    while ((match = zodEnumRegex.exec(content)) !== null) {
      const values = match[1].split(',').map(v => v.trim().replace(/['"\n]/g, '')).filter(Boolean)
      zodEnums.push({ file, values })
    }
  }
  return zodEnums
}

console.log('🔍 Iniciando auditoría de sincronización Enums DB <-> Zod...')

const dbEnums = extractDBEnums(typesPath)
const zodEnums = scanZodSchemas(schemasDir)

console.log(`📊 Encontrados ${Object.keys(dbEnums).length} enums en DB y ${zodEnums.length} validaciones en Zod.\n`)

let issuesFound = 0

// Comparar (ejemplo simplificado: CardStatus es el más crítico)
if (dbEnums['CardStatus']) {
  console.log('📝 Validando CardStatus...')
  const dbValues = dbEnums['CardStatus']
  
  for (const zod of zodEnums) {
    // Si el schema parece validar un estado de carta
    if (zod.values.includes('draft') || zod.values.includes('published')) {
      const missingInZod = dbValues.filter(v => !zod.values.includes(v))
      const extraInZod = zod.values.filter(v => !dbValues.includes(v))
      
      if (missingInZod.length > 0 || extraInZod.length > 0) {
        issuesFound++
        console.log(`⚠️ Desincronización en ${zod.file}:`)
        if (missingInZod.length) console.log(`   - Faltan en Zod: ${missingInZod.join(', ')}`)
        if (extraInZod.length) console.log(`   - Sobran en Zod: ${extraInZod.join(', ')}`)
      }
    }
  }
}

if (issuesFound === 0) {
  console.log('✅ No se detectaron desincronizaciones críticas en los enums auditados.')
} else {
  console.log(`\n❌ Se encontraron ${issuesFound} archivos con desincronizaciones. ¡Actualiza los esquemas Zod!`)
  process.exit(1)
}
