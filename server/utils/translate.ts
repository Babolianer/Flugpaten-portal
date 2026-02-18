/**
 * Übersetzung nur über LibreTranslate (kostenlos self-hosted oder libretranslate.com mit optionalem API-Key).
 * Kein MyMemory – dessen Limit-Meldungen dürfen nicht ins Frontend gelangen.
 * Bei Fehler oder ungültiger Antwort wird immer der Originaltext zurückgegeben.
 */

const LIBRE_URL = 'https://libretranslate.com/translate'

const TARGET_LANGS: Record<string, string> = {
  en: 'en',
  fr: 'fr',
  es: 'es',
  it: 'it',
  pl: 'pl',
}

/** Prüft, ob der Text wie eine API-Fehlermeldung aussieht (z. B. MyMemory-Warnung). */
function looksLikeErrorMessage(translated: string): boolean {
  const upper = translated.toUpperCase()
  return (
    upper.includes('MYMEMORY') ||
    upper.includes('WARNING') ||
    upper.includes('NEXT AVAILABLE') ||
    upper.includes('USAGELIMITS') ||
    upper.includes('VISIT HTTPS')
  )
}

export function getSupportedTargetLocales(): string[] {
  return Object.keys(TARGET_LANGS)
}

export async function translateText(
  text: string,
  targetLang: string,
  sourceLang: string = 'de',
): Promise<string> {
  if (!text || typeof text !== 'string') return text
  const trimmed = text.trim()
  if (!trimmed) return text

  const target = TARGET_LANGS[targetLang] ?? targetLang
  const config = useRuntimeConfig()
  const apiKey = config.libretranslateApiKey as string | undefined

  try {
    const res = await $fetch<{ translatedText?: string }>(LIBRE_URL, {
      method: 'POST',
      body: {
        q: trimmed,
        source: sourceLang,
        target,
        format: 'text',
        ...(apiKey && { api_key: apiKey }),
      },
      headers: { 'Content-Type': 'application/json' },
    })
    const result = res?.translatedText?.trim()
    if (result && !looksLikeErrorMessage(result)) return result
  } catch {
    // Bei Fehler: Originaltext zurückgeben, nie API-Meldungen anzeigen
  }

  return text
}
