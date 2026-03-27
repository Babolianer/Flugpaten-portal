import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])

  const settings = await prisma.acquisitionMailSettings.findUnique({
    where: { id: 'default' },
  })

  return {
    subject: settings?.subject ?? '',
    body: settings?.body ?? '',
    footerText: settings?.footerText ?? '',
    footerHtml: settings?.footerHtml ?? '',
    footerTextDe: settings?.footerTextDe ?? settings?.footerText ?? '',
    footerTextEn: settings?.footerTextEn ?? settings?.footerText ?? '',
    footerHtmlDe: settings?.footerHtmlDe ?? settings?.footerHtml ?? '',
    footerHtmlEn: settings?.footerHtmlEn ?? settings?.footerHtml ?? '',
  }
})
