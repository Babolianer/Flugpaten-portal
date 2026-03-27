import { sendEmail } from '~~/server/utils/sendEmail'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export async function sendPasswordResetEmail(
  to: string,
  displayName: string,
  resetUrl: string,
  config: { from: string }
): Promise<void> {
  const html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Passwort zurücksetzen – PawTransfer</title>
</head>
<body style="margin: 0; padding: 20px; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1e293b; font-size: 15px;">
  <div style="max-width: 580px; margin: 0 auto;">
    <p style="margin: 0 0 1em 0;">Hallo ${escapeHtml(displayName)},</p>
    <p style="margin: 0 0 1em 0;">du hast eine Anfrage zum Zurücksetzen deines Passworts bei PawTransfer gestellt. Klicke auf den folgenden Button, um ein neues Passwort zu vergeben.</p>
    <p style="margin: 1.5em 0;">
      <a href="${escapeHtml(resetUrl)}" style="display: inline-block; padding: 12px 24px; background-color: #f59e0b; color: #1e293b; text-decoration: none; font-weight: 600; border-radius: 8px;">Passwort zurücksetzen</a>
    </p>
    <p style="margin: 1em 0 0 0; font-size: 13px; color: #64748b;">Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:<br>
    <a href="${escapeHtml(resetUrl)}" style="color: #0ea5e9; word-break: break-all;">${escapeHtml(resetUrl)}</a></p>
    <p style="margin: 1.5em 0 0 0; font-size: 13px; color: #64748b;">Der Link ist 1 Stunde gültig. Falls du die Anfrage nicht gestellt hast, ignoriere diese E-Mail.</p>
    <p style="margin: 2em 0 0 0; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">PawTransfer – Flugpaten-Portal</p>
  </div>
</body>
</html>`

  await sendEmail({
    to,
    subject: 'PawTransfer: Passwort zurücksetzen',
    html,
    from: config.from,
  })
}
