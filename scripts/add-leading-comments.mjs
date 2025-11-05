/**
 * Adds leading path comments to .ts and .vue files under /app and /server.
 * Usage: node scripts/add-leading-comments.mjs
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ROOT_DIR = path.resolve(__dirname, '..')
const TARGET_DIRS = ['app', 'server']
const TS_EXT = '.ts'
const VUE_EXT = '.vue'

async function main() {
  const files = []
  for (const dir of TARGET_DIRS) {
    const absoluteDir = path.join(ROOT_DIR, dir)
    await collectFiles(absoluteDir, files)
  }

  let updated = 0
  let skipped = 0

  for (const file of files) {
    const relative = path.relative(ROOT_DIR, file).replace(/\\/g, '/')
    const expectedComment = expectedForExtension(file, relative)

    if (!expectedComment) {
      skipped += 1
      continue
    }

    const original = await fs.readFile(file, 'utf8')
    const withoutBom = original.replace(/^\uFEFF/, '')
    const lines = withoutBom.split(/\r?\n/)
    const firstLine = lines[0] ?? ''

    if (firstLine.trim() === expectedComment) {
      skipped += 1
      continue
    }

    const updatedContent = `${expectedComment}\n${withoutBom}`
    await fs.writeFile(file, updatedContent, 'utf8')
    updated += 1
    console.log(`Updated: ${relative}`)
  }

  console.log(`Done. Updated ${updated} file(s), skipped ${skipped} file(s).`)
}

async function collectFiles(current, results) {
  let entries
  try {
    entries = await fs.readdir(current, { withFileTypes: true })
  } catch (error) {
    if (error.code === 'ENOENT') return
    throw error
  }

  for (const entry of entries) {
    const entryPath = path.join(current, entry.name)

    if (entry.isDirectory()) {
      await collectFiles(entryPath, results)
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name)
      if (ext === TS_EXT || ext === VUE_EXT) {
        results.push(entryPath)
      }
    }
  }
}

function expectedForExtension(filePath, relative) {
  const ext = path.extname(filePath)
  if (ext === TS_EXT) {
    return `// ${relative}`
  }
  if (ext === VUE_EXT) {
    return `<!-- ${relative} -->`
  }
  return null
}

try {
  await main()
} catch (error) {
  console.error(error)
  process.exitCode = 1
}
