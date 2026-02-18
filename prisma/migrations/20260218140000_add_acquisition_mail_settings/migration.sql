-- Einstellungen für Acquise-E-Mails (Footer-Text im Frontend speicherbar)
CREATE TABLE "AcquisitionMailSettings" (
    "id" TEXT NOT NULL,
    "footer_text" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcquisitionMailSettings_pkey" PRIMARY KEY ("id")
);

-- Einmalige Zeile mit Default-Footer
INSERT INTO "AcquisitionMailSettings" ("id", "footer_text", "updated_at")
VALUES ('default', 'Aaron Löchner · aaron.loechner@gmx.de · 015224822057', CURRENT_TIMESTAMP);
