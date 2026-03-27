import { randomBytes } from 'node:crypto'
import { z } from 'zod'
import { prisma } from '~~/server/utils/prisma'
import { dispatchPasswordResetEmail } from '~~/server/utils/emailTriggerEngine'

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
    select: { id: true, email: true, displayName: true },
  })

  // Immer ok zurückgeben (kein User-Enumeration)
  if (!user) {
    return { ok: true }
  }

  const token = randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 Stunde
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordResetToken: token, passwordResetTokenExpires: expires },
  })

  const config = useRuntimeConfig()
  const appUrl = (config.public?.appUrl || 'http://localhost:3000').replace(/\/$/, '')
  const resetUrl = `${appUrl}/auth/reset-password?token=${token}`

  await dispatchPasswordResetEmail(user.email, user.displayName, resetUrl, user.id)

  return { ok: true }
})
