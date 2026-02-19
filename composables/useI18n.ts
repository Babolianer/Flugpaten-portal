import de from '~/locales/de.json'
import en from '~/locales/en.json'
import fr from '~/locales/fr.json'
import es from '~/locales/es.json'

const COOKIE_KEY = 'pawbridge_locale'

type Messages = Record<string, unknown>

const messages: Record<string, Messages> = {
  de: de as Messages,
  en: en as Messages,
  fr: fr as Messages,
  es: es as Messages,
}

const locales = [
  { code: 'de', name: 'Deutsch', flagCountry: 'de' },
  { code: 'en', name: 'English', flagCountry: 'gb' },
  { code: 'fr', name: 'Français', flagCountry: 'fr' },
  { code: 'es', name: 'Español', flagCountry: 'es' },
]

function getNested(obj: unknown, path: string): string | undefined {
  const keys = path.split('.')
  let current: unknown = obj
  for (const key of keys) {
    if (current == null || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[key]
  }
  return typeof current === 'string' ? current : undefined
}

export function useI18n() {
  const locale = useState<string>('locale', () => 'de')

  const t = (key: string, params?: Record<string, string | number>): string => {
    const msg = messages[locale.value] ?? messages.de
    let out = getNested(msg, key) ?? getNested(messages.de, key) ?? key
    if (params && typeof out === 'string') {
      for (const [k, v] of Object.entries(params)) {
        out = out.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
      }
    }
    return out
  }

  function setLocale(code: string) {
    if (!Object.keys(messages).includes(code)) return
    locale.value = code
    if (import.meta.client && typeof document !== 'undefined') {
      document.cookie = `${COOKIE_KEY}=${code};path=/;max-age=31536000`
    }
  }

  function localePath(path: string): string {
    return path
  }

  if (import.meta.client && typeof document !== 'undefined') {
    const match = document.cookie.match(new RegExp(`(?:^| )${COOKIE_KEY}=([^;]+)`))
    if (match && Object.keys(messages).includes(match[1])) {
      locale.value = match[1]
    }
  }

  return {
    locale,
    locales,
    t,
    setLocale,
    localePath,
  }
}
