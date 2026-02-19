import { z } from 'zod'
import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'
import { ensureOrgAccess } from '~~/server/utils/orgAccess'
import { uploadAnimalImage } from '~~/server/utils/supabaseStorage'

const schema = z.object({
  organizationId: z.string(),
  name: z.string().min(1),
  species: z.string().min(1),
  sex: z.string().optional(),
  sizeClass: z.string().optional(),
  birthdate: z.union([z.string(), z.date()]).optional(),
  notes: z.string().optional(),
  imageUrl: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['ORG_USER', 'ADMIN'])

  let parsed: z.infer<typeof schema>
  let imageUrl: string | null = null

  const contentType = getHeader(event, 'content-type') || ''
  if (contentType.includes('multipart/form-data')) {
    const parts = await readMultipartFormData(event)
    const body: Record<string, string> = {}
    let imagePart: { data: Buffer; filename: string; type?: string } | null = null
    for (const part of parts || []) {
      if (part.name === 'image' && part.data && part.filename) {
        imagePart = { data: part.data, filename: part.filename, type: part.type }
      } else if (part.name && part.data) {
        body[part.name] = part.data.toString('utf-8')
      }
    }
    const result = schema.safeParse(body)
    if (!result.success) {
      throw createError({ statusCode: 400, message: 'Invalid input', data: result.error.flatten() })
    }
    parsed = result.data
    if (imagePart) {
      imageUrl = await uploadAnimalImage(
        parsed.organizationId,
        imagePart.filename,
        imagePart.data,
        imagePart.type || 'image/jpeg'
      )
      ;(parsed as { imageUrl?: string }).imageUrl = imageUrl
    }
  } else {
    const body = await readBody(event)
    const result = schema.safeParse(body)
    if (!result.success) {
      throw createError({ statusCode: 400, message: 'Invalid input', data: result.error.flatten() })
    }
    parsed = result.data
  }

  await ensureOrgAccess(event, parsed.organizationId)

  const birthdate = parsed.birthdate ? new Date(parsed.birthdate as string) : null

  const animal = await prisma.animal.create({
    data: {
      organizationId: parsed.organizationId,
      name: parsed.name,
      species: parsed.species,
      sex: parsed.sex || null,
      sizeClass: parsed.sizeClass || null,
      birthdate,
      notes: parsed.notes || null,
      imageUrl: (parsed as { imageUrl?: string }).imageUrl || null,
      isActive: true,
    },
  })

  return { animal }
})
