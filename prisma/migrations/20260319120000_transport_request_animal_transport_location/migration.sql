-- TransportRequest: Tiertransport-Optionen (Frachtraum vs. Passagierkabine)

ALTER TABLE "TransportRequest"
ADD COLUMN IF NOT EXISTS "animal_can_fly_in_cargo" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "TransportRequest"
ADD COLUMN IF NOT EXISTS "animal_can_fly_in_cabin" BOOLEAN NOT NULL DEFAULT false;

