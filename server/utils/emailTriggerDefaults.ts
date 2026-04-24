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
  subjectTemplateEn?: string
  bodyTemplateEn?: string
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
    subjectTemplateEn: 'PawTransfer: New application for "{{requestTitle}}"',
    bodyTemplate: `Hallo {{orgName}},

{{userDisplayName}} ({{userEmail}}) hat sich auf die Transportanfrage „{{requestTitle}}“ beworben.

Route: {{originAirport}} → {{destAirport}}

Nachricht des Flugpaten:
{{applicantMessage}}

Bewerbungsformular (alle Felder):
{{applicationDetails}}

{{attachmentInfo}}

Chat im Portal: {{inboxUrl}}
Transportanfrage: {{requestUrl}}`,
    bodyTemplateEn: `Hello {{orgName}},

{{userDisplayName}} ({{userEmail}}) has applied for the transport request "{{requestTitle}}".

Route: {{originAirport}} → {{destAirport}}

Message from the volunteer:
{{applicantMessage}}

Application form (all fields):
{{applicationDetails}}

{{attachmentInfo}}

Inbox in the portal: {{inboxUrl}}
Request: {{requestUrl}}`,
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
    subjectTemplateEn: 'PawTransfer: Waiting list entry – {{requestTitle}}',
    bodyTemplate: `Hallo {{orgName}},

{{userDisplayName}} ({{userEmail}}) möchte auf die Warteliste für „{{requestTitle}}“.

Route: {{originAirport}} → {{destAirport}}

Nachricht:
{{applicantMessage}}

Chat: {{inboxUrl}}`,
    bodyTemplateEn: `Hello {{orgName}},

{{userDisplayName}} ({{userEmail}}) would like to join the waiting list for "{{requestTitle}}".

Route: {{originAirport}} → {{destAirport}}

Message:
{{applicantMessage}}

Chat: {{inboxUrl}}`,
    sortOrder: 20,
  },
  {
    triggerKey: 'TRANSPORT_CANCELLED_USER',
    labelDe: 'Transport storniert → Flugpate',
    descriptionDe:
      'Wird ausgelöst, wenn eine Organisation eine Transportanfrage storniert. Informiert alle betroffenen Bewerber.',
    enabled: true,
    deliveryMode: 'IMMEDIATE',
    recipientKind: 'USER_SELF',
    subjectTemplate: 'PawTransfer: Transport „{{requestTitle}}“ wurde storniert',
    subjectTemplateEn: 'PawTransfer: Transport "{{requestTitle}}" was cancelled',
    bodyTemplate: `Hallo {{userDisplayName}},

die Transportanfrage „{{requestTitle}}“ wurde von {{orgName}} storniert.

Route: {{originAirport}} → {{destAirport}}

Du findest den Eintrag weiterhin im Dashboard mit dem Status „Storniert“.
Details: {{requestUrl}}`,
    bodyTemplateEn: `Hello {{userDisplayName}},

the transport request "{{requestTitle}}" was cancelled by {{orgName}}.

Route: {{originAirport}} → {{destAirport}}

You can still find the entry in your dashboard with status "Cancelled".
Details: {{requestUrl}}`,
    sortOrder: 25,
  },
  {
    triggerKey: 'ORG_REGISTRATION_PENDING_ADMIN',
    labelDe: 'Neue Organisations-Registrierung → Admin',
    descriptionDe: 'Benachrichtigt die Admin-E-Mail (ADMIN_NOTIFY_EMAIL), wenn eine Organisation sich registriert.',
    enabled: true,
    deliveryMode: 'IMMEDIATE',
    recipientKind: 'ADMIN_EMAIL',
    subjectTemplate: 'PawTransfer: Neue Organisations-Registrierung (Prüfung)',
    subjectTemplateEn: 'PawTransfer: New organisation registration (review)',
    bodyTemplate: `Neue Organisation „{{orgName}}“ (Slug: {{orgSlug}}) hat sich registriert.

Kontakt-E-Mail Organisation: {{orgContactEmail}}
Nutzer-Konto: {{orgUserEmail}}

Admin-Bereich: {{adminUrl}}`,
    bodyTemplateEn: `New organisation "{{orgName}}" (slug: {{orgSlug}}) has registered.

Organisation contact email: {{orgContactEmail}}
User account: {{orgUserEmail}}

Admin area: {{adminUrl}}`,
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
    subjectTemplateEn: 'Welcome to PawTransfer, {{userDisplayName}}!',
    bodyTemplate: `Hallo {{userDisplayName}},

schön, dass du dabei bist. Du kannst jetzt passende Transportanfragen finden und dich bewerben.

{{appUrl}}`,
    bodyTemplateEn: `Hello {{userDisplayName}},

great to have you on board. You can now find suitable transport requests and apply.

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
    subjectTemplateEn: 'PawTransfer: User login {{userEmail}}',
    bodyTemplate: `Nutzer {{userDisplayName}} ({{userEmail}}) hat sich angemeldet.

Zeitpunkt: {{loginAt}}`,
    bodyTemplateEn: `User {{userDisplayName}} ({{userEmail}}) has logged in.

Time: {{loginAt}}`,
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
    subjectTemplateEn: 'PawTransfer: Notifications enabled',
    bodyTemplate: `Hallo {{userDisplayName}},

du hast bei der Registrierung Benachrichtigungen / den Newsletter aktiviert. Wir halten dich auf dem Laufenden.

{{appUrl}}`,
    bodyTemplateEn: `Hello {{userDisplayName}},

you enabled notifications / the newsletter during registration. We will keep you posted.

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
    subjectTemplateEn: 'PawTransfer: Notifications enabled',
    bodyTemplate: `Hallo {{userDisplayName}},

du hast bei der Registrierung Benachrichtigungen / den Newsletter aktiviert.

{{appUrl}}`,
    bodyTemplateEn: `Hello {{userDisplayName}},

you enabled notifications during organisation registration.

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
    subjectTemplateEn: 'PawTransfer: Confirm your email',
    bodyTemplate: `Hallo {{userDisplayName}},

bitte bestätige deine E-Mail-Adresse:
{{verifyUrl}}`,
    bodyTemplateEn: `Hello {{userDisplayName}},

please confirm your email address:
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
    subjectTemplateEn: 'PawTransfer: Reset your password',
    bodyTemplate: `Hallo {{userDisplayName}},

du kannst dein Passwort hier zurücksetzen:
{{resetUrl}}

Der Link ist nur begrenzt gültig.`,
    bodyTemplateEn: `Hello {{userDisplayName}},

you can reset your password here:
{{resetUrl}}

The link is only valid for a limited time.`,
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
    subjectTemplateEn: 'PawTransfer: New transports for your route',
    bodyTemplate: `Hallo {{userDisplayName}},

es gibt {{requestCount}} neue Transportanfrage(n) fuer deine aktive Strecke:
{{routeSummary}}

{{requestLines}}

Direkt ansehen: {{requestsUrl}}`,
    bodyTemplateEn: `Hello {{userDisplayName}},

there are {{requestCount}} new transport request(s) for your subscribed route:
{{routeSummary}}

{{requestLines}}

View on the map: {{requestsUrl}}`,
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
    subjectTemplateEn: row.subjectTemplateEn ?? null,
    bodyTemplateEn: row.bodyTemplateEn ?? null,
    sortOrder: row.sortOrder,
  }
}
