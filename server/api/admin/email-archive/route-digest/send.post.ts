import { requireRole } from '~~/server/utils/auth'
import { processDueRouteDigestBatches } from '~~/server/utils/routeNotifications'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  const result = await processDueRouteDigestBatches()
  return result
})
