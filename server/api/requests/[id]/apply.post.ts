import path from 'node:path'
import { writeFile, mkdir } from 'node:fs/promises'
import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'
import { fireEmailTrigger } from '~~/server/utils/emailTriggerEngine'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['USER', 'ADMIN'])

  const requestId = getRouterParam(event, 'id')
  if (!requestId) throw createError({ statusCode: 404, message: 'Not found' })

  let message = ''
  let applicationData: Record<string, unknown> | null = null
  let attachmentPath: string | null = null

  const contentType = getHeader(event, 'content-type') || ''
  if (contentType.includes('multipart/form-data')) {
    const parts = await readMultipartFormData(event)
    if (!parts?.length) {
      throw createError({ statusCode: 400, message: 'Invalid form data' })
    }
    for (const part of parts) {
      if (part.name === 'message' && part.data) {
        message = part.data.toString('utf-8').trim()
      }
      if (part.name === 'applicationData' && part.data) {
        try {
          applicationData = JSON.parse(part.data.toString('utf-8')) as Record<string, unknown>
        } catch {
          applicationData = null
        }
      }
      if (part.name === 'file' && part.data && part.filename) {
        if (part.data.length > MAX_FILE_SIZE) {
          throw createError({ statusCode: 400, message: 'Datei zu groß (max. 10 MB)' })
        }
        const mime = part.type || ''
        if (mime && !ALLOWED_TYPES.includes(mime)) {
          throw createError({ statusCode: 400, message: 'Dateityp nicht erlaubt (PDF, JPG, PNG, DOC)' })
        }
        const ext = path.extname(part.filename) || '.bin'
        const safeName = `${user.id}-${Date.now()}${ext}`
        const dir = path.join(process.cwd(), 'public', 'uploads', 'requests', requestId)
        await mkdir(dir, { recursive: true })
        const filePath = path.join(dir, safeName)
        await writeFile(filePath, part.data)
        attachmentPath = `/uploads/requests/${requestId}/${safeName}`
      }
    }
  } else {
    const body = await readBody(event)
    message = (body?.message as string)?.trim() ?? ''
    if (body?.applicationData) {
      applicationData = typeof body.applicationData === 'string' ? JSON.parse(body.applicationData) : body.applicationData
    }
  }

  if (!message) {
    throw createError({ statusCode: 400, message: 'Nachricht ist erforderlich' })
  }

  const request = await prisma.transportRequest.findFirst({
    where: {
      id: requestId,
      status: 'OPEN',
      organization: { status: 'APPROVED' },
    },
  })

  if (!request) throw createError({ statusCode: 404, message: 'Request not found' })

  const groupId = (request as { groupId?: string | null }).groupId ?? null
  const groupRequestIds: string[] = []
  if (groupId) {
    const groupRequests = await prisma.transportRequest.findMany({
      where: { groupId },
      select: { id: true, status: true },
    })
    const nonOpen = groupRequests.filter((r) => r.status !== 'OPEN')
    if (nonOpen.length > 0) {
      throw createError({ statusCode: 400, message: 'Diese Gruppe ist bereits teilweise geschlossen.' })
    }
    groupRequestIds.push(...groupRequests.map((r) => r.id))

    const existingInGroup = await prisma.requestApplication.findFirst({
      where: { userId: user.id, groupId },
      select: { id: true },
    })
    if (existingInGroup) {
      throw createError({ statusCode: 409, message: 'Already applied' })
    }
  } else {
    const existing = await prisma.requestApplication.findUnique({
      where: { requestId_userId: { requestId, userId: user.id } },
    })
    if (existing) {
      throw createError({ statusCode: 409, message: 'Already applied' })
    }
  }

  const createData: {
    requestId: string
    userId: string
    groupId?: string | null
    status: string
    message: string
    applicationData?: unknown
    attachmentPath?: string | null
  } = {
    requestId,
    userId: user.id,
    groupId,
    status: 'PENDING',
    message,
  }
  if (applicationData) createData.applicationData = applicationData
  if (attachmentPath) createData.attachmentPath = attachmentPath

  try {
    const targetRequestIds = groupRequestIds.length ? groupRequestIds : [requestId]

    const result = await prisma.$transaction(async (tx) => {
      const applications = []
      const conversations = []
      for (const rid of targetRequestIds) {
        const application = await tx.requestApplication.create({
          data: { ...createData, requestId: rid },
        })
        const conversation = await tx.conversation.create({
          data: {
            requestId: rid,
            organizationId: request.organizationId,
            userId: user.id,
          },
        })
        await tx.message.create({
          data: {
            conversationId: conversation.id,
            senderUserId: user.id,
            body: message,
          },
        })
        applications.push(application)
        conversations.push(conversation)
      }
      return { applications, conversations }
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
        for (const conv of result.conversations) {
          await prisma.message.create({
            data: {
              conversationId: conv.id,
              senderUserId: org.createdByUserId,
              body: autoBody,
            },
          })
        }
      }
    }

    const firstApp = result.applications[0]
    const firstConv = result.conversations[0]
    if (firstApp && firstConv) {
      fireEmailTrigger('TRANSPORT_APPLICATION_ORG', {
        organizationId: request.organizationId,
        requestId: firstApp.requestId,
        userId: user.id,
        conversationId: firstConv.id,
        applicantMessage: message,
      })
    }

    return { applications: result.applications, conversations: result.conversations }
  } catch (dbErr: unknown) {
    const msg = dbErr instanceof Error ? dbErr.message : String(dbErr)
    if (msg.includes('Unknown argument') && (msg.includes('applicationData') || msg.includes('attachmentPath') || msg.includes('groupId'))) {
      const targetRequestIds = groupRequestIds.length ? groupRequestIds : [requestId]
      const result = await prisma.$transaction(async (tx) => {
        const applications = []
        const conversations = []
        for (const rid of targetRequestIds) {
          const application = await tx.requestApplication.create({
            data: {
              requestId: rid,
              userId: user.id,
              status: 'PENDING',
              message,
            },
          })
          const conversation = await tx.conversation.create({
            data: {
              requestId: rid,
              organizationId: request.organizationId,
              userId: user.id,
            },
          })
          await tx.message.create({
            data: {
              conversationId: conversation.id,
              senderUserId: user.id,
              body: message,
            },
          })
          applications.push(application)
          conversations.push(conversation)
        }
        return { applications, conversations }
      })
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
          for (const conv of result.conversations) {
            await prisma.message.create({
              data: {
                conversationId: conv.id,
                senderUserId: org.createdByUserId,
                body: autoBody,
              },
            })
          }
        }
      }
      const firstApp = result.applications[0]
      const firstConv = result.conversations[0]
      if (firstApp && firstConv) {
        fireEmailTrigger('TRANSPORT_APPLICATION_ORG', {
          organizationId: request.organizationId,
          requestId: firstApp.requestId,
          userId: user.id,
          conversationId: firstConv.id,
          applicantMessage: message,
        })
      }
      return { applications: result.applications, conversations: result.conversations }
    }
    throw dbErr
  }
})
