import { sendEmail } from '~~/server/utils/sendEmail'
import { buildEmailHtml } from '~~/server/utils/emailTemplate'
import { loadMailFooterSettings, pickFooterForLocale } from '~~/server/utils/mailFooterSettings'

/**
 * Sendet die E-Mail-Verifizierungsmail an den Nutzer.
 */
export async function sendVerificationEmail(
  to: string,
  displayName: string,
  verifyUrl: string,
  config: { from: string; locale?: string | null }
): Promise<void> {
  const bodyPlain = `Hallo ${displayName},

vielen Dank für deine Registrierung bei PawTransfer. Bitte bestätige deine E-Mail-Adresse:
${verifyUrl}`
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
    subject: 'PawTransfer: E-Mail-Adresse bestätigen',
    html,
    from: config.from,
  })
}
