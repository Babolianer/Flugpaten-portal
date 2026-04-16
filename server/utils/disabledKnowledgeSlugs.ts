import { FLUGPATE_TOPICS } from '~/content/flugpate/types'

const VALID = new Set(FLUGPATE_TOPICS.map((t) => t.slug))

/** Alle bekannten Slugs (für „alles aus“ / Fail-Closed bei kaputtem JSON). */
export function allKnowledgeSlugs(): string[] {
  return FLUGPATE_TOPICS.map((t) => t.slug)
}

/**
 * Liest den gespeicherten JSON-String aus SiteSetting.value.
 * - Leer/fehlend → nichts deaktiviert (alle sichtbar).
 * - Ungültiges JSON oder nicht-Array → Fail-Closed: alle Slugs deaktiviert.
 * - Array mit nur unbekannten Strings → Fail-Closed (sonst würde fälschlich „alles an“ gelten).
 */
export function parseDisabledKnowledgeSlugs(raw: string | null | undefined): string[] {
  const trimmed = raw?.trim()
  if (!trimmed) return []

  let parsed: unknown
  try {
    parsed = JSON.parse(trimmed) as unknown
  } catch {
    return allKnowledgeSlugs()
  }

  if (!Array.isArray(parsed)) return allKnowledgeSlugs()

  const filtered = parsed.filter((e): e is string => typeof e === 'string' && VALID.has(e))
  if (parsed.length > 0 && filtered.length === 0) return allKnowledgeSlugs()

  return filtered
}
