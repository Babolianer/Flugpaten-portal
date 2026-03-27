import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'
import { sendEmail } from '~~/server/utils/sendEmail'
import { buildEmailHtml } from '~~/server/utils/emailTemplate'
import { loadMailFooterSettings, pickFooterForLocale } from '~~/server/utils/mailFooterSettings'

function replacePlaceholders(text: string, name: string): string {
  return text
    .replace(/\{\{Tierschutzorga\.\}\}/g, name)
    .replace(/\{\{Tierschutzorga\}\}/g, name)
    .replace(/\{\{name\}\}/g, name)
    .replace(/\{\{organisation\}\}/g, name)
}

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])

  const config = useRuntimeConfig()
  const mailFrom = config.mailFrom
  const mailLogoUrl = config.mailLogoUrl || ''
  const appUrl = config.public.appUrl

  if (!config.smtpUser || !config.smtpPass) {
    throw createError({
      statusCode: 500,
      message: 'SMTP ist nicht konfiguriert. Bitte SMTP_USER und SMTP_PASS in .env eintragen.',
    })
  }

  const body = await readBody<{ subject: string; body: string; testTo?: string; testName?: string }>(event)
  const subject = typeof body?.subject === 'string' ? body.subject.trim() : ''
  const bodyText = typeof body?.body === 'string' ? body.body : ''
  const testTo = typeof body?.testTo === 'string' ? body.testTo.trim() : ''
  const testName = typeof body?.testName === 'string' ? body.testName.trim() || 'Test-Organisation' : 'Test-Organisation'

  if (!subject || !bodyText) {
    throw createError({
      statusCode: 400,
      message: 'Betreff und E-Mail-Text sind erforderlich.',
    })
  }

  let footerSettings: Awaited<ReturnType<typeof loadMailFooterSettings>> | null = null
  try {
    footerSettings = await loadMailFooterSettings()
  } catch {
    // Tabelle ggf. noch nicht migriert
  }

  // Nur Test-E-Mail an eine Adresse
  if (testTo) {
    const email = testTo
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw createError({ statusCode: 400, message: 'Ungültige E-Mail-Adresse.' })
    }
    const bodyWithPlaceholders = replacePlaceholders(bodyText, testName)
    const selectedFooter = pickFooterForLocale('de', footerSettings ?? {
      footerTextDe: null,
      footerTextEn: null,
      footerHtmlDe: null,
      footerHtmlEn: null,
    })
    const html = buildEmailHtml(bodyWithPlaceholders, testName, {
      appUrl,
      logoUrl: mailLogoUrl,
      footerText: selectedFooter.footerText,
      footerHtml: selectedFooter.footerHtml,
    })
    await sendEmail({
      from: mailFrom,
      to: email,
      subject: replacePlaceholders(subject, testName),
      html,
    })
    return { test: true, sent: 1, resendId: `smtp-test-${Date.now()}` }
  }

  const contacts = await prisma.acquisitionContact.findMany({
    where: {
      email: { not: null, notIn: [''] },
    },
    select: { id: true, name: true, email: true, websiteLanguage: true },
  })

  let sent = 0
  const errors: string[] = []

  for (const c of contacts) {
    const email = c.email!
    const bodyWithPlaceholders = replacePlaceholders(bodyText, c.name)
    const selectedFooter = pickFooterForLocale(c.websiteLanguage, footerSettings ?? {
      footerTextDe: null,
      footerTextEn: null,
      footerHtmlDe: null,
      footerHtmlEn: null,
    })
    const html = buildEmailHtml(bodyWithPlaceholders, c.name, {
      appUrl,
      logoUrl: mailLogoUrl,
      footerText: selectedFooter.footerText,
      footerHtml: selectedFooter.footerHtml,
    })

    try {
      await sendEmail({
        from: mailFrom,
        to: email,
        subject: replacePlaceholders(subject, c.name),
        html,
      })
      sent++
      const smtpId = `smtp-${Date.now()}-${c.id}`
      await prisma.acquisitionMailLog.create({
        data: {
          acquisitionContactId: c.id,
          resendId: smtpId,
          status: 'SENT',
        },
      })
      await prisma.acquisitionContact.update({
        where: { id: c.id },
        data: { emailSent: true },
      })
    } catch (e) {
      const err = e as Error
      const errMsg = `${c.name} (${email}): ${err.message}`
      errors.push(errMsg)
      console.error('[acquise/send-mail] Exception:', errMsg, err.stack)
      try {
        await prisma.acquisitionMailLog.create({
          data: {
            acquisitionContactId: c.id,
            resendId: `error-${Date.now()}-${c.id}`,
            status: 'FAILED',
          },
        })
      } catch {}
    }
    await new Promise((r) => setTimeout(r, 200))
  }

  if (errors.length > 0) {
    console.warn('[acquise/send-mail] Massenversand: %d versendet, %d fehlgeschlagen. Fehler: %s', sent, errors.length, errors.slice(0, 5).join('; '))
  } else {
    console.info('[acquise/send-mail] Massenversand: %d E-Mails versendet.', sent)
  }

  return {
    sent,
    failed: contacts.length - sent,
    total: contacts.length,
    errors: errors.length > 0 ? errors : undefined,
  }
})
