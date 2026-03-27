import { z } from 'zod'
import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'
import { syncOrgaAquiseRegisteredStatus } from '~~/server/utils/syncOrgaAquiseRegisteredStatus'

const validStatuses = ['nicht kontaktiert', 'kontaktiert', 'keine antwort', 'registriert', 'interessiert'] as const

const schema = z.object({
  name: z.string().min(1).max(200),
  instagramHandle: z.string().max(200).optional().nullable(),
  kontaktStatus: z.enum(validStatuses).optional(),
  naechsteKontaktaufnahme: z.string().datetime().optional().nullable(),
  notizen: z.string().max(4000).optional().nullable(),
})

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])

  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: 'Ungueltige Eingaben' })
  }

  const instagramRaw = (parsed.data.instagramHandle ?? '').trim()
  const instagramHandle = instagramRaw
    ? instagramRaw
      .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
      .replace(/\?.*$/, '')
      .replace(/\/+$/, '')
      .replace(/^@/, '')
      .trim()
    : null

  const created = await prisma.orgaAquise.create({
    data: {
      name: parsed.data.name.trim(),
      instagramHandle,
      kontaktStatus: parsed.data.kontaktStatus === 'interessiert' ? 'registriert' : (parsed.data.kontaktStatus ?? 'nicht kontaktiert'),
      naechsteKontaktaufnahme: parsed.data.naechsteKontaktaufnahme ? new Date(parsed.data.naechsteKontaktaufnahme) : null,
      notizen: parsed.data.notizen?.trim() || null,
    },
  })

  await syncOrgaAquiseRegisteredStatus()

  return {
    orga: {
      id: created.id,
      name: created.name,
      instagramHandle: created.instagramHandle,
      kontaktStatus: created.kontaktStatus,
      letzteKontaktaufnahme: created.letzteKontaktaufnahme,
      naechsteKontaktaufnahme: created.naechsteKontaktaufnahme,
      notizen: created.notizen,
      createdAt: created.createdAt,
    },
  }
})
