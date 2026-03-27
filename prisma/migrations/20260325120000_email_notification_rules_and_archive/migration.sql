-- CreateEnum
CREATE TYPE "EmailDeliveryMode" AS ENUM ('IMMEDIATE', 'QUEUED');

-- CreateEnum
CREATE TYPE "EmailRecipientKind" AS ENUM ('ORG_CONTACT_EMAIL', 'USER_SELF', 'ADMIN_EMAIL');

-- CreateEnum
CREATE TYPE "OutboundEmailStatus" AS ENUM ('QUEUED', 'SENT', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "email_notification_rules" (
    "trigger_key" TEXT NOT NULL,
    "label_de" TEXT NOT NULL,
    "description_de" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "delivery_mode" "EmailDeliveryMode" NOT NULL DEFAULT 'IMMEDIATE',
    "recipient_kind" "EmailRecipientKind" NOT NULL,
    "subject_template" TEXT NOT NULL,
    "body_template" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_notification_rules_pkey" PRIMARY KEY ("trigger_key")
);

-- CreateTable
CREATE TABLE "outbound_emails" (
    "id" TEXT NOT NULL,
    "trigger_key" TEXT NOT NULL,
    "status" "OutboundEmailStatus" NOT NULL DEFAULT 'QUEUED',
    "to_email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body_html" TEXT NOT NULL,
    "body_plain" TEXT,
    "metadata" JSONB,
    "organization_id" TEXT,
    "request_id" TEXT,
    "user_id" TEXT,
    "provider_message_id" TEXT,
    "delivery_status" "MailStatus",
    "error_message" TEXT,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outbound_emails_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "outbound_emails_trigger_key_created_at_idx" ON "outbound_emails"("trigger_key", "created_at" DESC);

-- CreateIndex
CREATE INDEX "outbound_emails_status_created_at_idx" ON "outbound_emails"("status", "created_at" DESC);

-- Default-Regeln (Admin kann alles überschreiben)
INSERT INTO "email_notification_rules" ("trigger_key","label_de","description_de","enabled","delivery_mode","recipient_kind","subject_template","body_template","sort_order","created_at","updated_at") VALUES
('TRANSPORT_APPLICATION_ORG','Neue Fluganfrage (Bewerbung) → Organisation','Wird ausgelöst, wenn ein Flugpate eine offene Transportanfrage bewirbt.',true,'IMMEDIATE','ORG_CONTACT_EMAIL','PawTransfer: Neue Fluganfrage zu „{{requestTitle}}“','Hallo {{orgName}},

{{userDisplayName}} ({{userEmail}}) hat sich auf die Transportanfrage „{{requestTitle}}“ beworben.

Route: {{originAirport}} → {{destAirport}}

Nachricht des Flugpaten:
{{applicantMessage}}

Chat im Portal: {{inboxUrl}}
Transportanfrage: {{requestUrl}}',10,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('WAITING_LIST_ORG','Warteliste → Organisation','Wenn jemand auf die Warteliste einer gematchten Anfrage geht.',true,'IMMEDIATE','ORG_CONTACT_EMAIL','PawTransfer: Eintrag auf der Warteliste – {{requestTitle}}','Hallo {{orgName}},

{{userDisplayName}} ({{userEmail}}) möchte auf die Warteliste für „{{requestTitle}}“.

Route: {{originAirport}} → {{destAirport}}

Chat: {{inboxUrl}}',20,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('ORG_REGISTRATION_PENDING_ADMIN','Neue Organisations-Registrierung → Admin','Benachrichtigt die Admin-E-Mail (ADMIN_NOTIFY_EMAIL), wenn eine Organisation sich registriert.',true,'IMMEDIATE','ADMIN_EMAIL','PawTransfer: Neue Organisations-Registrierung (Prüfung)','Neue Organisation „{{orgName}}“ (Slug: {{orgSlug}}) hat sich registriert.

Kontakt-E-Mail Organisation: {{orgContactEmail}}
Nutzer-Konto: {{orgUserEmail}}

Admin-Bereich: {{adminUrl}}',30,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('FLUGPATE_REGISTRATION_WELCOME_USER','Registrierung Flugpate → Willkommen (optional)','Zusätzliche Mail an den neuen Flugpaten – standardmäßig aus.',false,'IMMEDIATE','USER_SELF','Willkommen bei PawTransfer, {{userDisplayName}}!','Hallo {{userDisplayName}},

schön, dass du dabei bist. Du kannst jetzt passende Transportanfragen finden und dich bewerben.

{{appUrl}}',40,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('USER_LOGIN_SECURITY_ADMIN','Anmeldung → Admin-Hinweis (Audit)','Optional: bei jedem Login eine Info-Mail an Admin.',false,'IMMEDIATE','ADMIN_EMAIL','PawTransfer: Nutzer-Anmeldung {{userEmail}}','Nutzer {{userDisplayName}} ({{userEmail}}) hat sich angemeldet.

Zeitpunkt: {{loginAt}}',50,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('NEWSLETTER_OPT_IN_USER','Newsletter / Benachrichtigungen (Flugpate) → Nutzer','Checkbox bei der Registrierung (Flugpate).',true,'IMMEDIATE','USER_SELF','PawTransfer: Benachrichtigungen aktiviert','Hallo {{userDisplayName}},

du hast bei der Registrierung Benachrichtigungen / den Newsletter aktiviert. Wir halten dich auf dem Laufenden.

{{appUrl}}',60,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('NEWSLETTER_OPT_IN_ORG_USER','Newsletter / Benachrichtigungen (Organisation) → Nutzer','Checkbox bei der Organisations-Registrierung.',true,'IMMEDIATE','USER_SELF','PawTransfer: Benachrichtigungen aktiviert','Hallo {{userDisplayName}},

du hast bei der Registrierung Benachrichtigungen / den Newsletter aktiviert.

{{appUrl}}',70,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('EMAIL_VERIFICATION_USE_CUSTOM','E-Mail-Verifizierung: eigene Vorlage','Wenn aktiv und Text gesetzt: ersetzt die Standard-Verifizierungsmail. Sonst bleibt die Systemvorlage.',false,'IMMEDIATE','USER_SELF','PawTransfer: E-Mail bestätigen','Hallo {{userDisplayName}},

bitte bestätige deine E-Mail-Adresse:
{{verifyUrl}}',80,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('PASSWORD_RESET_USE_CUSTOM','Passwort zurücksetzen: eigene Vorlage','Wenn aktiv und Text gesetzt: ersetzt die Standard-Mail. Sonst bleibt die Systemvorlage.',false,'IMMEDIATE','USER_SELF','PawTransfer: Passwort zurücksetzen','Hallo {{userDisplayName}},

du kannst dein Passwort hier zurücksetzen:
{{resetUrl}}

Der Link ist nur begrenzt gültig.',90,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("trigger_key") DO NOTHING;
