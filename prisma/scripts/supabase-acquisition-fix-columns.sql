-- Fehlende Spalten in "AcquisitionContact" nachrüsten (Supabase SQL Editor)
-- Ausführen, wenn Fehler: "The column AcquisitionContact.emailSent does not exist"

ALTER TABLE "AcquisitionContact"
  ADD COLUMN IF NOT EXISTS "email_sent" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "AcquisitionContact"
  ADD COLUMN IF NOT EXISTS "noted" BOOLEAN NOT NULL DEFAULT false;

-- Falls status oder notes fehlen:
-- ALTER TABLE "AcquisitionContact" ADD COLUMN IF NOT EXISTS "status" "AcquisitionStatus" NOT NULL DEFAULT 'OPEN';
-- ALTER TABLE "AcquisitionContact" ADD COLUMN IF NOT EXISTS "notes" TEXT;
