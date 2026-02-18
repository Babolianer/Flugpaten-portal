import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])

  const query = getQuery(event)
  const page = Math.max(1, parseInt(String(query.page), 10) || 1)
  const pageSize = Math.min(100, Math.max(10, parseInt(String(query.pageSize), 10) || 50))
  const skip = (page - 1) * pageSize

  try {
    const [contacts, total] = await Promise.all([
      prisma.acquisitionContact.findMany({
        orderBy: [{ websiteLanguage: 'asc' }, { name: 'asc' }],
        skip,
        take: pageSize,
        include: {
          mailLogs: {
            orderBy: { sentAt: 'desc' },
            take: 1,
            select: {
              status: true,
              sentAt: true,
            },
          },
        },
      }),
      prisma.acquisitionContact.count(),
    ])

    return {
      contacts: contacts.map((c) => {
        const lastMailLog = c.mailLogs[0]
        return {
          id: c.id,
          name: c.name,
          country: c.country,
          continent: c.continent,
          websiteLanguage: c.websiteLanguage,
          websiteUrl: c.websiteUrl,
          email: c.email,
          contactFormUrl: c.contactFormUrl,
          mediationType: c.mediationType,
          mediatesToGermany: c.mediatesToGermany,
          mediatesFromGermany: c.mediatesFromGermany,
          notes: c.notes,
          noted: c.noted,
          emailSent: c.emailSent,
          status: c.status,
          lastMailStatus: lastMailLog?.status || null,
          lastMailSentAt: lastMailLog?.sentAt || null,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        }
      }),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    }
  } catch (e) {
    const err = e as Error
    console.error('[admin/acquisition]', err.message, err.stack)
    throw createError({
      statusCode: 500,
      message: process.env.NODE_ENV === 'development' ? err.message : 'Fehler beim Laden der Acquise-Kontakte',
    })
  }
})
