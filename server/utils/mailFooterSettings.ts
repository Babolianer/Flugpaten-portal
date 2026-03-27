import { prisma } from '~~/server/utils/prisma'

export type MailFooterSettings = {
  footerTextDe: string | null
  footerTextEn: string | null
  footerHtmlDe: string | null
  footerHtmlEn: string | null
}

export async function loadMailFooterSettings(): Promise<MailFooterSettings> {
  const settings = await prisma.acquisitionMailSettings.findUnique({
    where: { id: 'default' },
  })

  // Backward-compatibility: vorhandene globale Footer-Felder als DE/EN-Fallback nutzen.
  const fallbackText = settings?.footerText ?? null
  const fallbackHtml = settings?.footerHtml ?? null

  return {
    footerTextDe: settings?.footerTextDe ?? fallbackText,
    footerTextEn: settings?.footerTextEn ?? fallbackText,
    footerHtmlDe: settings?.footerHtmlDe ?? fallbackHtml,
    footerHtmlEn: settings?.footerHtmlEn ?? fallbackHtml,
  }
}

export function pickFooterForLocale(
  locale: string | null | undefined,
  footer: MailFooterSettings
): { footerText: string | null; footerHtml: string | null } {
  const normalized = (locale || '').trim().toLowerCase()
  if (normalized.startsWith('en')) {
    return {
      footerText: footer.footerTextEn ?? footer.footerTextDe ?? null,
      footerHtml: footer.footerHtmlEn ?? footer.footerHtmlDe ?? null,
    }
  }
  return {
    footerText: footer.footerTextDe ?? footer.footerTextEn ?? null,
    footerHtml: footer.footerHtmlDe ?? footer.footerHtmlEn ?? null,
  }
}
