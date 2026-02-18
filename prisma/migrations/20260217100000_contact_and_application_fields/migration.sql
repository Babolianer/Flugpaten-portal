-- Organization: Kontaktfelder für Landing Page / Kontaktbox
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "contact_phone" TEXT;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "contact_instagram" TEXT;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "contact_facebook" TEXT;

-- RequestApplication: erweiterte Bewerbungsdaten + Upload
ALTER TABLE "RequestApplication" ADD COLUMN IF NOT EXISTS "application_data" JSONB;
ALTER TABLE "RequestApplication" ADD COLUMN IF NOT EXISTS "attachment_path" TEXT;
