import { z } from 'zod'
import { translateText } from '~~/server/utils/translate'

const schema = z.object({
  text: z.string(),
  targetLang: z.string().min(1),
  sourceLang: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: 'text und targetLang erforderlich' })
  }

  const { text, targetLang, sourceLang = 'de' } = parsed.data
  const translated = await translateText(text, targetLang, sourceLang)

  return { translated }
})
