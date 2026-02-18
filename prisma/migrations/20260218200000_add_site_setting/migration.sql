-- CreateTable
CREATE TABLE "SiteSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("key")
);

-- Insert default: Wartungsmodus an (true), damit die Seite nach dem Deploy erst nach Admin-Login erreichbar ist
INSERT INTO "SiteSetting" ("key", "value") VALUES ('maintenanceMode', 'true');
