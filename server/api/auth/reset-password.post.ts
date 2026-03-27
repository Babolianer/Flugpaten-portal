import { z } from 'zod'
import { prisma } from '~~/server/utils/prisma'
import { hashPassword } from '~~/server/utils/auth'

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, 'Passwort muss mindestens 8 Zeichen haben'),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    const msg = parsed.error.errors[0]?.message || 'Ungültige Eingabe'
    throw createError({ statusCode: 400, message: msg })
  }
  const { token, password } = parsed.data

  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetTokenExpires: { gt: new Date() },
    },
    select: { id: true },
  })

  if (!user) {
    throw createError({ statusCode: 400, message: 'Link ungültig oder abgelaufen. Bitte fordere einen neuen Link an.' })
  }

  const passwordHash = await hashPassword(password)
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetToken: null,
      passwordResetTokenExpires: null,
    },
  })

  return { ok: true }
})
