/**
 * Übersetzt Organisations- und Request-Texte per LibreTranslate, wenn locale !== 'de'.
 * Bei Fehlern oder de wird der Originaltext zurückgegeben.
 */
import { translateText } from './translate'

async function maybeTranslate(text: string | null | undefined, locale: string, sourceLang = 'de'): Promise<string> {
  if (!text || locale === sourceLang) return text ?? ''
  return translateText(text, locale, sourceLang)
}

/** Übersetzt mehrere Texte parallel. */
export async function translateStrings(
  texts: (string | null | undefined)[],
  locale: string,
  sourceLang = 'de',
): Promise<string[]> {
  if (locale === sourceLang) return texts.map((t) => t ?? '')
  return Promise.all(texts.map((t) => maybeTranslate(t, locale, sourceLang)))
}
