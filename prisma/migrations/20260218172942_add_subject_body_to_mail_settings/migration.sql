-- Erweitere AcquisitionMailSettings um subject und body Felder
ALTER TABLE "AcquisitionMailSettings" ADD COLUMN IF NOT EXISTS "subject" TEXT;
ALTER TABLE "AcquisitionMailSettings" ADD COLUMN IF NOT EXISTS "body" TEXT;
