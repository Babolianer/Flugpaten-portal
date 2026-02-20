import { prisma } from '~~/server/utils/prisma'
import { requireAuth } from '~~/server/utils/auth'
import { ensureOrgAccess } from '~~/server/utils/orgAccess'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const requestId = getQuery(event).requestId
  if (typeof requestId !== 'string' || !requestId.trim()) {
    throw createError({ statusCode: 400, message: 'requestId erforderlich' })
  }

  const request = await prisma.transportRequest.findUnique({
    where: { id: requestId },
    include: {
      organization: true,
      applications: { where: { status: 'ACCEPTED' }, include: { user: true } },
    },
  })
  if (!request) throw createError({ statusCode: 404 })
  if (request.status !== 'COMPLETED') {
    return { canRatePatron: false, canRateOrg: false }
  }

  const acceptedApp = request.applications[0]
  if (!acceptedApp) {
    return { canRatePatron: false, canRateOrg: false }
  }

  const orgHasRatedPatron = await prisma.review.findFirst({
    where: {
      requestId,
      revieweeUserId: acceptedApp.userId,
    },
  })
  const userHasRatedOrg = await prisma.review.findFirst({
    where: {
      requestId,
      revieweeOrgId: request.organizationId,
    },
  })

  let canRatePatron = false
  let canRateOrg = false
  let patronId: string | null = null
  let orgId: string | null = null

  if (user.role === 'ORG_USER' || user.role === 'ADMIN') {
    try {
      await ensureOrgAccess(event, request.organizationId)
      canRatePatron = !orgHasRatedPatron
      patronId = acceptedApp.userId
    } catch {
      canRatePatron = false
    }
  }

  if (user.role === 'USER' && user.id === acceptedApp.userId) {
    canRateOrg = !userHasRatedOrg
    orgId = request.organizationId
  }

  return {
    canRatePatron,
    canRateOrg,
    patronId,
    orgId,
    patronName: acceptedApp.user.displayName,
  }
})
