-- AlterTable
ALTER TABLE "store_automation_settings"
  ADD COLUMN "abandoned_cart_discount_enabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "abandoned_cart_discount_percent" INTEGER NOT NULL DEFAULT 10,
  ADD COLUMN "reminder_cadence_preset" VARCHAR(30) NOT NULL DEFAULT 'standard',
  ADD COLUMN "campaign_schedule_mode" VARCHAR(20) NOT NULL DEFAULT 'manual',
  ADD COLUMN "campaign_timezone" VARCHAR(100);

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('draft', 'scheduled', 'active', 'paused', 'completed');

-- CreateEnum
CREATE TYPE "CampaignChannel" AS ENUM ('sms', 'whatsapp', 'email', 'push');

-- CreateEnum
CREATE TYPE "CampaignAudience" AS ENUM (
  'all_customers',
  'returning_customers',
  'new_customers',
  'abandoned_cart'
);

-- CreateTable
CREATE TABLE "store_campaigns" (
  "id" BIGSERIAL NOT NULL,
  "store_id" BIGINT NOT NULL,
  "name_ar" VARCHAR(160) NOT NULL,
  "name_en" VARCHAR(160) NOT NULL,
  "objective" VARCHAR(50) NOT NULL DEFAULT 'sales_boost',
  "channel" "CampaignChannel" NOT NULL DEFAULT 'sms',
  "audience" "CampaignAudience" NOT NULL DEFAULT 'all_customers',
  "status" "CampaignStatus" NOT NULL DEFAULT 'draft',
  "discount_percent" INTEGER,
  "reminder_cadence_preset" VARCHAR(30) NOT NULL DEFAULT 'standard',
  "scheduled_at" TIMESTAMP(3),
  "starts_at" TIMESTAMP(3),
  "ends_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "store_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "store_campaigns_store_id_status_created_at_idx"
  ON "store_campaigns"("store_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "store_campaigns_store_id_starts_at_idx"
  ON "store_campaigns"("store_id", "starts_at");

-- AddForeignKey
ALTER TABLE "store_campaigns"
  ADD CONSTRAINT "store_campaigns_store_id_fkey"
  FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
