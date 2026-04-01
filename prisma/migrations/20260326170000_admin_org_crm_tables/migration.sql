CREATE TABLE "admin_organization_notes" (
  "id" TEXT NOT NULL,
  "organization_id" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "created_by_admin_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "admin_organization_notes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "admin_organization_tasks" (
  "id" TEXT NOT NULL,
  "organization_id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "due_date" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'offen',
  "created_by_admin_id" TEXT,
  "completed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "admin_organization_tasks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "admin_organization_notes_organization_id_created_at_idx"
ON "admin_organization_notes"("organization_id", "created_at" DESC);

CREATE INDEX "admin_organization_tasks_organization_id_status_due_date_idx"
ON "admin_organization_tasks"("organization_id", "status", "due_date");

ALTER TABLE "admin_organization_notes"
ADD CONSTRAINT "admin_organization_notes_organization_id_fkey"
FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
