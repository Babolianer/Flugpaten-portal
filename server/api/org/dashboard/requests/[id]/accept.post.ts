import { z } from 'zod'
import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'

const bodySchema = z.object({
  applicationId: z.string().min(1),
})

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['ORG_USER', 'ADMIN'])
  const requestId = getRouterParam(event, 'id')
  if (!requestId) throw createError({ statusCode: 404 })

  const body = await readBody(event)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: 'applicationId erforderlich' })
  }
  const { applicationId } = parsed.data

  const transportRequest = await prisma.transportRequest.findFirst({
    where: { id: requestId },
    include: { organization: { select: { status: true } } },
  })
  if (!transportRequest) throw createError({ statusCode: 404, message: 'Anfrage nicht gefunden' })
  if (transportRequest.status !== 'OPEN') {
    throw createError({ statusCode: 400, message: 'Diese Anfrage ist bereits geschlossen.' })
  }

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
      throw createError({ statusCode: 403, message: 'Kein Zugriff' })
    }
  }

  const application = await prisma.requestApplication.findFirst({
    where: { id: applicationId, requestId },
  })
  if (!application) throw createError({ statusCode: 404, message: 'Bewerbung nicht gefunden' })
  if (application.status !== 'PENDING') {
    throw createError({ statusCode: 400, message: 'Bewerbung wurde bereits bearbeitet.' })
  }

  await prisma.$transaction([
    prisma.requestApplication.update({
      where: { id: applicationId },
      data: { status: 'ACCEPTED' },
    }),
    prisma.transportRequest.update({
      where: { id: requestId },
      data: { status: 'MATCHED' },
    }),
  ])

  // Chat-Nachricht beim Annehmen hinzufügen
  const conversation = await prisma.conversation.findFirst({
    where: { requestId, userId: application.userId },
  })
  if (conversation) {
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderUserId: user.id,
        body: 'Die Bewerbung wurde angenommen. Der Transport ist bestätigt.',
      },
    })
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    })
  }

  return { ok: true, requestStatus: 'MATCHED' }
})
