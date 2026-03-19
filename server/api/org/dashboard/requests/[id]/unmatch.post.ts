import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'
import { ensureOrgAccess } from '~~/server/utils/orgAccess'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['ORG_USER', 'ADMIN'])
  const requestId = getRouterParam(event, 'id')
  if (!requestId) throw createError({ statusCode: 404 })

  const req = await prisma.transportRequest.findFirst({
    where: { id: requestId },
    select: { id: true, status: true, organizationId: true, groupId: true },
  })
  if (!req) throw createError({ statusCode: 404, message: 'Anfrage nicht gefunden' })

  await ensureOrgAccess(event, req.organizationId)

  if (req.status !== 'MATCHED') {
    throw createError({ statusCode: 400, message: 'Nur reservierte (MATCHED) Anfragen können aufgelöst werden.' })
  }

  const groupId = req.groupId

  if (groupId) {
    const groupRequestIds = (
      await prisma.transportRequest.findMany({
        where: { groupId },
        select: { id: true },
      })
    ).map((r) => r.id)

    const accepted = await prisma.requestApplication.findFirst({
      where: { requestId: { in: groupRequestIds }, status: 'ACCEPTED' },
      select: { userId: true },
    })

    await prisma.$transaction([
      prisma.transportRequest.updateMany({
        where: { id: { in: groupRequestIds } },
        data: { status: 'OPEN' },
      }),
      ...(accepted
        ? [
            prisma.requestApplication.updateMany({
              where: {
                requestId: { in: groupRequestIds },
                userId: accepted.userId,
                status: 'ACCEPTED',
              },
              data: { status: 'REJECTED' },
            }),
          ]
        : []),
    ])

    if (accepted) {
      const conversations = await prisma.conversation.findMany({
        where: { requestId: { in: groupRequestIds }, userId: accepted.userId },
        select: { id: true },
      })
      for (const c of conversations) {
        await prisma.message.create({
          data: {
            conversationId: c.id,
            senderUserId: user.id,
            body: 'Der Transport wurde wieder geöffnet. Wir melden uns, sobald es Neuigkeiten gibt.',
          },
        })
        await prisma.conversation.update({
          where: { id: c.id },
          data: { updatedAt: new Date() },
        })
      }
    }
  } else {
    const accepted = await prisma.requestApplication.findFirst({
      where: { requestId, status: 'ACCEPTED' },
      select: { id: true, userId: true },
    })

    await prisma.$transaction([
      prisma.transportRequest.update({
        where: { id: requestId },
        data: { status: 'OPEN' },
      }),
      ...(accepted
        ? [
            prisma.requestApplication.update({
              where: { id: accepted.id },
              data: { status: 'REJECTED' },
            }),
          ]
        : []),
    ])

    if (accepted) {
      const conversation = await prisma.conversation.findFirst({
        where: { requestId, userId: accepted.userId },
        select: { id: true },
      })
      if (conversation) {
        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            senderUserId: user.id,
            body: 'Der Transport wurde wieder geöffnet. Wir melden uns, sobald es Neuigkeiten gibt.',
          },
        })
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: { updatedAt: new Date() },
        })
      }
    }
  }

  return { ok: true, requestStatus: 'OPEN' }
})

