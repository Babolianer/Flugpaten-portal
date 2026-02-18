-- Tabelle AcquisitionMailSettings anlegen (falls noch nicht vorhanden)
-- Enthält: subject, body, footer_text für das E-Mail-Template
CREATE TABLE IF NOT EXISTS "AcquisitionMailSettings" (
    "id" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT,
    "footer_text" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcquisitionMailSettings_pkey" PRIMARY KEY ("id")
);

-- Spalten subject und body nachziehen, falls Tabelle schon ohne sie existiert
ALTER TABLE "AcquisitionMailSettings" ADD COLUMN IF NOT EXISTS "subject" TEXT;
ALTER TABLE "AcquisitionMailSettings" ADD COLUMN IF NOT EXISTS "body" TEXT;

-- Einmalige Zeile mit Defaults (nur wenn noch keine Zeile mit id = 'default' existiert)
INSERT INTO "AcquisitionMailSettings" ("id", "subject", "body", "footer_text", "updated_at")
VALUES (
  'default',
  'Beta-Tester gesucht: Flugpaten-Portal',
  NULL,
  'Aaron Löchner · aaron.loechner@gmx.de · 015224822057',
  CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO NOTHING;
