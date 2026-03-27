import { z } from 'zod'
import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'

const bodySchema = z.object({
  content: z.string().trim().min(1).max(5000),
})

export default defineEventHandler(async (event) => {
  const admin = await requireRole(event, ['ADMIN'])
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Missing organization id' })

  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, message: 'Ungültige Eingabe' })

  let note
  try {
    note = await prisma.adminOrganizationNote.create({
      data: {
        organizationId: id,
        content: parsed.data.content,
        createdByAdminId: admin.id,
      },
    })
  } catch (error: unknown) {
    const err = error as { code?: string }
    if (err?.code === 'P2021' || err?.code === 'P2022') {
      throw createError({ statusCode: 503, message: 'CRM-Notizen sind noch nicht verfuegbar. Bitte Datenbank-Migration ausfuehren.' })
    }
    throw error
  }

  return { note }
})
