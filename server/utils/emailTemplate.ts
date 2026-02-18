const DEFAULT_FOOTER = 'Aaron Löchner · aaron.loechner@gmx.de · 015224822057'

/**
 * E-Mail-Template für Acquise-Versand – wirkt wie eine normale persönliche E-Mail.
 * footerText: im Frontend einstellbar, kein Link (kein localhost im Footer).
 * Plattform-Link nur, wenn appUrl keine Localhost-URL ist.
 */
export function buildEmailHtml(
  bodyPlain: string,
  _organisationName: string,
  config: { appUrl: string; logoUrl?: string; footerText?: string | null }
): string {
  const paragraphs = bodyPlain
    .split(/\n\n+/)
    .map((p) => {
      const trimmed = p.trim()
      if (!trimmed) return ''
      return `<p style="margin: 0 0 1em 0; color: #1e293b;">${escapeHtml(trimmed).replace(/\n/g, '<br>')}</p>`
    })
    .filter((p) => p)
    .join('')

  const appUrl = (config.appUrl || '').trim()
  const isProductionUrl = appUrl.length > 0 && !appUrl.includes('localhost')
  const platformLinkHtml = isProductionUrl
    ? `<p style="margin: 1.5em 0 0 0; color: #1e293b;">Falls ihr Interesse habt: <a href="${escapeHtml(appUrl)}" style="color: #0ea5e9;">${escapeHtml(appUrl)}</a></p>`
    : ''

  const footerRaw = (config.footerText && config.footerText.trim()) || DEFAULT_FOOTER
  const footerHtml = `<p style="margin: 2em 0 0 0; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">${escapeHtml(footerRaw).replace(/\n/g, '<br>')}</p>`

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Flugpaten-Portal</title>
</head>
<body style="margin: 0; padding: 20px; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1e293b; font-size: 15px;">
  <div style="max-width: 580px; margin: 0 auto;">
    ${paragraphs}
    ${platformLinkHtml}
    <p style="margin: 1.5em 0 0 0; color: #1e293b;">
      Herzliche Grüße<br>
      Aaron
    </p>
    ${footerHtml}
  </div>
</body>
</html>`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
