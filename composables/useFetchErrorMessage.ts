/**
 * Extrahiert eine lesbare Fehlermeldung aus $fetch/ofetch-Fehlern (Nitro/h3).
 */
function getFetchErrorMessage(e: unknown): string {
  if (e == null) return ''
  if (typeof e === 'string') return e
  if (typeof e !== 'object') return String(e)
  const err = e as Record<string, unknown>
  const data = err.data
  if (data && typeof data === 'object' && 'message' in data) {
    const m = (data as { message?: unknown }).message
    if (typeof m === 'string' && m.trim()) return m
  }
  if (typeof err.statusMessage === 'string' && err.statusMessage.trim()) return err.statusMessage
  if (typeof err.message === 'string' && err.message.trim()) return err.message
  return ''
}

export function useFetchErrorMessage() {
  return { getFetchErrorMessage }
}
