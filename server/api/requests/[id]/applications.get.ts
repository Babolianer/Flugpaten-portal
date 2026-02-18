import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['ORG_USER', 'ADMIN'])
  const requestId = getRouterParam(event, 'id')
  if (!requestId) throw createError({ statusCode: 404, message: 'Not found' })

  const transportRequest = await prisma.transportRequest.findFirst({
    where: { id: requestId },
    select: { organizationId: true, organization: { select: { status: true } } },
  })
  if (!transportRequest) throw createError({ statusCode: 404, message: 'Request not found' })

  if (user.role !== 'ADMIN') {
    const membership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: transportRequest.organizationId,
          userId: user.id,
        },
      },
    })
    if (!membership || transportRequest.organization.status !== 'APPROVED') {
      throw createError({ statusCode: 403, message: 'Kein Zugriff auf diese Anfrage' })
    }
  }

  const applications = await prisma.requestApplication.findMany({
    where: { requestId },
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          displayName: true,
          email: true,
        },
      },
    },
  })

  return {
    applications: applications.map((a) => ({
      id: a.id,
      status: a.status,
      message: a.message,
      applicationData: a.applicationData as Record<string, unknown> | null,
      attachmentPath: a.attachmentPath,
      createdAt: a.createdAt.toISOString(),
      user: a.user
        ? {
            id: a.user.id,
            displayName: a.user.displayName,
            email: a.user.email,
          }
        : null,
    })),
  }
})
