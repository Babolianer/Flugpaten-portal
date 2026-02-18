import { airports, airportRegions } from '~~/server/utils/airports'

export default defineEventHandler(() => {
  return { airports, regions: airportRegions }
})
