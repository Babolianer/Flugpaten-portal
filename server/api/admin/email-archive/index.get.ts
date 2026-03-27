import type { OutboundEmailStatus, Prisma } from '@prisma/client'
import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  const q = getQuery(event)
  const page = Math.max(1, parseInt(typeof q.page === 'string' ? q.page : '1', 10) || 1)
  const pageSize = Math.min(50, Math.max(1, parseInt(typeof q.pageSize === 'string' ? q.pageSize : '20', 10) || 20))
  const triggerKey = typeof q.triggerKey === 'string' && q.triggerKey.trim() ? q.triggerKey.trim() : undefined
  const status = typeof q.status === 'string' && q.status.trim() ? (q.status.trim() as OutboundEmailStatus) : undefined
  const search = typeof q.q === 'string' ? q.q.trim() : ''
  const from = typeof q.from === 'string' && q.from ? new Date(q.from) : undefined
  const to = typeof q.to === 'string' && q.to ? new Date(q.to) : undefined

  const where: Prisma.OutboundEmailWhereInput = {}
  if (triggerKey) where.triggerKey = triggerKey
  if (status && ['QUEUED', 'SENT', 'FAILED', 'CANCELLED'].includes(status)) where.status = status
  if (search) {
    where.OR = [
      { toEmail: { contains: search, mode: 'insensitive' } },
      { subject: { contains: search, mode: 'insensitive' } },
      { triggerKey: { contains: search, mode: 'insensitive' } },
    ]
  }
  if (from || to) {
    where.createdAt = {}
    if (from && !Number.isNaN(from.getTime())) where.createdAt.gte = from
    if (to && !Number.isNaN(to.getTime())) where.createdAt.lte = to
  }

  const [total, items] = await Promise.all([
    prisma.outboundEmail.count({ where }),
    prisma.outboundEmail.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        triggerKey: true,
        status: true,
        toEmail: true,
        subject: true,
        bodyPlain: true,
        deliveryStatus: true,
        errorMessage: true,
        sentAt: true,
        createdAt: true,
        organizationId: true,
        requestId: true,
        userId: true,
      },
    }),
  ])

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize) || 1,
  }
})
