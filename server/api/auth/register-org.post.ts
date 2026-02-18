import { z } from 'zod'
import { prisma } from '~~/server/utils/prisma'
import { hashPassword, signJwt } from '~~/server/utils/auth'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(1),
  description: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  contactEmail: z.string().email(),
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
  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: 'Invalid input', data: parsed.error.flatten() })
  }

  const { email, password, displayName, description, website, contactEmail } = parsed.data
  const name = displayName.trim()

  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    throw createError({ statusCode: 409, message: 'Email already registered' })
  }

  const slug = slugify(name)
  const existingOrg = await prisma.organization.findUnique({ where: { slug } })
  if (existingOrg) {
    throw createError({ statusCode: 409, message: 'Organization with this name already exists' })
  }

  const passwordHash = await hashPassword(password)
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: 'ORG_USER',
      displayName: name,
    },
    select: {
      id: true,
      email: true,
      role: true,
      displayName: true,
    },
  })

  const org = await prisma.organization.create({
    data: {
      name,
      slug,
      description: description?.trim() || null,
      website: website?.trim() || null,
      contactEmail: contactEmail.trim(),
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

  const token = await signJwt({ sub: user.id, role: user.role })
  const config = useRuntimeConfig()
  const cookieName = config.cookieName || 'tierschutz_session'
  setCookie(event, cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })

  return { user }
})
