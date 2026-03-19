import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'

const MAX_WAITING_LIST_SIZE = 2

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['USER', 'ADMIN'])
  const requestId = getRouterParam(event, 'id')
  if (!requestId) throw createError({ statusCode: 404, message: 'Not found' })

  const request = await prisma.transportRequest.findFirst({
    where: {
      id: requestId,
      status: 'MATCHED',
      waitingListEnabled: true,
      organization: { status: 'APPROVED' },
    },
  })

  if (!request) {
    throw createError({
      statusCode: 404,
      message: 'Request not found or not open for waiting list (only MATCHED requests with waiting list enabled)',
    })
  }

  const existing = await prisma.requestApplication.findUnique({
    where: { requestId_userId: { requestId, userId: user.id } },
  })
  if (existing) {
    if (existing.status === 'WAITING_LIST') {
      throw createError({ statusCode: 409, message: 'You are already on the waiting list' })
    }
    throw createError({ statusCode: 409, message: 'You have already applied for this request' })
  }

  const waitingListCount = await prisma.requestApplication.count({
    where: { requestId, status: 'WAITING_LIST' },
  })
  if (waitingListCount >= MAX_WAITING_LIST_SIZE) {
    throw createError({
      statusCode: 400,
      message: 'Waiting list is full (max 2 people). Try again later if a spot opens up.',
    })
  }

  const [application, conversation] = await prisma.$transaction([
    prisma.requestApplication.create({
      data: {
        requestId,
        userId: user.id,
        status: 'WAITING_LIST',
        message: 'Ich möchte auf die Warteliste für spontane Flüge.',
      },
    }),
    prisma.conversation.create({
      data: {
        requestId,
        organizationId: request.organizationId,
        userId: user.id,
      },
    }),
  ])

  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderUserId: user.id,
      body: 'Ich möchte auf die Warteliste für spontane Flüge gesetzt werden. Bitte melden Sie sich, falls sich etwas ergibt.',
    },
  })

  // Automatische Antwort der Organisation an den Nutzer (wenn Vorlage 1 gesetzt ist)
  const org = await prisma.organization.findUnique({
    where: { id: request.organizationId },
    select: { automatedMessageTemplate1: true, createdByUserId: true, name: true },
  })
  if (org?.automatedMessageTemplate1?.trim()) {
    const autoBody = org.automatedMessageTemplate1
      .replace(/\{\{orgName\}\}/g, org.name)
      .replace(/\{\{organisation\}\}/g, org.name)
      .trim()
    if (autoBody) {
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderUserId: org.createdByUserId,
          body: autoBody,
        },
      })
    }
  }

  return { application, conversation }
})
