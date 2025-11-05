import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const localesDir = path.resolve(__dirname, '../i18n/locales')

function sortKeysDeep(obj) {
  if (Array.isArray(obj)) return obj.map(sortKeysDeep)
  if (obj && typeof obj === 'object') {
    return Object.keys(obj)
      .sort((a, b) => a.localeCompare(b))
      .reduce((acc, key) => {
        acc[key] = sortKeysDeep(obj[key])
        return acc
      }, {})
  }
  return obj
}

function sortFile(file) {
  const full = path.join(localesDir, file)
  const raw = fs.readFileSync(full, 'utf8')
  const json = JSON.parse(raw)
  const sorted = sortKeysDeep(json)
  const out = JSON.stringify(sorted, null, 2) + '\n'
  fs.writeFileSync(full, out, 'utf8')
  console.log(`Sorted: ${file}`)
}

for (const file of ['en.json', 'es.json']) {
  sortFile(file)
}
