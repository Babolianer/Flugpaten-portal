import { prisma } from '~~/server/utils/prisma'
import { sendEmail } from '~~/server/utils/sendEmail'
import { buildEmailHtml } from '~~/server/utils/emailTemplate'
import { EMAIL_TRIGGER_DEFAULTS, toPrismaCreateInput } from '~~/server/utils/emailTriggerDefaults'
import { sendVerificationEmail } from '~~/server/utils/sendVerificationEmail'
import { sendPasswordResetEmail } from '~~/server/utils/sendPasswordResetEmail'
import { loadMailFooterSettings, pickFooterForLocale } from '~~/server/utils/mailFooterSettings'

export type OrgRegistrationPayload = {
  orgName: string
  orgSlug: string
  orgContactEmail: string
  orgUserEmail: string
}

export type EmailTriggerPayload = {
  organizationId?: string
  requestId?: string
  userId?: string
  conversationId?: string
  applicantMessage?: string
  orgRegistration?: OrgRegistrationPayload
  verifyUrl?: string
  resetUrl?: string
  loginAtIso?: string
  locale?: string
  routeSummary?: string
  requestCount?: string
  requestLines?: string
}

export function applyTemplate(template: string, vars: Record<string, string>): string {
  let s = template
  for (const [k, v] of Object.entries(vars)) {
    s = s.split(`{{${k}}}`).join(v ?? '')
  }
  return s
}

export async function ensureEmailNotificationRules(): Promise<void> {
  for (const row of EMAIL_TRIGGER_DEFAULTS) {
    await prisma.emailNotificationRule.upsert({
      where: { triggerKey: row.triggerKey },
      create: toPrismaCreateInput(row),
      update: {},
    })
  }
}

function baseAppUrls(): { appUrl: string; adminUrl: string } {
  const config = useRuntimeConfig()
  const appUrl = (config.public?.appUrl || 'http://localhost:3000').replace(/\/$/, '')
  return { appUrl, adminUrl: `${appUrl}/admin` }
}

async function buildVars(triggerKey: string, payload: EmailTriggerPayload): Promise<Record<string, string> | null> {
  const { appUrl, adminUrl } = baseAppUrls()
  const base = { appUrl, adminUrl }

  if (triggerKey === 'TRANSPORT_APPLICATION_ORG' || triggerKey === 'WAITING_LIST_ORG') {
    const { organizationId, requestId, userId, conversationId, applicantMessage } = payload
    if (!organizationId || !requestId || !userId) return null
    const [org, req, user] = await Promise.all([
      prisma.organization.findUnique({
        where: { id: organizationId },
        select: { name: true, contactEmail: true },
      }),
      prisma.transportRequest.findUnique({
        where: { id: requestId },
        select: { title: true, originAirport: true, destAirport: true },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, displayName: true, preferredLanguage: true },
      }),
    ])
    if (!org || !req || !user) return null
    const inboxPath = conversationId ? `${appUrl}/inbox/${conversationId}` : `${appUrl}/inbox`
    return {
      ...base,
      orgName: org.name,
      userDisplayName: user.displayName,
      userEmail: user.email,
      locale: user.preferredLanguage,
      requestTitle: req.title,
      originAirport: req.originAirport,
      destAirport: req.destAirport,
      applicantMessage: applicantMessage ?? '',
      inboxUrl: inboxPath,
      requestUrl: `${appUrl}/requests/${requestId}`,
    }
  }

  if (triggerKey === 'ORG_REGISTRATION_PENDING_ADMIN') {
    let reg = payload.orgRegistration
    if (!reg && payload.organizationId) {
      const org = await prisma.organization.findUnique({
        where: { id: payload.organizationId },
        select: { name: true, slug: true, contactEmail: true, createdByUserId: true },
      })
      const u = org
        ? await prisma.user.findUnique({
            where: { id: org.createdByUserId },
            select: { email: true },
          })
        : null
      if (org && u) {
        reg = {
          orgName: org.name,
          orgSlug: org.slug,
          orgContactEmail: org.contactEmail,
          orgUserEmail: u.email,
        }
      }
    }
    if (!reg) return null
    return {
      ...base,
      orgName: reg.orgName,
      orgSlug: reg.orgSlug,
      orgContactEmail: reg.orgContactEmail,
      orgUserEmail: reg.orgUserEmail,
    }
  }

  if (
    triggerKey === 'FLUGPATE_REGISTRATION_WELCOME_USER' ||
    triggerKey === 'NEWSLETTER_OPT_IN_USER' ||
    triggerKey === 'NEWSLETTER_OPT_IN_ORG_USER' ||
    triggerKey === 'EMAIL_VERIFICATION_USE_CUSTOM' ||
    triggerKey === 'PASSWORD_RESET_USE_CUSTOM' ||
    triggerKey === 'ROUTE_MATCH_DIGEST_USER' ||
    triggerKey === 'USER_LOGIN_SECURITY_ADMIN'
  ) {
    if (!payload.userId) return null
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { email: true, displayName: true, preferredLanguage: true },
    })
    if (!user) return null
    const vars: Record<string, string> = {
      ...base,
      userDisplayName: user.displayName,
      userEmail: user.email,
      locale: payload.locale || user.preferredLanguage,
    }
    if (triggerKey === 'EMAIL_VERIFICATION_USE_CUSTOM' && payload.verifyUrl) {
      vars.verifyUrl = payload.verifyUrl
    }
    if (triggerKey === 'PASSWORD_RESET_USE_CUSTOM' && payload.resetUrl) {
      vars.resetUrl = payload.resetUrl
    }
    if (triggerKey === 'USER_LOGIN_SECURITY_ADMIN') {
      vars.loginAt = payload.loginAtIso ?? new Date().toISOString()
    }
    if (triggerKey === 'ROUTE_MATCH_DIGEST_USER') {
      vars.routeSummary = payload.routeSummary ?? ''
      vars.requestCount = payload.requestCount ?? '0'
      vars.requestLines = payload.requestLines ?? ''
      vars.requestsUrl = `${appUrl}/map`
    }
    if (triggerKey === 'EMAIL_VERIFICATION_USE_CUSTOM' && !payload.verifyUrl) return null
    if (triggerKey === 'PASSWORD_RESET_USE_CUSTOM' && !payload.resetUrl) return null
    return vars
  }

  return null
}

async function resolveToEmail(
  recipientKind: 'ORG_CONTACT_EMAIL' | 'USER_SELF' | 'ADMIN_EMAIL',
  payload: EmailTriggerPayload,
  vars: Record<string, string>
): Promise<string | null> {
  const config = useRuntimeConfig()
  if (recipientKind === 'ADMIN_EMAIL') {
    const to = (config.adminNotifyEmail || '').trim()
    return to || null
  }
  if (recipientKind === 'USER_SELF') {
    const e = vars.userEmail?.trim()
    return e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? e : null
  }
  if (recipientKind === 'ORG_CONTACT_EMAIL') {
    if (!payload.organizationId) return null
    const org = await prisma.organization.findUnique({
      where: { id: payload.organizationId },
      select: { contactEmail: true },
    })
    const e = org?.contactEmail?.trim() ?? ''
    return e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? e : null
  }
  return null
}

export async function sendOutboundEmailById(id: string): Promise<void> {
  const row = await prisma.outboundEmail.findUnique({ where: { id } })
  if (!row) {
    throw createError({ statusCode: 404, message: 'E-Mail nicht gefunden.' })
  }
  if (row.status !== 'QUEUED') {
    throw createError({ statusCode: 400, message: 'Nur E-Mails mit Status „Warteschlange“ können gesendet werden.' })
  }
  const config = useRuntimeConfig()
  if (!config.smtpUser || !config.smtpPass) {
    throw createError({ statusCode: 500, message: 'SMTP ist nicht konfiguriert.' })
  }
  try {
    const { messageId } = await sendEmail({
      from: config.mailFrom,
      to: row.toEmail,
      subject: row.subject,
      html: row.bodyHtml,
    })
    await prisma.outboundEmail.update({
      where: { id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        providerMessageId: messageId ?? null,
        errorMessage: null,
        deliveryStatus: null,
      },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    await prisma.outboundEmail.update({
      where: { id },
      data: { status: 'FAILED', errorMessage: msg },
    })
    throw e
  }
}

/**
 * Konfigurierbare Trigger aus der Datenbank. Fehler werden geloggt, werfen aber nicht nach außen.
 */
export function fireEmailTrigger(triggerKey: string, payload: EmailTriggerPayload): void {
  void processEmailTrigger(triggerKey, payload).catch((err) => {
    console.error('[fireEmailTrigger]', triggerKey, err)
  })
}

export async function processEmailTrigger(triggerKey: string, payload: EmailTriggerPayload): Promise<void> {
  await ensureEmailNotificationRules()
  const rule = await prisma.emailNotificationRule.findUnique({ where: { triggerKey } })
  if (!rule?.enabled) return

  const vars = await buildVars(triggerKey, payload)
  if (!vars) {
    console.warn('[processEmailTrigger] Kontext unvollständig:', triggerKey)
    return
  }

  const to = await resolveToEmail(rule.recipientKind, payload, vars)
  if (!to) {
    console.warn('[processEmailTrigger] Kein Empfänger:', triggerKey, rule.recipientKind)
    return
  }

  const config = useRuntimeConfig()
  const mailLogoUrl = config.mailLogoUrl || ''
  const subject = applyTemplate(rule.subjectTemplate, vars)
  const bodyPlain = applyTemplate(rule.bodyTemplate, vars)
  const orgLabel = vars.orgName || 'PawTransfer'
  let footer = { footerText: null as string | null, footerHtml: null as string | null }
  try {
    const footerSettings = await loadMailFooterSettings()
    footer = pickFooterForLocale(vars.locale, footerSettings)
  } catch {
    // Fallback auf buildEmailHtml-Default
  }
  const bodyHtml = buildEmailHtml(bodyPlain, orgLabel, {
    appUrl: vars.appUrl,
    logoUrl: mailLogoUrl,
    footerText: footer.footerText,
    footerHtml: footer.footerHtml,
  })

  const row = await prisma.outboundEmail.create({
    data: {
      triggerKey,
      status: 'QUEUED',
      toEmail: to,
      subject,
      bodyHtml,
      bodyPlain,
      metadata: payload as object,
      organizationId: payload.organizationId ?? null,
      requestId: payload.requestId ?? null,
      userId: payload.userId ?? null,
    },
  })

  if (rule.deliveryMode === 'IMMEDIATE') {
    await sendOutboundEmailById(row.id)
  }
}

export async function dispatchVerificationEmail(
  to: string,
  displayName: string,
  verifyUrl: string,
  userId: string
): Promise<void> {
  await ensureEmailNotificationRules()
  const rule = await prisma.emailNotificationRule.findUnique({ where: { triggerKey: 'EMAIL_VERIFICATION_USE_CUSTOM' } })
  if (rule?.enabled && rule.bodyTemplate?.trim()) {
    await processEmailTrigger('EMAIL_VERIFICATION_USE_CUSTOM', { userId, verifyUrl })
    return
  }

  const config = useRuntimeConfig()
  const from = config.mailFrom || 'PawTransfer <noreply@pawtransfer.net>'
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { preferredLanguage: true },
  })
  await sendVerificationEmail(to, displayName, verifyUrl, { from, locale: user?.preferredLanguage ?? 'de' })
  await prisma.outboundEmail.create({
    data: {
      triggerKey: 'SYSTEM_EMAIL_VERIFICATION',
      status: 'SENT',
      toEmail: to,
      subject: 'PawTransfer: E-Mail-Adresse bestätigen',
      bodyHtml: '<p style="margin:0;color:#64748b;">(Standardvorlage des Systems)</p>',
      bodyPlain: '(Standardvorlage des Systems)',
      userId,
      sentAt: new Date(),
    },
  })
}

export async function dispatchPasswordResetEmail(
  to: string,
  displayName: string,
  resetUrl: string,
  userId: string
): Promise<void> {
  await ensureEmailNotificationRules()
  const rule = await prisma.emailNotificationRule.findUnique({ where: { triggerKey: 'PASSWORD_RESET_USE_CUSTOM' } })
  if (rule?.enabled && rule.bodyTemplate?.trim()) {
    await processEmailTrigger('PASSWORD_RESET_USE_CUSTOM', { userId, resetUrl })
    return
  }

  const config = useRuntimeConfig()
  const from = config.mailFrom || 'PawTransfer <noreply@pawtransfer.net>'
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { preferredLanguage: true },
  })
  await sendPasswordResetEmail(to, displayName, resetUrl, { from, locale: user?.preferredLanguage ?? 'de' })
  await prisma.outboundEmail.create({
    data: {
      triggerKey: 'SYSTEM_PASSWORD_RESET',
      status: 'SENT',
      toEmail: to,
      subject: 'PawTransfer: Passwort zurücksetzen',
      bodyHtml: '<p style="margin:0;color:#64748b;">(Standardvorlage des Systems)</p>',
      bodyPlain: '(Standardvorlage des Systems)',
      userId,
      sentAt: new Date(),
    },
  })
}
