-- SiteSetting-Tabelle für Wartungsmodus (Supabase / PostgreSQL)
-- Einmalig im SQL-Editor von Supabase ausführen.

CREATE TABLE IF NOT EXISTS "SiteSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("key")
);

-- Wartungsmodus: 'true' = aktiv (nur Admin-Login), 'false' = aus
INSERT INTO "SiteSetting" ("key", "value") VALUES ('maintenanceMode', 'true')
ON CONFLICT ("key") DO NOTHING;
