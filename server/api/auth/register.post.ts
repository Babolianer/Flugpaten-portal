import { z } from 'zod'
import { prisma } from '~~/server/utils/prisma'
import { hashPassword } from '~~/server/utils/auth'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['USER', 'ORG_USER']),
  displayName: z.string().min(1),
  phone: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: 'Invalid input', data: parsed.error.flatten() })
  }

  const { email, password, role, displayName, phone } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    throw createError({ statusCode: 409, message: 'Email already registered' })
  }

  const passwordHash = await hashPassword(password)
  const user = await prisma.user.create({
    data: { email, passwordHash, role, displayName, phone },
    select: {
      id: true,
      email: true,
      role: true,
      displayName: true,
      phone: true,
      createdAt: true,
    },
  })

  return { user }
})
