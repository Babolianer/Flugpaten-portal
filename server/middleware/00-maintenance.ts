/**
 * Wartungsmodus: Blockiert alle Seiten – nur die Wartungsseite, Login und Org-Pre-Registrierung sind erreichbar.
 * Eingeloggte Admins und Org-Benutzer haben Zugriff.
 */
export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname

  const allowedWithoutAuth = [
    '/maintenance',
    '/api/site/maintenance',
    '/api/auth/login',
    '/api/auth/register-org',
    '/api/auth/maintenance-login',
    '/api/auth/logout',
    '/api/auth/me',
  ]
  if (path === '/maintenance' || path.startsWith('/maintenance/')) return
  if (allowedWithoutAuth.some((p) => path === p || path.startsWith(p + '?'))) return
  // Statische Assets (JS, CSS, Bilder) – nötig, damit die Wartungsseite laden kann
  if (path.startsWith('/_nuxt/') || path.startsWith('/__nuxt') || path === '/favicon.ico' || path.startsWith('/assets/')) {
    return
  }

  let maintenance = false
  try {
    const { prisma } = await import('../utils/prisma')
    const row = await prisma.siteSetting.findUnique({
      where: { key: 'maintenanceMode' },
    })
    maintenance = row?.value === 'true'
  } catch {
    return
  }

  if (!maintenance) return

  const bypassToken = getCookie(event, 'maintenance_bypass')
  if (bypassToken) {
    const { verifyMaintenanceBypass } = await import('../utils/auth')
    if (await verifyMaintenanceBypass(bypassToken)) {
      return
    }
  }

  const config = useRuntimeConfig()
  const cookieName = config.cookieName || 'tierschutz_session'
  const token = getCookie(event, cookieName)
  if (token) {
    const { verifyJwt } = await import('../utils/auth')
    const payload = await verifyJwt(token)
    if (payload?.role === 'ADMIN') return
    if (payload?.role === 'ORG_USER') {
      const { prisma } = await import('../utils/prisma')
      const memberships = await prisma.organizationMember.findMany({
        where: { userId: payload.sub },
        include: { organization: { select: { status: true } } },
      })
      const hasApprovedOrg = memberships.some((m) => m.organization.status === 'APPROVED')
      if (hasApprovedOrg) return
    }
  }

  if (path.startsWith('/api/')) {
    throw createError({ statusCode: 503, message: 'Wartungsarbeiten. Bitte später erneut versuchen.' })
  }

  if (path === '/login') return sendRedirect(event, '/maintenance/login', 302)
  if (path === '/register') return sendRedirect(event, '/maintenance/register', 302)

  return sendRedirect(event, '/maintenance', 302)
})
