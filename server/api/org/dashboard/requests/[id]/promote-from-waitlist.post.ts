import { z } from 'zod'
import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'

const bodySchema = z.object({
  applicationId: z.string().min(1),
})

/**
 * Wartelisten-Platz annehmen: gleiche Wirkung wie normales Annehmen, Ausgang aber WAITING_LIST.
 */
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
    throw createError({ statusCode: 400, message: 'Nur offene Anfragen erlauben ein Nachrücken von der Warteliste.' })
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
  if (application.status !== 'WAITING_LIST') {
    throw createError({ statusCode: 400, message: 'Nur Wartelisten-Einträge können nachrücken.' })
  }

  const groupId = application.groupId ?? transportRequest.groupId ?? null
  const isGroup = !!groupId
  const acceptedUserId = application.userId
  let targetRequestIds: string[] = [requestId]

  if (isGroup) {
    const reqs = await prisma.transportRequest.findMany({
      where: { groupId },
      select: { id: true, status: true },
    })
    const nonOpen = reqs.filter((r) => r.status !== 'OPEN')
    if (nonOpen.length > 0) {
      throw createError({ statusCode: 400, message: 'Diese Gruppe ist bereits teilweise geschlossen.' })
    }
    targetRequestIds = reqs.map((r) => r.id)
  }

  await prisma.$transaction(async (tx) => {
    if (isGroup) {
      await tx.requestApplication.updateMany({
        where: { groupId, userId: acceptedUserId, status: 'WAITING_LIST' },
        data: { status: 'ACCEPTED' },
      })
      await tx.transportRequest.updateMany({
        where: { groupId },
        data: { status: 'MATCHED' },
      })
      await tx.requestApplication.updateMany({
        where: {
          requestId: { in: targetRequestIds },
          status: { in: ['PENDING', 'WAITING_LIST'] },
          userId: { not: acceptedUserId },
        },
        data: { status: 'REJECTED' },
      })
    } else {
      await tx.requestApplication.update({
        where: { id: applicationId },
        data: { status: 'ACCEPTED' },
      })
      await tx.transportRequest.update({
        where: { id: requestId },
        data: { status: 'MATCHED' },
      })
      await tx.requestApplication.updateMany({
        where: {
          requestId,
          status: { in: ['PENDING', 'WAITING_LIST'] },
          userId: { not: acceptedUserId },
        },
        data: { status: 'REJECTED' },
      })
    }
  })

  const conversations = await prisma.conversation.findMany({
    where: { requestId: { in: targetRequestIds }, userId: acceptedUserId },
    select: { id: true },
  })
  for (const c of conversations) {
    await prisma.message.create({
      data: {
        conversationId: c.id,
        senderUserId: user.id,
        body: 'Du rückst von der Warteliste nach – der Transport ist reserviert. Danke!',
      },
    })
    await prisma.conversation.update({
      where: { id: c.id },
      data: { updatedAt: new Date() },
    })
  }

  return { ok: true, requestStatus: 'MATCHED' }
})
