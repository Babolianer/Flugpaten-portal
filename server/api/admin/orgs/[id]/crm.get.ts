import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Missing organization id' })

  const organization = await prisma.organization.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      preferredLanguage: true,
      contactEmail: true,
      website: true,
      description: true,
      createdAt: true,
      updatedAt: true,
    },
  })
  if (!organization) throw createError({ statusCode: 404, message: 'Organisation nicht gefunden' })

  const emails = await prisma.outboundEmail.findMany({
    where: {
      OR: [
        { organizationId: id },
        { toEmail: organization.contactEmail },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      id: true,
      triggerKey: true,
      status: true,
      deliveryStatus: true,
      toEmail: true,
      subject: true,
      errorMessage: true,
      sentAt: true,
      createdAt: true,
    },
  })

  let notes: Awaited<ReturnType<typeof prisma.adminOrganizationNote.findMany>> = []
  let tasks: Awaited<ReturnType<typeof prisma.adminOrganizationTask.findMany>> = []

  try {
    ;[notes, tasks] = await Promise.all([
      prisma.adminOrganizationNote.findMany({
        where: { organizationId: id },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
      prisma.adminOrganizationTask.findMany({
        where: { organizationId: id },
        orderBy: [{ status: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
        take: 200,
      }),
    ])
  } catch (error: unknown) {
    // Lokale DBs koennen bei neuen Features hinterherhinken; CRM bleibt nutzbar.
    const err = error as { code?: string }
    const isSchemaDrift = err?.code === 'P2021' || err?.code === 'P2022'
    if (!isSchemaDrift) throw error
  }

  return { organization, emails, notes, tasks }
})
