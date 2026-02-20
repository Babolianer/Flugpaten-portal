import { geocode } from '~~/server/utils/geocode'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const address = query.address ? String(query.address).trim() : ''
  const postalCode = query.postalCode ? String(query.postalCode).trim() : ''
  const city = query.city ? String(query.city).trim() : ''
  const countryCode = query.countryCode ? String(query.countryCode).trim().toUpperCase() : ''

  const result = await geocode({ address: address || undefined, postalCode: postalCode || undefined, city: city || undefined, countryCode: countryCode || undefined })
  if (!result) {
    throw createError({ statusCode: 404, message: 'Address not found' })
  }
  return result
})
