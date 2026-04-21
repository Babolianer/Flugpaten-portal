-- CreateTable
CREATE TABLE "route_subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "origin_airport" TEXT NOT NULL,
    "dest_airport" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "route_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "route_notification_events" (
    "id" TEXT NOT NULL,
    "subscription_id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_at" TIMESTAMP(3),

    CONSTRAINT "route_notification_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "route_subscriptions_user_id_origin_airport_dest_airport_key" ON "route_subscriptions"("user_id", "origin_airport", "dest_airport");

-- CreateIndex
CREATE INDEX "route_subscriptions_origin_airport_dest_airport_enabled_idx" ON "route_subscriptions"("origin_airport", "dest_airport", "enabled");

-- CreateIndex
CREATE UNIQUE INDEX "route_notification_events_subscription_id_request_id_key" ON "route_notification_events"("subscription_id", "request_id");

-- CreateIndex
CREATE INDEX "route_notification_events_sent_at_created_at_idx" ON "route_notification_events"("sent_at", "created_at");

-- AddForeignKey
ALTER TABLE "route_subscriptions" ADD CONSTRAINT "route_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_notification_events" ADD CONSTRAINT "route_notification_events_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "route_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_notification_events" ADD CONSTRAINT "route_notification_events_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "TransportRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
