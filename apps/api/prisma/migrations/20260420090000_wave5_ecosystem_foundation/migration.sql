-- CreateEnum
CREATE TYPE "IntegrationEventType" AS ENUM (
  'order_created',
  'order_updated',
  'payment_status_changed',
  'product_created',
  'product_updated',
  'customer_created'
);

-- CreateEnum
CREATE TYPE "IntegrationEventStatus" AS ENUM ('pending', 'processing', 'delivered', 'failed');

-- CreateEnum
CREATE TYPE "IntegrationDeliveryStatus" AS ENUM ('success', 'failed');

-- CreateTable
CREATE TABLE "store_webhook_endpoints" (
  "id" BIGSERIAL NOT NULL,
  "store_id" BIGINT NOT NULL,
  "name" VARCHAR(80) NOT NULL,
  "url" VARCHAR(500) NOT NULL,
  "secret" VARCHAR(128) NOT NULL,
  "events" JSONB NOT NULL DEFAULT '[]',
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "last_delivery_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "store_webhook_endpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_integration_api_keys" (
  "id" BIGSERIAL NOT NULL,
  "store_id" BIGINT NOT NULL,
  "name" VARCHAR(80) NOT NULL,
  "key_prefix" VARCHAR(20) NOT NULL,
  "key_hash" VARCHAR(128) NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "last_used_at" TIMESTAMP(3),
  "revoked_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "store_integration_api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_events" (
  "id" BIGSERIAL NOT NULL,
  "store_id" BIGINT NOT NULL,
  "event_type" "IntegrationEventType" NOT NULL,
  "payload" JSONB NOT NULL,
  "status" "IntegrationEventStatus" NOT NULL DEFAULT 'pending',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "next_attempt_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_error" TEXT,
  "processed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "integration_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_event_deliveries" (
  "id" BIGSERIAL NOT NULL,
  "event_id" BIGINT NOT NULL,
  "endpoint_id" BIGINT NOT NULL,
  "status" "IntegrationDeliveryStatus" NOT NULL,
  "attempt" INTEGER NOT NULL,
  "http_status" INTEGER,
  "error" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "integration_event_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "store_webhook_endpoints_store_id_is_active_idx" ON "store_webhook_endpoints"("store_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "store_integration_api_keys_key_hash_key" ON "store_integration_api_keys"("key_hash");

-- CreateIndex
CREATE INDEX "store_integration_api_keys_store_id_is_active_idx" ON "store_integration_api_keys"("store_id", "is_active");

-- CreateIndex
CREATE INDEX "integration_events_status_next_attempt_at_idx" ON "integration_events"("status", "next_attempt_at");

-- CreateIndex
CREATE INDEX "integration_events_store_id_created_at_idx" ON "integration_events"("store_id", "created_at");

-- CreateIndex
CREATE INDEX "integration_event_deliveries_event_id_idx" ON "integration_event_deliveries"("event_id");

-- AddForeignKey
ALTER TABLE "store_webhook_endpoints"
ADD CONSTRAINT "store_webhook_endpoints_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_integration_api_keys"
ADD CONSTRAINT "store_integration_api_keys_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_events"
ADD CONSTRAINT "integration_events_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_event_deliveries"
ADD CONSTRAINT "integration_event_deliveries_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "integration_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_event_deliveries"
ADD CONSTRAINT "integration_event_deliveries_endpoint_id_fkey" FOREIGN KEY ("endpoint_id") REFERENCES "store_webhook_endpoints"("id") ON DELETE CASCADE ON UPDATE CASCADE;
