export default defineNuxtPlugin(() => {
  const { hasAnalyticsConsent } = useCookieConsent()
  if (!hasAnalyticsConsent()) return

  const { loadAnalytics } = useAnalytics()
  loadAnalytics()
})
