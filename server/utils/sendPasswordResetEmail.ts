import { sendEmail } from '~~/server/utils/sendEmail'
import { buildEmailHtml } from '~~/server/utils/emailTemplate'
import { loadMailFooterSettings, pickFooterForLocale } from '~~/server/utils/mailFooterSettings'

export async function sendPasswordResetEmail(
  to: string,
  displayName: string,
  resetUrl: string,
  config: { from: string; locale?: string | null }
): Promise<void> {
  const bodyPlain = `Hallo ${displayName},

du hast eine Anfrage zum Zurücksetzen deines Passworts bei PawTransfer gestellt.
Hier kannst du ein neues Passwort vergeben:
${resetUrl}

Der Link ist 1 Stunde gültig. Falls du die Anfrage nicht gestellt hast, ignoriere diese E-Mail.`
  const runtimeConfig = useRuntimeConfig()
  const appUrl = (runtimeConfig.public?.appUrl || '').trim()

  let footerText: string | null = null
  let footerHtml: string | null = null
  try {
    const footerSettings = await loadMailFooterSettings()
    const selected = pickFooterForLocale(config.locale, footerSettings)
    footerText = selected.footerText
    footerHtml = selected.footerHtml
  } catch {
    // Default-Fallback in buildEmailHtml
  }
  const html = buildEmailHtml(bodyPlain, 'PawTransfer', {
    appUrl,
    logoUrl: runtimeConfig.mailLogoUrl || '',
    footerText,
    footerHtml,
    showAppInterestLink: false,
    showDefaultSignOff: false,
  })

  await sendEmail({
    to,
    subject: 'PawTransfer: Passwort zurücksetzen',
    html,
    from: config.from,
  })
}
