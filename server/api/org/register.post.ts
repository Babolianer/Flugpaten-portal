import { z } from 'zod'
import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'

const schema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  contactEmail: z.string().email(),
  preferredLanguage: z.enum(['de', 'en', 'fr', 'es', 'it', 'pl']).optional(),
})

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['ORG_USER', 'ADMIN'])

  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: 'Invalid input', data: parsed.error.flatten() })
  }

  const { name, description, website, contactEmail, preferredLanguage } = parsed.data
  const slug = slugify(name)

  const existing = await prisma.organization.findUnique({ where: { slug } })
  if (existing) {
    throw createError({ statusCode: 409, message: 'Organization with this name already exists' })
  }

  const org = await prisma.organization.create({
    data: {
      name,
      slug,
      description: description || null,
      website: website || null,
      preferredLanguage: preferredLanguage || 'de',
      contactEmail,
      status: 'PENDING',
      createdByUserId: user.id,
    },
  })

  await prisma.organizationMember.create({
    data: {
      organizationId: org.id,
      userId: user.id,
      memberRole: 'OWNER',
    },
  })

  return { organization: org }
})
