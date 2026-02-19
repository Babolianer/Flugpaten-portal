import { z } from 'zod'
import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'
import { ensureOrgAccess } from '~~/server/utils/orgAccess'
import { uploadAnimalImage } from '~~/server/utils/supabaseStorage'

const schema = z.object({
  name: z.string().min(1).optional(),
  species: z.string().min(1).optional(),
  sex: z.string().optional().nullable(),
  sizeClass: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
})

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['ORG_USER', 'ADMIN'])
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 404 })

  const animal = await prisma.animal.findFirst({
    where: { id },
    include: { organization: true },
  })
  if (!animal) throw createError({ statusCode: 404 })

  await ensureOrgAccess(event, animal.organizationId)

  let data: Partial<{ name: string; species: string; sex: string | null; sizeClass: string | null; notes: string | null; isActive: boolean; imageUrl: string | null }> = {}

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
    const parsed = result.data
    if (parsed.name != null) data.name = parsed.name
    if (parsed.species != null) data.species = parsed.species
    if (parsed.sex !== undefined) data.sex = parsed.sex
    if (parsed.sizeClass !== undefined) data.sizeClass = parsed.sizeClass
    if (parsed.notes !== undefined) data.notes = parsed.notes
    if (parsed.isActive !== undefined) data.isActive = parsed.isActive

    if (imagePart) {
      data.imageUrl = await uploadAnimalImage(
        animal.organizationId,
        imagePart.filename,
        imagePart.data,
        imagePart.type || 'image/jpeg'
      )
    }
  } else {
    const body = await readBody(event)
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      throw createError({ statusCode: 400, message: 'Invalid input', data: parsed.error.flatten() })
    }
    if (parsed.data.name != null) data.name = parsed.data.name
    if (parsed.data.species != null) data.species = parsed.data.species
    if (parsed.data.sex !== undefined) data.sex = parsed.data.sex
    if (parsed.data.sizeClass !== undefined) data.sizeClass = parsed.data.sizeClass
    if (parsed.data.notes !== undefined) data.notes = parsed.data.notes
    if (parsed.data.isActive !== undefined) data.isActive = parsed.data.isActive
  }

  const updated = await prisma.animal.update({
    where: { id },
    data,
  })
  return { animal: updated }
})
