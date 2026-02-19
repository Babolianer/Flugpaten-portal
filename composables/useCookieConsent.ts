const COOKIE_NAME = 'pawbridge_cookie_consent'
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60 // 1 Jahr

export type ConsentStatus = 'accepted' | 'declined' | null

export function useCookieConsent() {
  const forceShowBanner = useState<boolean>('cookie-consent-force-show', () => false)

  function getConsent(): ConsentStatus {
    if (import.meta.client && typeof document !== 'undefined') {
      const match = document.cookie.match(new RegExp(`(?:^| )${COOKIE_NAME}=([^;]+)`))
      const val = match ? match[1] : null
      if (val === 'accepted' || val === 'declined') return val
      return null
    }
    return null
  }

  function setConsent(status: 'accepted' | 'declined') {
    if (import.meta.client && typeof document !== 'undefined') {
      document.cookie = `${COOKIE_NAME}=${status};path=/;max-age=${COOKIE_MAX_AGE};SameSite=Lax`
      forceShowBanner.value = false
    }
  }

  function hasAnalyticsConsent(): boolean {
    return getConsent() === 'accepted'
  }

  function openSettings() {
    if (import.meta.client && typeof document !== 'undefined') {
      document.cookie = `${COOKIE_NAME}=;path=/;max-age=0`
      forceShowBanner.value = true
    }
  }

  function shouldShowBanner(): boolean {
    return forceShowBanner.value || getConsent() === null
  }

  return {
    getConsent,
    setConsent,
    hasAnalyticsConsent,
    openSettings,
    shouldShowBanner,
    forceShowBanner,
  }
}
