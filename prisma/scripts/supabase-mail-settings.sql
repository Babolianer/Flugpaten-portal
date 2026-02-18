-- E-Mail-Einstellungen (Footer im Admin einstellbar) – in Supabase SQL Editor ausführen
CREATE TABLE IF NOT EXISTS "AcquisitionMailSettings" (
    "id" TEXT NOT NULL,
    "footer_text" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcquisitionMailSettings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "AcquisitionMailSettings" ("id", "footer_text", "updated_at")
VALUES ('default', 'Aaron Löchner · aaron.loechner@gmx.de · 015224822057', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO UPDATE SET "footer_text" = EXCLUDED."footer_text", "updated_at" = CURRENT_TIMESTAMP;
