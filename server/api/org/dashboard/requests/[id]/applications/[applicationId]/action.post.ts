import { z } from 'zod'
import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'
import { ensureOrgAccess } from '~~/server/utils/orgAccess'

const MAX_WAITING_LIST_SIZE = 2

const bodySchema = z.object({
  action: z.enum(['release_match', 'set_waiting_list', 'reject']),
})

export default defineEventHandler(async (event) => {
  const authUser = await requireRole(event, ['ORG_USER', 'ADMIN'])
  const requestId = getRouterParam(event, 'id')
  const applicationId = getRouterParam(event, 'applicationId')
  if (!requestId || !applicationId) throw createError({ statusCode: 404 })

  const body = await readBody(event)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: 'Ungültige Aktion' })
  }
  const { action } = parsed.data

  const transportRequest = await prisma.transportRequest.findFirst({
    where: { id: requestId },
    select: {
      id: true,
      organizationId: true,
      status: true,
      waitingListEnabled: true,
      groupId: true,
    },
  })
  if (!transportRequest) throw createError({ statusCode: 404, message: 'Anfrage nicht gefunden' })

  await ensureOrgAccess(event, transportRequest.organizationId)

  const application = await prisma.requestApplication.findFirst({
    where: { id: applicationId, requestId },
  })
  if (!application) throw createError({ statusCode: 404, message: 'Bewerbung nicht gefunden' })

  if (action === 'release_match') {
    if (transportRequest.status !== 'MATCHED') {
      throw createError({ statusCode: 400, message: 'Nur bei reservierten Anfragen kann die Zuordnung gelöst werden.' })
    }
    if (application.status !== 'ACCEPTED') {
      throw createError({ statusCode: 400, message: 'Diese Bewerbung ist nicht als Flugpate reserviert.' })
    }

    const groupId = application.groupId ?? transportRequest.groupId
    if (groupId) {
      const groupReqs = await prisma.transportRequest.findMany({
        where: { groupId },
        select: { id: true },
      })
      const ids = groupReqs.map((r) => r.id)
      await prisma.$transaction([
        prisma.transportRequest.updateMany({
          where: { id: { in: ids } },
          data: { status: 'OPEN' },
        }),
        prisma.requestApplication.updateMany({
          where: { groupId, userId: application.userId, status: 'ACCEPTED' },
          data: { status: 'PENDING' },
        }),
      ])
      const conversations = await prisma.conversation.findMany({
        where: { requestId: { in: ids }, userId: application.userId },
        select: { id: true },
      })
      for (const c of conversations) {
        await prisma.message.create({
          data: {
            conversationId: c.id,
            senderUserId: authUser.id,
            body: 'Die Reservierung wurde aufgehoben. Die Anfrage ist wieder offen – bei Interesse könnt ihr die Zuordnung erneut vornehmen.',
          },
        })
        await prisma.conversation.update({
          where: { id: c.id },
          data: { updatedAt: new Date() },
        })
      }
    } else {
      await prisma.$transaction([
        prisma.transportRequest.update({
          where: { id: requestId },
          data: { status: 'OPEN' },
        }),
        prisma.requestApplication.update({
          where: { id: applicationId },
          data: { status: 'PENDING' },
        }),
      ])
      const conversation = await prisma.conversation.findFirst({
        where: { requestId, userId: application.userId },
        select: { id: true },
      })
      if (conversation) {
        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            senderUserId: authUser.id,
            body: 'Die Reservierung wurde aufgehoben. Die Anfrage ist wieder offen – bei Interesse könnt ihr die Zuordnung erneut vornehmen.',
          },
        })
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: { updatedAt: new Date() },
        })
      }
    }
    return { ok: true, requestStatus: 'OPEN' }
  }

  if (action === 'set_waiting_list') {
    if (transportRequest.status !== 'MATCHED' || !transportRequest.waitingListEnabled) {
      throw createError({
        statusCode: 400,
        message: 'Warteliste nur bei reservierten Anfragen mit aktivierter Warteliste möglich.',
      })
    }
    if (application.status === 'ACCEPTED') {
      throw createError({ statusCode: 400, message: 'Reservierte Flugpaten bitte zuerst über „Zuordnung lösen“ freigeben.' })
    }
    if (application.status === 'WAITING_LIST') {
      return { ok: true, applicationStatus: 'WAITING_LIST' }
    }
    if (application.status !== 'PENDING' && application.status !== 'REJECTED') {
      throw createError({ statusCode: 400, message: 'Diese Bewerbung kann nicht auf die Warteliste gesetzt werden.' })
    }

    const waitingListCount = await prisma.requestApplication.count({
      where: { requestId, status: 'WAITING_LIST' },
    })
    if (waitingListCount >= MAX_WAITING_LIST_SIZE) {
      throw createError({
        statusCode: 400,
        message: `Warteliste voll (max. ${MAX_WAITING_LIST_SIZE} Personen).`,
      })
    }

    await prisma.requestApplication.update({
      where: { id: applicationId },
      data: { status: 'WAITING_LIST' },
    })
    return { ok: true, applicationStatus: 'WAITING_LIST' }
  }

  // reject
  if (application.status !== 'PENDING' && application.status !== 'WAITING_LIST') {
    throw createError({ statusCode: 400, message: 'Nur offene Bewerbungen oder Wartelisten-Einträge können abgelehnt werden.' })
  }
  await prisma.requestApplication.update({
    where: { id: applicationId },
    data: { status: 'REJECTED' },
  })
  return { ok: true, applicationStatus: 'REJECTED' }
})
