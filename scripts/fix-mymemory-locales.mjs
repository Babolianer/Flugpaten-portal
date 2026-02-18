/**
 * Ersetzt in allen Locale-Dateien (en, fr, es, it, pl) jeden Eintrag, der eine
 * MyMemory-Warnung enthält, durch den entsprechenden deutschen Text aus de.json.
 * So wird MyMemory vollständig aus dem Frontend entfernt (keine API mehr, keine
 * alten Warn-Texte in den JSON-Dateien).
 *
 * Ausführen: node scripts/fix-mymemory-locales.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const LOCALES_DIR = join(__dirname, '..', 'locales')
const SOURCE_FILE = join(LOCALES_DIR, 'de.json')
const TARGET_LOCALES = ['en', 'fr', 'es', 'it', 'pl']

function isMyMemoryWarning(str) {
  if (typeof str !== 'string') return false
  const upper = str.toUpperCase()
  return (
    upper.includes('MYMEMORY') ||
    upper.includes('NEXT AVAILABLE') ||
    upper.includes('USAGELIMITS') ||
    upper.includes('VISIT HTTPS')
  )
}

function replaceMyMemoryInObject(localeObj, deObj) {
  if (!localeObj || typeof localeObj !== 'object') return
  for (const key of Object.keys(localeObj)) {
    const locVal = localeObj[key]
    const deVal = deObj?.[key]
    if (typeof locVal === 'string') {
      if (isMyMemoryWarning(locVal) && typeof deVal === 'string') {
        localeObj[key] = deVal
      }
    } else if (typeof locVal === 'object' && locVal !== null && !Array.isArray(locVal)) {
      replaceMyMemoryInObject(locVal, deVal)
    }
  }
}

function main() {
  const de = JSON.parse(readFileSync(SOURCE_FILE, 'utf-8'))

  for (const locale of TARGET_LOCALES) {
    const path = join(LOCALES_DIR, `${locale}.json`)
    const data = JSON.parse(readFileSync(path, 'utf-8'))
    replaceMyMemoryInObject(data, de)
    writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf-8')
    console.log(`Bereinigt: ${locale}.json`)
  }

  console.log('Fertig. Alle MyMemory-Texte in Locale-Dateien durch deutsche Quelle ersetzt.')
}

main()
