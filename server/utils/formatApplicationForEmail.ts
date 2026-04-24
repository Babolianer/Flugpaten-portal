export type ApplicationEmailLang = 'de' | 'en'

export function emailLangFromLocale(locale: string | null | undefined): ApplicationEmailLang {
  return (locale || '').trim().toLowerCase().startsWith('en') ? 'en' : 'de'
}

const LABELS: Record<ApplicationEmailLang, Record<string, string>> = {
  de: {
    vorname: 'Vorname',
    nachname: 'Nachname',
    anzahlPersonen: 'Anzahl Personen',
    abflughafen: 'Abflughafen',
    ankunftsflughafen: 'Ankunftsflughafen',
    fluggesellschaft: 'Fluggesellschaft',
    reiseVon: 'Reise von',
    reiseBis: 'Reise bis',
    email: 'E-Mail',
    telefon: 'Telefon',
    handy: 'Mobil',
    reisende: 'Reisende',
  },
  en: {
    vorname: 'First name',
    nachname: 'Last name',
    anzahlPersonen: 'Number of travellers',
    abflughafen: 'Departure airport',
    ankunftsflughafen: 'Arrival airport',
    reiseVon: 'Travel from',
    reiseBis: 'Travel until',
    email: 'Email',
    telefon: 'Phone',
    handy: 'Mobile',
    reisende: 'Travellers',
  },
}

function labelFor(key: string, lang: ApplicationEmailLang): string {
  return LABELS[lang][key] ?? key
}

/**
 * Formatiert die JSON-Bewerbungsdaten aus dem Formular für den E-Mail-Text (Plain).
 */
export function formatApplicationDataForEmail(applicationData: unknown, lang: ApplicationEmailLang): string {
  if (applicationData == null) {
    return lang === 'en' ? '(No application form data submitted.)' : '(Keine Formulardaten übermittelt.)'
  }
  if (typeof applicationData !== 'object' || Array.isArray(applicationData)) {
    return String(applicationData)
  }
  const o = applicationData as Record<string, unknown>
  const keys = Object.keys(o).filter((k) => o[k] !== undefined && o[k] !== null && o[k] !== '')
  if (keys.length === 0) {
    return lang === 'en' ? '(No application form data submitted.)' : '(Keine Formulardaten übermittelt.)'
  }

  const lines: string[] = []
  const ordered = [
    'vorname',
    'nachname',
    'anzahlPersonen',
    'reisende',
    'abflughafen',
    'ankunftsflughafen',
    'fluggesellschaft',
    'reiseVon',
    'reiseBis',
    'email',
    'telefon',
    'handy',
  ]
  const seen = new Set<string>()

  for (const k of ordered) {
    if (!(k in o)) continue
    seen.add(k)
    const v = o[k]
    if (v === undefined || v === null || v === '') continue
    if (k === 'reisende' && Array.isArray(v)) {
      lines.push(`${labelFor(k, lang)}:`)
      v.forEach((item, i) => {
        if (item && typeof item === 'object') {
          const tr = item as Record<string, unknown>
          const name = [tr.vorname, tr.nachname].filter(Boolean).join(' ')
          lines.push(`  ${i + 1}. ${name || `#${i + 1}`}`)
        } else {
          lines.push(`  ${i + 1}. ${String(item)}`)
        }
      })
      continue
    }
    lines.push(`${labelFor(k, lang)}: ${String(v)}`)
  }

  for (const k of keys) {
    if (seen.has(k)) continue
    const v = o[k]
    if (typeof v === 'object') {
      lines.push(`${labelFor(k, lang)}: ${JSON.stringify(v)}`)
    } else {
      lines.push(`${labelFor(k, lang)}: ${String(v)}`)
    }
  }

  return lines.join('\n')
}

export function formatAttachmentLineForEmail(
  appUrl: string,
  attachmentPath: string | null | undefined,
  lang: ApplicationEmailLang
): string {
  const base = appUrl.replace(/\/$/, '')
  if (!attachmentPath?.trim()) {
    return lang === 'en' ? 'Document upload: none' : 'Dokumenten-Upload: keiner'
  }
  const p = attachmentPath.trim()
  const full = p.startsWith('http') ? p : `${base}${p.startsWith('/') ? '' : '/'}${p}`
  return lang === 'en'
    ? `Uploaded document (open in browser):\n${full}`
    : `Hochgeladenes Dokument (Link im Browser öffnen):\n${full}`
}
