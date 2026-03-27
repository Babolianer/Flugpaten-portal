import { prisma } from '~~/server/utils/prisma'
import { Webhook } from 'svix'

/**
 * Resend Webhook-Endpoint für E-Mail-Events (delivered, bounced, failed, etc.)
 * Öffentlich erreichbar, Absicherung über Signatur-Prüfung (Svix)
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const webhookSecret = config.resendWebhookSecret

  if (!webhookSecret) {
    console.warn('[webhooks/resend] RESEND_WEBHOOK_SECRET nicht gesetzt, Webhook-Events werden nicht verarbeitet.')
    return { received: false, reason: 'webhook_secret_not_configured' }
  }

  const svixId = getHeader(event, 'svix-id')
  const svixTimestamp = getHeader(event, 'svix-timestamp')
  const svixSignature = getHeader(event, 'svix-signature')
  const body = await readRawBody(event, 'utf8')

  if (!svixId || !svixTimestamp || !svixSignature || !body) {
    return { received: false, reason: 'missing_headers_or_body' }
  }

  // Svix Signatur-Prüfung
  const wh = new Webhook(webhookSecret)
  let payload: {
    type: string
    data?: {
      email_id?: string
      created_at?: string
      from?: string
      to?: string[]
      subject?: string
      tags?: Array<{ name: string; value: string }>
    }
  }

  try {
    payload = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as typeof payload
  } catch (e) {
    console.warn('[webhooks/resend] Signatur-Prüfung fehlgeschlagen:', e)
    return { received: false, reason: 'signature_verification_failed' }
  }


  const eventType = payload.type
  const resendId = payload.data?.email_id

  if (!resendId) {
    return { received: false, reason: 'missing_email_id' }
  }

  // Event-Typ zu MailStatus mappen
  let status: 'DELIVERED' | 'BOUNCED' | 'FAILED' | 'COMPLAINED' | null = null
  if (eventType === 'email.delivered') status = 'DELIVERED'
  else if (eventType === 'email.bounced') status = 'BOUNCED'
  else if (eventType === 'email.failed') status = 'FAILED'
  else if (eventType === 'email.complained') status = 'COMPLAINED'

  if (!status) {
    // Unbekanntes Event (z. B. email.sent, email.opened) - ignorieren oder loggen
    return { received: true, processed: false, eventType }
  }

  // Log-Einträge aktualisieren (Akquise + allgemeines Archiv)
  try {
    const [acquisitionUpdated, outboundUpdated] = await Promise.all([
      prisma.acquisitionMailLog.updateMany({
        where: { resendId },
        data: { status },
      }),
      prisma.outboundEmail.updateMany({
        where: { providerMessageId: resendId },
        data: { deliveryStatus: status },
      }),
    ])
    return {
      received: true,
      processed: true,
      eventType,
      status,
      acquisitionUpdated: acquisitionUpdated.count,
      outboundUpdated: outboundUpdated.count,
    }
  } catch (e) {
    console.error('[webhooks/resend] Fehler beim Update:', e)
    return { received: true, processed: false, error: String(e) }
  }
})
