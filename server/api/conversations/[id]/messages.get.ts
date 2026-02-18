import { prisma } from '~~/server/utils/prisma'
import { requireAuth } from '~~/server/utils/auth'

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

  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
    include: {
      sender: { select: { id: true, displayName: true } },
    },
  })

  return {
    messages: messages.map((m) => ({
      id: m.id,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
      senderUserId: m.senderUserId,
      senderDisplayName: m.sender?.displayName ?? null,
      isOwn: m.senderUserId === user.id,
    })),
  }
})
