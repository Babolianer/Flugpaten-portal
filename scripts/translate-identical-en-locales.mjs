import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
}

function getAllPaths(obj, prefix = '') {
  /** @type {Array<[string, any]>} */
  const out = []
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k
    if (isPlainObject(v)) out.push(...getAllPaths(v, p))
    else out.push([p, v])
  }
  return out
}

function setByPath(obj, keyPath, value) {
  const parts = keyPath.split('.')
  let current = obj
  for (let i = 0; i < parts.length - 1; i++) current = current[parts[i]]
  current[parts[parts.length - 1]] = value
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

const SOURCE_LANG = 'en'
const TARGET_LANGS = ['fr', 'es', 'it', 'pl']

const apiKey = process.env.LIBRETRANSLATE_API_KEY || ''
const libreUrl = 'https://libretranslate.com/translate'

async function translateUniqueText(text, targetLang) {
  const trimmed = text.trim()
  if (!trimmed) return text

  const body = {
    q: trimmed,
    source: SOURCE_LANG,
    target: targetLang,
    format: 'text',
    ...(apiKey ? { api_key: apiKey } : {}),
  }

  try {
    const res = await fetch(libreUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) return text

    const data = await res.json()
    const out = data?.translatedText?.trim()
    if (!out) return text

    const upper = out.toUpperCase()
    if (
      upper.includes('MYMEMORY') ||
      upper.includes('WARNING') ||
      upper.includes('NEXT AVAILABLE') ||
      upper.includes('USAGELIMITS') ||
      upper.includes('VISIT HTTPS')
    ) {
      return text
    }

    return out
  } catch {
    return text
  }
}

async function main() {
  const localesDir = path.join(root, 'locales')
  const en = JSON.parse(fs.readFileSync(path.join(localesDir, 'en.json'), 'utf8'))
  const de = JSON.parse(fs.readFileSync(path.join(localesDir, 'de.json'), 'utf8'))

  const enPaths = getAllPaths(en)
  const deMap = new Map(getAllPaths(de))
  const enMap = new Map(enPaths)

  for (const lang of TARGET_LANGS) {
    const filePath = path.join(localesDir, `${lang}.json`)
    const target = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    const targetMap = new Map(getAllPaths(target))

    const uniqueEnTexts = new Set()
    const keysNeedingTranslation = []

    for (const [keyPath, enVal] of enMap.entries()) {
      if (typeof enVal !== 'string') continue
      const tv = targetMap.get(keyPath)
      if (tv !== enVal) continue
      const dv = deMap.get(keyPath)
      if (typeof dv !== 'string') continue
      if (dv === enVal) continue

      uniqueEnTexts.add(enVal)
      keysNeedingTranslation.push(keyPath)
    }

    console.log(
      `${lang}: keys needing translation=${keysNeedingTranslation.length}, unique EN texts=${uniqueEnTexts.size}`,
    )

    const cachePath = path.join(root, `scripts/.translation-cache.${lang}.json`)
    let cache = {}
    if (fs.existsSync(cachePath)) {
      try {
        cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'))
      } catch {
        cache = {}
      }
    }

    for (const enText of uniqueEnTexts) {
      if (cache[enText]) continue
      await sleep(150)
      const translated = await translateUniqueText(enText, lang)
      cache[enText] = translated
      fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2) + '\n', 'utf8')
      console.log(`${lang}: translated "${enText.slice(0, 32)}..."`)
    }

    for (const keyPath of keysNeedingTranslation) {
      const enText = enMap.get(keyPath)
      setByPath(target, keyPath, cache[enText] ?? enText)
    }

    fs.writeFileSync(filePath, JSON.stringify(target, null, 2) + '\n', 'utf8')
    console.log(`updated ${filePath}`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

