import { prisma } from '~~/server/utils/prisma'
import { requireAuth } from '~~/server/utils/auth'

/**
 * Markiert alle Nachrichten, die der aktuelle User als Empfänger hat, als gelesen.
 * Wird beim Öffnen des Chats aufgerufen.
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const conversationId = getRouterParam(event, 'id')
  if (!conversationId) throw createError({ statusCode: 404, message: 'Not found' })

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

  await prisma.message.updateMany({
    where: {
      conversationId,
      senderUserId: { not: user.id },
      readAt: null,
    },
    data: { readAt: new Date() },
  })

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  })

  return { ok: true }
})
