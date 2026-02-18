import { prisma } from '~~/server/utils/prisma'

export default defineEventHandler(async () => {
  const row = await prisma.siteSetting.findUnique({
    where: { key: 'maintenanceMode' },
  })
  const maintenance = row?.value === 'true'
  return { maintenance }
})
