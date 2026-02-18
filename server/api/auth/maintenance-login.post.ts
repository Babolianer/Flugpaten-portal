import { z } from 'zod'
import { signMaintenanceBypass } from '~~/server/utils/auth'

const schema = z.object({ password: z.string().min(1) })

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const maintenancePassword = config.maintenancePassword as string

  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: 'Invalid input' })
  }

  if (parsed.data.password !== maintenancePassword) {
    throw createError({ statusCode: 401, message: 'Ungültiges Passwort' })
  }

  const token = await signMaintenanceBypass()
  setCookie(event, 'maintenance_bypass', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
    path: '/',
  })

  return { ok: true }
})
