import { z } from 'zod'
import type { OutboundEmailStatus, Prisma } from '@prisma/client'
import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'

const schema = z.object({
  /**
   * Tage in der Vergangenheit.
   * z. B. 30 => löscht Status SENT/FAILED/CANCELLED, die älter als 30 Tage sind.
   */
  days: z.number().int().min(0).max(36500),
})

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])

  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: 'Ungültige Eingabe', data: parsed.error.flatten() })
  }

  const days = parsed.data.days
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const statuses: OutboundEmailStatus[] = ['SENT', 'FAILED', 'CANCELLED']
  const where: Prisma.OutboundEmailWhereInput = {
    status: { in: statuses },
    createdAt: { lt: cutoff },
  }

  const deletedCount = await prisma.outboundEmail.deleteMany({ where })
  return { deletedCount, days, cutoff: cutoff.toISOString() }
})

