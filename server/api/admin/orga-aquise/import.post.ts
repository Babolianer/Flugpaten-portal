import Papa from 'papaparse'
import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

// Flexibles Mapping: Unterstützt verschiedene CSV-Spaltennamen (case-insensitive)
function getValue(row: Record<string, string>, ...keys: string[]): string | null {
  const lowerRow: Record<string, string> = {}
  for (const [k, v] of Object.entries(row)) {
    lowerRow[k.toLowerCase().trim()] = v?.trim() || ''
  }
  for (const key of keys) {
    const val = lowerRow[key.toLowerCase()]
    if (val) return val
  }
  return null
}

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])

  const formData = await readMultipartFormData(event)
  const file = formData?.find((f) => f.name === 'file' && f.data)
  if (!file?.data) {
    throw createError({ statusCode: 400, message: 'Keine CSV-Datei hochgeladen' })
  }

  const csvText = new TextDecoder('utf-8').decode(file.data)
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  })

  if (parsed.errors.length) {
    throw createError({
      statusCode: 400,
      message: `CSV-Fehler: ${parsed.errors[0]?.message || 'Ungültiges Format'}`,
    })
  }

  const today = new Date()
  const naechsteDefault = addDays(today, 3)

  const toInsert: {
    name: string
    instagramHandle: string | null
    kontaktStatus: string
    letzteKontaktaufnahme: null
    naechsteKontaktaufnahme: Date
    notizen: string | null
  }[] = []

  for (const row of parsed.data) {
    const name = getValue(row, 'name', 'Name', 'organisation', 'org') || getValue(row, 'organisation_name', 'org_name')
    if (!name) continue

    const instagramHandle =
      getValue(row, 'instagram', 'instagram_handle', 'handle', 'insta', 'ig') || null

    toInsert.push({
      name,
      instagramHandle,
      kontaktStatus: 'nicht kontaktiert',
      letzteKontaktaufnahme: null,
      naechsteKontaktaufnahme: naechsteDefault,
      notizen: null,
    })
  }

  if (toInsert.length === 0) {
    throw createError({
      statusCode: 400,
      message: 'Keine gültigen Zeilen in der CSV gefunden. Erwartete Spalte: name oder Name',
    })
  }

  try {
    await prisma.orgaAquise.createMany({ data: toInsert })
    return { imported: toInsert.length }
  } catch (e) {
    const err = e as Error
    console.error('[admin/orga-aquise/import]', err.message, err.stack)
    throw createError({
      statusCode: 500,
      message: process.env.NODE_ENV === 'development' ? err.message : 'Fehler beim Import',
    })
  }
})
