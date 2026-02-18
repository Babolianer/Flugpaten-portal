import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'
import type { AcquisitionStatus } from '@prisma/client'

const statusValues: AcquisitionStatus[] = ['OPEN', 'CONTACTED', 'REPLIED', 'REGISTERED', 'REJECTED']

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Missing id' })

  const body = await readBody<{
    noted?: boolean
    emailSent?: boolean
    status?: AcquisitionStatus
    notes?: string | null
  }>(event)

  const data: { noted?: boolean; emailSent?: boolean; status?: AcquisitionStatus; notes?: string | null } = {}
  if (typeof body?.noted === 'boolean') data.noted = body.noted
  if (typeof body?.emailSent === 'boolean') data.emailSent = body.emailSent
  if (body?.status && statusValues.includes(body.status)) data.status = body.status
  if (body && 'notes' in body) data.notes = body.notes ?? null

  const contact = await prisma.acquisitionContact.update({
    where: { id },
    data,
  })

  return {
    id: contact.id,
    noted: contact.noted,
    emailSent: contact.emailSent,
    status: contact.status,
    notes: contact.notes,
    updatedAt: contact.updatedAt,
  }
})
