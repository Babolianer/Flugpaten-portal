/**
 * Merges missing keys from source locale JSON into target (deep).
 * Usage: node scripts/merge-missing-locale-keys.mjs <source.json> <target.json> [target2.json ...]
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
}

function deepMergeMissing(target, source) {
  if (!isPlainObject(target) || !isPlainObject(source)) return target
  for (const [k, sv] of Object.entries(source)) {
    if (!(k in target)) {
      target[k] = JSON.parse(JSON.stringify(sv))
      continue
    }
    if (isPlainObject(target[k]) && isPlainObject(sv)) {
      deepMergeMissing(target[k], sv)
    }
  }
  return target
}

const args = process.argv.slice(2)
if (args.length < 2) {
  console.error('Usage: node scripts/merge-missing-locale-keys.mjs <source> <target> [...]')
  process.exit(1)
}

const sourcePath = path.isAbsolute(args[0]) ? args[0] : path.join(root, args[0])
const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'))

for (const rel of args.slice(1)) {
  const p = path.isAbsolute(rel) ? rel : path.join(root, rel)
  const target = JSON.parse(fs.readFileSync(p, 'utf8'))
  deepMergeMissing(target, source)
  fs.writeFileSync(p, JSON.stringify(target, null, 2) + '\n', 'utf8')
  console.log('Updated', p)
}
