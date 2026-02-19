declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

export function useAnalytics() {
  const config = useRuntimeConfig()
  const gaId = config.public.googleAnalyticsId as string
  const loaded = useState<boolean>('analytics-loaded', () => false)

  function loadAnalytics() {
    if (!gaId || !import.meta.client || typeof document === 'undefined') return
    if (loaded.value) return

    loaded.value = true

    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`
    document.head.appendChild(script)

    window.dataLayer = window.dataLayer || []
    function gtag(...args: unknown[]) {
      window.dataLayer = window.dataLayer || []
      window.dataLayer.push(args)
    }
    window.gtag = gtag
    gtag('js', new Date())
    gtag('config', gaId, {
      anonymize_ip: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    })
  }

  return { loadAnalytics }
}
