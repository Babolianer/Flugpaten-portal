import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'
import { syncOrgaAquiseRegisteredStatus } from '~~/server/utils/syncOrgaAquiseRegisteredStatus'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  await syncOrgaAquiseRegisteredStatus()

  const query = getQuery(event)
  const page = Math.max(1, parseInt(String(query.page), 10) || 1)
  const pageSize = Math.min(100, Math.max(10, parseInt(String(query.pageSize), 10) || 50))
  const search = String(query.search || '').trim()
  function normalizeInstagramSearchTerm(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/^https?:\/\/(www\.)?instagram\.com\//, '')
      .replace(/\?.*$/, '')
      .replace(/\/+$/, '')
      .replace(/^@/, '')
      .trim()
  }

  const statusFilter = String(query.status || '').trim()
  const sortBy = String(query.sortBy || 'naechsteKontaktaufnahme').trim()
  const sortOrder = String(query.sortOrder || 'asc').toLowerCase() === 'desc' ? 'desc' : 'asc'
  const skip = (page - 1) * pageSize

  const validSortColumns = ['name', 'instagramHandle', 'kontaktStatus', 'letzteKontaktaufnahme', 'naechsteKontaktaufnahme', 'notizen'] as const
  type SortCol = (typeof validSortColumns)[number]
  const sortColumn: SortCol = validSortColumns.includes(sortBy as SortCol) ? (sortBy as SortCol) : 'naechsteKontaktaufnahme'

  const where: {
    kontaktStatus?: string | { in: string[] }
    OR?: Array<
      | { name: { contains: string; mode: 'insensitive' } }
      | { instagramHandle: { contains: string; mode: 'insensitive' } }
      | { notizen: { contains: string; mode: 'insensitive' } }
    >
  } = {}

  const validStatuses = ['nicht kontaktiert', 'kontaktiert', 'keine antwort', 'registriert', 'interessiert']
  if (statusFilter && validStatuses.includes(statusFilter)) {
    if (statusFilter === 'registriert') where.kontaktStatus = { in: ['registriert', 'interessiert'] }
    else if (statusFilter === 'interessiert') where.kontaktStatus = { in: ['registriert', 'interessiert'] }
    else where.kontaktStatus = statusFilter
  }
  if (search) {
    const instagramSearch = normalizeInstagramSearchTerm(search)
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { instagramHandle: { contains: search, mode: 'insensitive' } },
      ...(instagramSearch && instagramSearch !== search.toLowerCase()
        ? [{ instagramHandle: { contains: instagramSearch, mode: 'insensitive' as const } }]
        : []),
      { notizen: { contains: search, mode: 'insensitive' } },
    ]
  }

  try {
    const [orgas, total] = await Promise.all([
      prisma.orgaAquise.findMany({
        where: Object.keys(where).length ? where : undefined,
        orderBy: [
          { [sortColumn]: sortOrder },
          ...(sortColumn !== 'name' ? [{ name: 'asc' } as const] : []),
        ],
        skip,
        take: pageSize,
      }),
      prisma.orgaAquise.count({ where: Object.keys(where).length ? where : undefined }),
    ])

    return {
      orgas: orgas.map((o) => ({
        id: o.id,
        name: o.name,
        instagramHandle: o.instagramHandle,
        kontaktStatus: o.kontaktStatus,
        letzteKontaktaufnahme: o.letzteKontaktaufnahme,
        naechsteKontaktaufnahme: o.naechsteKontaktaufnahme,
        notizen: o.notizen,
        createdAt: o.createdAt,
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    }
  } catch (e) {
    const err = e as Error
    console.error('[admin/orga-aquise]', err.message, err.stack)
    throw createError({
      statusCode: 500,
      message: process.env.NODE_ENV === 'development' ? err.message : 'Fehler beim Laden',
    })
  }
})
