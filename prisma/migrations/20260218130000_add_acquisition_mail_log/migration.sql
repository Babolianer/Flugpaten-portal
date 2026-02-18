-- CreateEnum
CREATE TYPE "MailStatus" AS ENUM ('SENT', 'DELIVERED', 'BOUNCED', 'FAILED', 'COMPLAINED');

-- CreateTable
CREATE TABLE "AcquisitionMailLog" (
    "id" TEXT NOT NULL,
    "acquisition_contact_id" TEXT NOT NULL,
    "resend_id" TEXT NOT NULL,
    "status" "MailStatus" NOT NULL DEFAULT 'SENT',
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcquisitionMailLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AcquisitionMailLog_acquisition_contact_id_idx" ON "AcquisitionMailLog"("acquisition_contact_id");

-- CreateIndex
CREATE INDEX "AcquisitionMailLog_resend_id_idx" ON "AcquisitionMailLog"("resend_id");

-- AddForeignKey
ALTER TABLE "AcquisitionMailLog" ADD CONSTRAINT "AcquisitionMailLog_acquisition_contact_id_fkey" FOREIGN KEY ("acquisition_contact_id") REFERENCES "AcquisitionContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
