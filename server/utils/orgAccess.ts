import type { H3Event } from 'h3'
import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'

/**
 * Ensures the current user can access the given organization:
 * - ORG_USER: must be member and org must be APPROVED
 * - ADMIN: org must exist and be APPROVED (can act as any approved org)
 * Throws 403 if no access.
 */
export async function ensureOrgAccess(event: H3Event, organizationId: string): Promise<void> {
  const user = await requireRole(event, ['ORG_USER', 'ADMIN'])

  if (user.role === 'ADMIN') {
    const org = await prisma.organization.findFirst({
      where: { id: organizationId, status: 'APPROVED' },
    })
    if (!org) throw createError({ statusCode: 403, message: 'Organisation nicht gefunden oder nicht freigegeben' })
    return
  }

  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: { organizationId, userId: user.id },
    },
    include: { organization: true },
  })
  if (!membership || membership.organization.status !== 'APPROVED') {
    throw createError({ statusCode: 403 })
  }
}

/**
 * Returns organization IDs the current user can access (for list endpoints).
 * ADMIN with query orgId: [orgId] if approved. ORG_USER: their approved org ids.
 */
export async function getAccessibleOrgIds(event: H3Event): Promise<string[]> {
  const user = await requireRole(event, ['ORG_USER', 'ADMIN'])

  const query = getQuery(event)
  const orgId = typeof query.orgId === 'string' ? query.orgId.trim() : null

  if (user.role === 'ADMIN' && orgId) {
    const org = await prisma.organization.findFirst({
      where: { id: orgId, status: 'APPROVED' },
    })
    return org ? [orgId] : []
  }

  const memberships = await prisma.organizationMember.findMany({
    where: { userId: user.id, organization: { status: 'APPROVED' } },
    select: { organizationId: true },
  })
  return memberships.map((m) => m.organizationId)
}
