-- Test-Kontakt für E-Mail-Versand (Testmail): erscheint in der Acquise-Liste,
-- damit du "Test-E-Mail senden" → diesen Kontakt wählen kannst.
-- {{Tierschutzorga.}} wird dann durch "Test-Kontakt Aaron" ersetzt.

INSERT INTO "AcquisitionContact" (
  "id",
  "name",
  "country",
  "continent",
  "website_language",
  "website_url",
  "email",
  "contact_form_url",
  "mediation_type",
  "mediates_to_germany",
  "mediates_from_germany",
  "notes",
  "noted",
  "email_sent",
  "status",
  "created_at",
  "updated_at"
) VALUES (
  gen_random_uuid()::text,
  'Test-Kontakt Aaron',
  'Deutschland',
  'Europa',
  'Deutsch',
  NULL,
  'aaron.loechner2@gmail.com',
  NULL,
  'ANIMALS',
  'YES',
  'YES',
  'Nur für Test-E-Mails (Acquise-Versand prüfen)',
  false,
  false,
  'OPEN',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Einmal ausführen reicht. Bei erneutem Ausführen entsteht ein zweiter Test-Eintrag
-- (kann im Admin bei Acquise ggf. gelöscht werden).
