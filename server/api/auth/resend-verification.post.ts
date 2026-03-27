import { randomBytes } from 'node:crypto'
import { z } from 'zod'
import { prisma } from '~~/server/utils/prisma'
import { dispatchVerificationEmail } from '~~/server/utils/emailTriggerEngine'

const schema = z.object({
  email: z.string().email(),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: 'Ungültige E-Mail-Adresse.' })
  }
  const { email } = parsed.data

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, displayName: true, emailVerified: true },
  })
  if (!user) {
    return { ok: true }
  }
  if (user.emailVerified) {
    return { ok: true }
  }

  const token = randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)
  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerifyToken: token, emailVerifyTokenExpires: expires },
  })

  const config = useRuntimeConfig()
  const appUrl = (config.public?.appUrl || 'http://localhost:3000').replace(/\/$/, '')
  const verifyUrl = `${appUrl}/auth/verify-email?token=${token}`

  await dispatchVerificationEmail(user.email, user.displayName, verifyUrl, user.id)

  return { ok: true }
})
