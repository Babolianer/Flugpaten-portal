import type { User } from '@prisma/client'

const protectedPaths = ['/dashboard', '/org/dashboard', '/org/register', '/admin']

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname

  const isProtected = protectedPaths.some((p) => path === p || path.startsWith(p + '/'))
  if (!isProtected) return

  const config = useRuntimeConfig()
  const cookieName = config.cookieName || 'tierschutz_session'
  const token = getCookie(event, cookieName)

  if (!token) {
    return sendRedirect(event, '/login?redirect=' + encodeURIComponent(path), 302)
  }

  const { verifyJwt } = await import('../utils/auth')
  const payload = await verifyJwt(token)
  if (!payload) {
    deleteCookie(event, cookieName)
    return sendRedirect(event, '/login?redirect=' + encodeURIComponent(path), 302)
  }

  const { prisma } = await import('../utils/prisma')
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    include: {
      memberships: {
        include: { organization: { select: { id: true, name: true, slug: true, status: true } } },
      },
    },
  })

  if (!user) {
    deleteCookie(event, cookieName)
    return sendRedirect(event, '/login?redirect=' + encodeURIComponent(path), 302)
  }

  if (path.startsWith('/admin') && user.role !== 'ADMIN') {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  if ((path.startsWith('/org/dashboard') || path === '/org/register') && user.role !== 'ORG_USER' && user.role !== 'ADMIN') {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  event.context.user = user as User & {
    memberships?: { organization: { id: string; name: string; slug: string; status: string } }[]
  }
})
