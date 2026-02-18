/**
 * Übersetzt alle Texte aus locales/de.json in alle anderen Sprachen (en, fr, es, it, pl)
 * und schreibt locales/{code}.json. Quelle = Deutsch. Nach Änderungen an de.json ausführen:
 *   node scripts/translate-locales.mjs
 * Nutzt nur LibreTranslate (dauerhaft kostenlos self-hosted oder mit LIBRETRANSLATE_API_KEY).
 * MyMemory wird nicht genutzt – dessen Limit-Meldungen dürfen nicht in die Locale-Dateien.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const LOCALES_DIR = join(__dirname, '..', 'locales')
const SOURCE_FILE = join(LOCALES_DIR, 'de.json')
const TARGET_LOCALES = ['en', 'fr', 'es', 'it', 'pl']

const LIBRE = 'https://libretranslate.com/translate'

function flatten(obj, prefix = '') {
  const out = {}
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(out, flatten(v, key))
    } else if (typeof v === 'string') {
      out[key] = v
    }
  }
  return out
}

function unflatten(flat) {
  const out = {}
  for (const [path, value] of Object.entries(flat)) {
    const parts = path.split('.')
    let current = out
    for (let i = 0; i < parts.length - 1; i++) {
      const p = parts[i]
      if (!(p in current)) current[p] = {}
      current = current[p]
    }
    current[parts[parts.length - 1]] = value
  }
  return out
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

/** Prüft, ob der Text wie eine API-Fehlermeldung aussieht (z. B. MyMemory-Warnung). */
function looksLikeErrorMessage(str) {
  if (typeof str !== 'string') return true
  const upper = str.toUpperCase()
  return (
    upper.includes('MYMEMORY') ||
    upper.includes('WARNING') ||
    upper.includes('NEXT AVAILABLE') ||
    upper.includes('USAGELIMITS') ||
    upper.includes('VISIT HTTPS')
  )
}

async function translateWithLibre(text, targetLang, sourceLang = 'de', apiKey) {
  const body = { q: text, source: sourceLang, target: targetLang, format: 'text' }
  if (apiKey) body.api_key = apiKey
  const res = await fetch(LIBRE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) return null
  const data = await res.json()
  const translated = data?.translatedText?.trim()
  if (translated && !looksLikeErrorMessage(translated)) return translated
  return null
}

async function translate(text, targetLang, sourceLang = 'de', librecKey) {
  try {
    const t = await translateWithLibre(text, targetLang, sourceLang, librecKey)
    if (t) return t
  } catch (_) {}
  return text
}

async function main() {
  const deRaw = readFileSync(SOURCE_FILE, 'utf-8')
  const de = JSON.parse(deRaw)
  const flat = flatten(de)

  const librecKey = process.env.LIBRETRANSLATE_API_KEY || ''

  for (const locale of TARGET_LOCALES) {
    console.log(`Übersetze nach ${locale}...`)
    const result = {}
    const entries = Object.entries(flat)
    for (let i = 0; i < entries.length; i++) {
      const [path, value] = entries[i]
      result[path] = await translate(value, locale, 'de', librecKey)
      if ((i + 1) % 20 === 0) console.log(`  ${i + 1}/${entries.length}`)
      await sleep(250)
    }
    const out = unflatten(result)
    const outPath = join(LOCALES_DIR, `${locale}.json`)
    writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n', 'utf-8')
    console.log(`  Geschrieben: ${locale}.json`)
  }

  console.log('Fertig. Alle Locales aus de.json übersetzt.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
