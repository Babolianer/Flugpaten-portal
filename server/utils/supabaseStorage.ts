import { createClient } from '@supabase/supabase-js'

const BUCKET = 'animals'
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

function getSupabase() {
  const config = useRuntimeConfig()
  const url = config.supabaseUrl
  const key = config.supabaseServiceRoleKey
  if (!url || !key) {
    throw createError({
      statusCode: 503,
      message: 'Supabase Storage nicht konfiguriert. SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY in .env bzw. Vercel setzen.',
    })
  }
  return createClient(url, key)
}

/**
 * Lädt ein Tierbild in Supabase Storage hoch und liefert die öffentliche URL.
 */
export async function uploadAnimalImage(
  organizationId: string,
  filename: string,
  data: Buffer,
  mimeType: string
): Promise<string> {
  if (data.length > MAX_IMAGE_SIZE) {
    throw createError({ statusCode: 400, message: 'Bild zu groß (max. 5 MB)' })
  }
  const mime = mimeType?.toLowerCase()
  if (mime && !ALLOWED_IMAGE_TYPES.includes(mime)) {
    throw createError({ statusCode: 400, message: 'Nur Bilder erlaubt (JPG, PNG, WebP, GIF)' })
  }

  const supabase = getSupabase()
  const ext = filename?.match(/\.(jpe?g|png|webp|gif)$/i)?.[1]?.toLowerCase() || 'jpg'
  const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) ? ext : 'jpg'
  const path = `${organizationId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${safeExt}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, data, {
    contentType: mime || `image/${safeExt}`,
    upsert: false,
  })

  if (error) {
    console.error('[supabase-storage]', error)
    throw createError({
      statusCode: 500,
      message: 'Fehler beim Hochladen des Bildes: ' + (error.message || 'Unbekannter Fehler'),
    })
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return urlData.publicUrl
}

const AVATARS_BUCKET = 'avatars'

/**
 * Lädt ein Profilbild (Avatar) in Supabase Storage hoch und liefert die öffentliche URL.
 */
export async function uploadProfileImage(
  userId: string,
  filename: string,
  data: Buffer,
  mimeType: string
): Promise<string> {
  if (data.length > MAX_IMAGE_SIZE) {
    throw createError({ statusCode: 400, message: 'Bild zu groß (max. 5 MB)' })
  }
  const mime = mimeType?.toLowerCase()
  if (mime && !ALLOWED_IMAGE_TYPES.includes(mime)) {
    throw createError({ statusCode: 400, message: 'Nur Bilder erlaubt (JPG, PNG, WebP, GIF)' })
  }

  const supabase = getSupabase()
  const ext = filename?.match(/\.(jpe?g|png|webp|gif)$/i)?.[1]?.toLowerCase() || 'jpg'
  const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) ? ext : 'jpg'
  const path = `${userId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${safeExt}`

  const { error } = await supabase.storage.from(AVATARS_BUCKET).upload(path, data, {
    contentType: mime || `image/${safeExt}`,
    upsert: false,
  })

  if (error) {
    console.error('[supabase-storage]', error)
    throw createError({
      statusCode: 500,
      message: 'Fehler beim Hochladen des Bildes: ' + (error.message || 'Unbekannter Fehler'),
    })
  }

  const { data: urlData } = supabase.storage.from(AVATARS_BUCKET).getPublicUrl(path)
  return urlData.publicUrl
}
