import { reverseGeocode } from '~~/server/utils/geocode'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const lat = query.lat != null ? parseFloat(String(query.lat)) : NaN
  const lng = query.lng != null ? parseFloat(String(query.lng)) : NaN

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw createError({ statusCode: 400, message: 'lat and lng required' })
  }

  const result = await reverseGeocode(lat, lng)
  if (!result) {
    throw createError({
      statusCode: 503,
      message: 'Geocoding service temporarily unavailable. Please try again or enter the address manually.',
    })
  }
  return result
})
