export default defineEventHandler((event) => {
  const isProd = process.env.NODE_ENV === 'production'
  setResponseHeader(event, 'X-Content-Type-Options', 'nosniff')
  setResponseHeader(event, 'X-Frame-Options', 'DENY')
  setResponseHeader(event, 'Referrer-Policy', 'strict-origin-when-cross-origin')
  setResponseHeader(event, 'Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  // In Development: kein CSP / kein COOP – sonst scheitern oft Vite-HMR und dynamische
  // Imports (`Failed to fetch dynamically imported module` für `/_nuxt/*.vue`).
  if (!isProd) {
    return
  }

  setResponseHeader(event, 'Cross-Origin-Opener-Policy', 'same-origin')

  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "img-src 'self' data: https:",
    "style-src 'self' 'unsafe-inline' https:",
    "font-src 'self' data: https:",
    "script-src 'self' 'unsafe-inline' https:",
    "connect-src 'self' https: wss:",
    "form-action 'self'",
  ].join('; ')
  setResponseHeader(event, 'Content-Security-Policy', csp)
  setResponseHeader(event, 'Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
})
