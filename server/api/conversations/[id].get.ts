import { prisma } from '~~/server/utils/prisma'
import { requireAuth } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const conversationId = getRouterParam(event, 'id')
  if (!conversationId) throw createError({ statusCode: 404, message: 'Not found' })

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      request: { select: { id: true, title: true } },
      organization: { select: { id: true, name: true, slug: true } },
      user: { select: { id: true, displayName: true } },
    },
  })
  if (!conversation) throw createError({ statusCode: 404, message: 'Konversation nicht gefunden' })

  const isUser = user.id === conversation.userId
  const isOrgMember = !!conversation.organizationId && !!user.memberships?.some((m) => m.organization?.id === conversation.organizationId)
  const isAdmin = user.role === 'ADMIN'
  if (!isUser && !isOrgMember && !isAdmin) {
    throw createError({ statusCode: 403, message: 'Kein Zugriff auf diese Konversation' })
  }

  return {
    id: conversation.id,
    requestId: conversation.requestId,
    requestTitle: conversation.request?.title ?? null,
    orgName: conversation.organization?.name ?? null,
    orgSlug: conversation.organization?.slug ?? null,
    userName: conversation.user?.displayName ?? null,
  }
})
