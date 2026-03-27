import { prisma } from '~~/server/utils/prisma'

function normalizeName(value: string | null | undefined): string {
  return (value ?? '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeInstagram(value: string | null | undefined): string {
  const raw = (value ?? '').toLowerCase().trim()
  if (!raw) return ''
  return raw
    .replace(/^https?:\/\/(www\.)?instagram\.com\//, '')
    .replace(/\?.*$/, '')
    .replace(/\/+$/, '')
    .replace(/^@/, '')
    .trim()
}

export async function syncOrgaAquiseRegisteredStatus(): Promise<number> {
  const approvedOrganizations = await prisma.organization.findMany({
    where: { status: 'APPROVED' },
    select: { name: true, contactInstagram: true },
  })

  if (approvedOrganizations.length === 0) return 0

  const approvedNames = new Set(
    approvedOrganizations
      .map((o) => normalizeName(o.name))
      .filter(Boolean)
  )
  const approvedInstagrams = new Set(
    approvedOrganizations
      .map((o) => normalizeInstagram(o.contactInstagram))
      .filter(Boolean)
  )

  const acquiseRows = await prisma.orgaAquise.findMany({
    where: {
      kontaktStatus: { notIn: ['registriert', 'interessiert'] },
    },
    select: { id: true, name: true, instagramHandle: true },
  })

  const matchingIds = acquiseRows
    .filter((row) => {
      const byName = approvedNames.has(normalizeName(row.name))
      const byInstagram = approvedInstagrams.has(normalizeInstagram(row.instagramHandle))
      return byName || byInstagram
    })
    .map((row) => row.id)

  if (matchingIds.length === 0) return 0

  const result = await prisma.orgaAquise.updateMany({
    where: { id: { in: matchingIds } },
    data: {
      kontaktStatus: 'registriert',
      naechsteKontaktaufnahme: null,
    },
  })

  return result.count
}
