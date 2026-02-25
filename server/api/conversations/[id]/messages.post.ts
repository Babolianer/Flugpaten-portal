import { prisma } from '~~/server/utils/prisma'
import { requireAuth } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const conversationId = getRouterParam(event, 'id')
  if (!conversationId) throw createError({ statusCode: 404, message: 'Not found' })

  const body = await readBody(event)
  const text = typeof body?.body === 'string' ? body.body.trim() : ''
  if (!text) throw createError({ statusCode: 400, message: 'Nachricht darf nicht leer sein' })

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { id: true, userId: true, organizationId: true },
  })
  if (!conversation) throw createError({ statusCode: 404, message: 'Konversation nicht gefunden' })

  const isUser = user.id === conversation.userId
  const isOrgMember =
    !!conversation.organizationId &&
    !!user.memberships?.some((m) => m.organization?.id === conversation.organizationId)
  const isAdmin = user.role === 'ADMIN'
  if (!isUser && !isOrgMember && !isAdmin) {
    throw createError({ statusCode: 403, message: 'Kein Zugriff auf diese Konversation' })
  }

  const message = await prisma.message.create({
    data: {
      conversationId,
      senderUserId: user.id,
      body: text,
    },
    include: {
      sender: { select: { id: true, displayName: true } },
    },
  })

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  })

  return {
    message: {
      id: message.id,
      body: message.body,
      createdAt: message.createdAt.toISOString(),
      senderUserId: message.senderUserId,
      senderDisplayName: message.sender?.displayName ?? null,
      isOwn: true,
      readAt: null,
    },
  }
})
