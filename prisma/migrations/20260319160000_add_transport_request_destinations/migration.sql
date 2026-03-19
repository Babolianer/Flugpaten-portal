-- CreateTable
CREATE TABLE "TransportRequestDestination" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "airport_code" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransportRequestDestination_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TransportRequestDestination_request_id_idx" ON "TransportRequestDestination"("request_id");

-- AddForeignKey
ALTER TABLE "TransportRequestDestination" ADD CONSTRAINT "TransportRequestDestination_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "TransportRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing destinations from TransportRequest to TransportRequestDestination
INSERT INTO "TransportRequestDestination" ("id", "request_id", "airport_code", "lat", "lng", "sort_order", "created_at")
SELECT gen_random_uuid()::text, "id", "dest_airport", "dest_lat", "dest_lng", 0, NOW()
FROM "TransportRequest"
WHERE "dest_airport" IS NOT NULL AND "dest_airport" != '';
