-- TransportRequest groups ("gemeinsam fliegen")

-- CreateTable
CREATE TABLE IF NOT EXISTS "TransportRequestGroup" (
  "id" TEXT NOT NULL,
  "organization_id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "note" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TransportRequestGroup_pkey" PRIMARY KEY ("id")
);

-- Add group_id columns
ALTER TABLE "TransportRequest"
ADD COLUMN IF NOT EXISTS "group_id" TEXT;

ALTER TABLE "RequestApplication"
ADD COLUMN IF NOT EXISTS "group_id" TEXT;

-- Indexes
CREATE INDEX IF NOT EXISTS "TransportRequest_group_id_idx" ON "TransportRequest"("group_id");
CREATE INDEX IF NOT EXISTS "TransportRequestGroup_organization_id_idx" ON "TransportRequestGroup"("organization_id");
CREATE INDEX IF NOT EXISTS "RequestApplication_group_id_idx" ON "RequestApplication"("group_id");

-- Foreign keys
ALTER TABLE "TransportRequestGroup"
  ADD CONSTRAINT "TransportRequestGroup_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TransportRequest"
  ADD CONSTRAINT "TransportRequest_group_id_fkey"
  FOREIGN KEY ("group_id") REFERENCES "TransportRequestGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "RequestApplication"
  ADD CONSTRAINT "RequestApplication_group_id_fkey"
  FOREIGN KEY ("group_id") REFERENCES "TransportRequestGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

