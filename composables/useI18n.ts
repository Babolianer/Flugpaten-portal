const COOKIE_KEY = 'pawbridge_locale'

const LOCALE_CODES = ['de', 'en', 'fr', 'es', 'it', 'pl'] as const
type LocaleCode = (typeof LOCALE_CODES)[number]

type Messages = Record<string, unknown>

const locales = [
  { code: 'de', name: 'Deutsch', flagCountry: 'de' },
  { code: 'en', name: 'English', flagCountry: 'gb' },
  { code: 'fr', name: 'Français', flagCountry: 'fr' },
  { code: 'es', name: 'Español', flagCountry: 'es' },
  { code: 'it', name: 'Italiano', flagCountry: 'it' },
  { code: 'pl', name: 'Polski', flagCountry: 'pl' },
]

function isLocaleCode(code: string | undefined | null): code is LocaleCode {
  return !!code && (LOCALE_CODES as readonly string[]).includes(code)
}

function getMessagesState() {
  return useState<Record<string, Messages>>('i18n-messages', () => ({}))
}

function getNested(obj: unknown, path: string): string | undefined {
  const keys = path.split('.')
  let current: unknown = obj
  for (const key of keys) {
    if (current == null || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[key]
  }
  return typeof current === 'string' ? current : undefined
}

async function ensureLocaleLoaded(code: string) {
  if (!isLocaleCode(code)) return
  const messagesState = getMessagesState()
  if (messagesState.value[code]) return
  const mod = await import(`~/locales/${code}.json`)
  messagesState.value = { ...messagesState.value, [code]: mod.default as Messages }
}

export async function initI18nLocaleMessages() {
  const cookie = useCookie<string | undefined>(COOKIE_KEY)
  const code: LocaleCode = isLocaleCode(cookie.value) ? cookie.value : 'de'
  const locale = useState<string>('locale', () => 'de')
  locale.value = code
  await ensureLocaleLoaded(code)
  if (code !== 'de') await ensureLocaleLoaded('de')
}

export function useI18n() {
  const locale = useState<string>('locale', () => 'de')
  const messagesState = getMessagesState()

  const t = (key: string, params?: Record<string, string | number>): string => {
    const msg = messagesState.value[locale.value] ?? messagesState.value.de ?? {}
    let out = getNested(msg, key) ?? getNested(messagesState.value.de, key) ?? key
    if (params && typeof out === 'string') {
      for (const [k, v] of Object.entries(params)) {
        out = out.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
      }
    }
    return out
  }

  async function setLocale(code: string) {
    if (!isLocaleCode(code)) return
    await ensureLocaleLoaded(code)
    if (code !== 'de') await ensureLocaleLoaded('de')
    locale.value = code
    if (import.meta.client && typeof document !== 'undefined') {
      document.cookie = `${COOKIE_KEY}=${code};path=/;max-age=31536000`
    }
  }

  function localePath(path: string) {
    return path
  }

  if (import.meta.client && typeof document !== 'undefined') {
    const match = document.cookie.match(new RegExp(`(?:^| )${COOKIE_KEY}=([^;]+)`))
    if (match && isLocaleCode(match[1])) {
      locale.value = match[1]
    }
  }

  return {
    locale,
    locales,
    t,
    setLocale,
    localePath,
    ensureLocaleLoaded,
  }
}
