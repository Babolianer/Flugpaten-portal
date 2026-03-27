import nodemailer from 'nodemailer'

/**
 * Sendet E-Mails via Hostinger SMTP (oder anderem SMTP-Server).
 */
export async function sendEmail(options: {
  to: string
  subject: string
  html: string
  from?: string
}): Promise<{ messageId?: string }> {
  const config = useRuntimeConfig()
  const host = config.smtpHost
  const user = config.smtpUser
  const pass = config.smtpPass

  if (!host || !user || !pass) {
    throw new Error('SMTP ist nicht konfiguriert. Bitte SMTP_HOST, SMTP_USER und SMTP_PASS in .env eintragen.')
  }

  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecure,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass,
    },
  })

  const info = await transporter.sendMail({
    from: options.from || config.mailFrom,
    to: options.to,
    subject: options.subject,
    html: options.html,
  })
  return { messageId: typeof info.messageId === 'string' ? info.messageId : undefined }
}
