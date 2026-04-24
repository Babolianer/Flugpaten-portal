-- Zusätzliche englische Vorlagen + Bewerbungs-Platzhalter für Org-Mail

ALTER TABLE "email_notification_rules" ADD COLUMN IF NOT EXISTS "subject_template_en" TEXT;
ALTER TABLE "email_notification_rules" ADD COLUMN IF NOT EXISTS "body_template_en" TEXT;

-- Bewerbungsformular in bestehende deutsche Vorlage ergänzen (nur wenn noch nicht vorhanden)
UPDATE "email_notification_rules"
SET "body_template" = "body_template" || E'\n\n---\nBewerbungsformular (alle Felder):\n{{applicationDetails}}\n\n{{attachmentInfo}}'
WHERE "trigger_key" = 'TRANSPORT_APPLICATION_ORG'
  AND "body_template" NOT LIKE '%{{applicationDetails}}%';

-- Englische Vorlagen (Empfänger mit Standardsprache Englisch)
UPDATE "email_notification_rules" SET "subject_template_en" = 'PawTransfer: New application for "{{requestTitle}}"', "body_template_en" = $tapp$
Hello {{orgName}},

{{userDisplayName}} ({{userEmail}}) has applied for the transport request "{{requestTitle}}".

Route: {{originAirport}} → {{destAirport}}

Message from the volunteer:
{{applicantMessage}}

Application form (all fields):
{{applicationDetails}}

{{attachmentInfo}}

Inbox in the portal: {{inboxUrl}}
Request: {{requestUrl}}
$tapp$ WHERE "trigger_key" = 'TRANSPORT_APPLICATION_ORG';

UPDATE "email_notification_rules" SET "subject_template_en" = 'PawTransfer: Waiting list entry – {{requestTitle}}', "body_template_en" = $twl$
Hello {{orgName}},

{{userDisplayName}} ({{userEmail}}) would like to join the waiting list for "{{requestTitle}}".

Route: {{originAirport}} → {{destAirport}}

Message:
{{applicantMessage}}

Chat: {{inboxUrl}}
$twl$ WHERE "trigger_key" = 'WAITING_LIST_ORG';

UPDATE "email_notification_rules" SET "subject_template_en" = 'PawTransfer: Transport "{{requestTitle}}" was cancelled', "body_template_en" = $tcu$
Hello {{userDisplayName}},

the transport request "{{requestTitle}}" was cancelled by {{orgName}}.

Route: {{originAirport}} → {{destAirport}}

You can still find the entry in your dashboard with status "Cancelled".
Details: {{requestUrl}}
$tcu$ WHERE "trigger_key" = 'TRANSPORT_CANCELLED_USER';

UPDATE "email_notification_rules" SET "subject_template_en" = 'PawTransfer: New organisation registration (review)', "body_template_en" = $org$
New organisation "{{orgName}}" (slug: {{orgSlug}}) has registered.

Organisation contact email: {{orgContactEmail}}
User account: {{orgUserEmail}}

Admin area: {{adminUrl}}
$org$ WHERE "trigger_key" = 'ORG_REGISTRATION_PENDING_ADMIN';

UPDATE "email_notification_rules" SET "subject_template_en" = 'Welcome to PawTransfer, {{userDisplayName}}!', "body_template_en" = $fw$
Hello {{userDisplayName}},

great to have you on board. You can now find suitable transport requests and apply.

{{appUrl}}
$fw$ WHERE "trigger_key" = 'FLUGPATE_REGISTRATION_WELCOME_USER';

UPDATE "email_notification_rules" SET "subject_template_en" = 'PawTransfer: User login {{userEmail}}', "body_template_en" = $log$
User {{userDisplayName}} ({{userEmail}}) has logged in.

Time: {{loginAt}}
$log$ WHERE "trigger_key" = 'USER_LOGIN_SECURITY_ADMIN';

UPDATE "email_notification_rules" SET "subject_template_en" = 'PawTransfer: Notifications enabled', "body_template_en" = $n1$
Hello {{userDisplayName}},

you enabled notifications / the newsletter during registration. We will keep you posted.

{{appUrl}}
$n1$ WHERE "trigger_key" = 'NEWSLETTER_OPT_IN_USER';

UPDATE "email_notification_rules" SET "subject_template_en" = 'PawTransfer: Notifications enabled', "body_template_en" = $n2$
Hello {{userDisplayName}},

you enabled notifications during organisation registration.

{{appUrl}}
$n2$ WHERE "trigger_key" = 'NEWSLETTER_OPT_IN_ORG_USER';

UPDATE "email_notification_rules" SET "subject_template_en" = 'PawTransfer: Confirm your email', "body_template_en" = $ev$
Hello {{userDisplayName}},

please confirm your email address:
{{verifyUrl}}
$ev$ WHERE "trigger_key" = 'EMAIL_VERIFICATION_USE_CUSTOM';

UPDATE "email_notification_rules" SET "subject_template_en" = 'PawTransfer: Reset your password', "body_template_en" = $pr$
Hello {{userDisplayName}},

you can reset your password here:
{{resetUrl}}

The link is only valid for a limited time.
$pr$ WHERE "trigger_key" = 'PASSWORD_RESET_USE_CUSTOM';

UPDATE "email_notification_rules" SET "subject_template_en" = 'PawTransfer: New transports for your route', "body_template_en" = $rd$
Hello {{userDisplayName}},

there are {{requestCount}} new transport request(s) for your subscribed route:
{{routeSummary}}

{{requestLines}}

View on the map: {{requestsUrl}}
$rd$ WHERE "trigger_key" = 'ROUTE_MATCH_DIGEST_USER';
