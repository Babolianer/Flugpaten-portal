import type { EmailDeliveryMode, EmailRecipientKind, Prisma } from '@prisma/client'

export type DefaultRuleRow = {
  triggerKey: string
  labelDe: string
  descriptionDe?: string | null
  enabled: boolean
  deliveryMode: EmailDeliveryMode
  recipientKind: EmailRecipientKind
  subjectTemplate: string
  bodyTemplate: string
  sortOrder: number
}

/** Fallback, falls Migration noch nicht gelaufen ist (upsert ohne Admin-Felder zu überschreiben). */
export const EMAIL_TRIGGER_DEFAULTS: DefaultRuleRow[] = [
  {
    triggerKey: 'TRANSPORT_APPLICATION_ORG',
    labelDe: 'Neue Fluganfrage (Bewerbung) → Organisation',
    descriptionDe: 'Wird ausgelöst, wenn ein Flugpate eine offene Transportanfrage bewirbt.',
    enabled: true,
    deliveryMode: 'IMMEDIATE',
    recipientKind: 'ORG_CONTACT_EMAIL',
    subjectTemplate: 'PawTransfer: Neue Fluganfrage zu „{{requestTitle}}“',
    bodyTemplate: `Hallo {{orgName}},

{{userDisplayName}} ({{userEmail}}) hat sich auf die Transportanfrage „{{requestTitle}}“ beworben.

Route: {{originAirport}} → {{destAirport}}

Nachricht des Flugpaten:
{{applicantMessage}}

Chat im Portal: {{inboxUrl}}
Transportanfrage: {{requestUrl}}`,
    sortOrder: 10,
  },
  {
    triggerKey: 'WAITING_LIST_ORG',
    labelDe: 'Warteliste → Organisation',
    descriptionDe: 'Wenn jemand auf die Warteliste einer gematchten Anfrage geht.',
    enabled: true,
    deliveryMode: 'IMMEDIATE',
    recipientKind: 'ORG_CONTACT_EMAIL',
    subjectTemplate: 'PawTransfer: Eintrag auf der Warteliste – {{requestTitle}}',
    bodyTemplate: `Hallo {{orgName}},

{{userDisplayName}} ({{userEmail}}) möchte auf die Warteliste für „{{requestTitle}}“.

Route: {{originAirport}} → {{destAirport}}

Chat: {{inboxUrl}}`,
    sortOrder: 20,
  },
  {
    triggerKey: 'ORG_REGISTRATION_PENDING_ADMIN',
    labelDe: 'Neue Organisations-Registrierung → Admin',
    descriptionDe: 'Benachrichtigt die Admin-E-Mail (ADMIN_NOTIFY_EMAIL), wenn eine Organisation sich registriert.',
    enabled: true,
    deliveryMode: 'IMMEDIATE',
    recipientKind: 'ADMIN_EMAIL',
    subjectTemplate: 'PawTransfer: Neue Organisations-Registrierung (Prüfung)',
    bodyTemplate: `Neue Organisation „{{orgName}}“ (Slug: {{orgSlug}}) hat sich registriert.

Kontakt-E-Mail Organisation: {{orgContactEmail}}
Nutzer-Konto: {{orgUserEmail}}

Admin-Bereich: {{adminUrl}}`,
    sortOrder: 30,
  },
  {
    triggerKey: 'FLUGPATE_REGISTRATION_WELCOME_USER',
    labelDe: 'Registrierung Flugpate → Willkommen (optional)',
    descriptionDe: 'Zusätzliche Mail an den neuen Flugpaten – standardmäßig aus.',
    enabled: false,
    deliveryMode: 'IMMEDIATE',
    recipientKind: 'USER_SELF',
    subjectTemplate: 'Willkommen bei PawTransfer, {{userDisplayName}}!',
    bodyTemplate: `Hallo {{userDisplayName}},

schön, dass du dabei bist. Du kannst jetzt passende Transportanfragen finden und dich bewerben.

{{appUrl}}`,
    sortOrder: 40,
  },
  {
    triggerKey: 'USER_LOGIN_SECURITY_ADMIN',
    labelDe: 'Anmeldung → Admin-Hinweis (Audit)',
    descriptionDe: 'Optional: bei jedem Login eine Info-Mail an Admin.',
    enabled: false,
    deliveryMode: 'IMMEDIATE',
    recipientKind: 'ADMIN_EMAIL',
    subjectTemplate: 'PawTransfer: Nutzer-Anmeldung {{userEmail}}',
    bodyTemplate: `Nutzer {{userDisplayName}} ({{userEmail}}) hat sich angemeldet.

Zeitpunkt: {{loginAt}}`,
    sortOrder: 50,
  },
  {
    triggerKey: 'NEWSLETTER_OPT_IN_USER',
    labelDe: 'Newsletter / Benachrichtigungen (Flugpate) → Nutzer',
    descriptionDe: 'Checkbox bei der Registrierung (Flugpate).',
    enabled: true,
    deliveryMode: 'IMMEDIATE',
    recipientKind: 'USER_SELF',
    subjectTemplate: 'PawTransfer: Benachrichtigungen aktiviert',
    bodyTemplate: `Hallo {{userDisplayName}},

du hast bei der Registrierung Benachrichtigungen / den Newsletter aktiviert. Wir halten dich auf dem Laufenden.

{{appUrl}}`,
    sortOrder: 60,
  },
  {
    triggerKey: 'NEWSLETTER_OPT_IN_ORG_USER',
    labelDe: 'Newsletter / Benachrichtigungen (Organisation) → Nutzer',
    descriptionDe: 'Checkbox bei der Organisations-Registrierung.',
    enabled: true,
    deliveryMode: 'IMMEDIATE',
    recipientKind: 'USER_SELF',
    subjectTemplate: 'PawTransfer: Benachrichtigungen aktiviert',
    bodyTemplate: `Hallo {{userDisplayName}},

du hast bei der Registrierung Benachrichtigungen / den Newsletter aktiviert.

{{appUrl}}`,
    sortOrder: 70,
  },
  {
    triggerKey: 'EMAIL_VERIFICATION_USE_CUSTOM',
    labelDe: 'E-Mail-Verifizierung: eigene Vorlage',
    descriptionDe:
      'Wenn aktiv und Text gesetzt: ersetzt die Standard-Verifizierungsmail. Sonst bleibt die Systemvorlage.',
    enabled: false,
    deliveryMode: 'IMMEDIATE',
    recipientKind: 'USER_SELF',
    subjectTemplate: 'PawTransfer: E-Mail bestätigen',
    bodyTemplate: `Hallo {{userDisplayName}},

bitte bestätige deine E-Mail-Adresse:
{{verifyUrl}}`,
    sortOrder: 80,
  },
  {
    triggerKey: 'PASSWORD_RESET_USE_CUSTOM',
    labelDe: 'Passwort zurücksetzen: eigene Vorlage',
    descriptionDe:
      'Wenn aktiv und Text gesetzt: ersetzt die Standard-Mail. Sonst bleibt die Systemvorlage.',
    enabled: false,
    deliveryMode: 'IMMEDIATE',
    recipientKind: 'USER_SELF',
    subjectTemplate: 'PawTransfer: Passwort zurücksetzen',
    bodyTemplate: `Hallo {{userDisplayName}},

du kannst dein Passwort hier zurücksetzen:
{{resetUrl}}

Der Link ist nur begrenzt gültig.`,
    sortOrder: 90,
  },
  {
    triggerKey: 'ROUTE_MATCH_DIGEST_USER',
    labelDe: 'Strecken-Benachrichtigung (Digest) → Flugpate',
    descriptionDe:
      'Sammelt neue passende Transporte zu aktivierten Strecken-Abos und sendet eine Zusammenfassung.',
    enabled: true,
    deliveryMode: 'IMMEDIATE',
    recipientKind: 'USER_SELF',
    subjectTemplate: 'PawTransfer: Neue Transporte fuer deine Strecke',
    bodyTemplate: `Hallo {{userDisplayName}},

es gibt {{requestCount}} neue Transportanfrage(n) fuer deine aktive Strecke:
{{routeSummary}}

{{requestLines}}

Direkt ansehen: {{requestsUrl}}`,
    sortOrder: 100,
  },
]

export function toPrismaCreateInput(row: DefaultRuleRow): Prisma.EmailNotificationRuleCreateInput {
  return {
    triggerKey: row.triggerKey,
    labelDe: row.labelDe,
    descriptionDe: row.descriptionDe ?? null,
    enabled: row.enabled,
    deliveryMode: row.deliveryMode,
    recipientKind: row.recipientKind,
    subjectTemplate: row.subjectTemplate,
    bodyTemplate: row.bodyTemplate,
    sortOrder: row.sortOrder,
  }
}
