-- CreateEnum
CREATE TYPE "OnboardingStepKey" AS ENUM (
  'store_profile',
  'payment_setup',
  'shipping_setup',
  'first_product',
  'first_campaign',
  'domain_connect'
);

-- CreateTable
CREATE TABLE "store_onboarding_steps" (
  "id" BIGSERIAL NOT NULL,
  "store_id" BIGINT NOT NULL,
  "step" "OnboardingStepKey" NOT NULL,
  "is_completed" BOOLEAN NOT NULL DEFAULT false,
  "completed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "store_onboarding_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_automation_settings" (
  "id" BIGSERIAL NOT NULL,
  "store_id" BIGINT NOT NULL,
  "abandoned_cart_enabled" BOOLEAN NOT NULL DEFAULT false,
  "abandoned_cart_delay_min" INTEGER NOT NULL DEFAULT 60,
  "abandoned_cart_channels" JSONB NOT NULL DEFAULT '["sms"]',
  "welcome_automation_enabled" BOOLEAN NOT NULL DEFAULT false,
  "low_stock_alert_enabled" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "store_automation_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "store_onboarding_steps_store_id_step_key"
  ON "store_onboarding_steps"("store_id", "step");

-- CreateIndex
CREATE INDEX "store_onboarding_steps_store_id_idx"
  ON "store_onboarding_steps"("store_id");

-- CreateIndex
CREATE UNIQUE INDEX "store_automation_settings_store_id_key"
  ON "store_automation_settings"("store_id");

-- AddForeignKey
ALTER TABLE "store_onboarding_steps"
  ADD CONSTRAINT "store_onboarding_steps_store_id_fkey"
  FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_automation_settings"
  ADD CONSTRAINT "store_automation_settings_store_id_fkey"
  FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill default automation settings for existing stores
INSERT INTO "store_automation_settings" (
  "store_id",
  "abandoned_cart_enabled",
  "abandoned_cart_delay_min",
  "abandoned_cart_channels",
  "welcome_automation_enabled",
  "low_stock_alert_enabled",
  "created_at",
  "updated_at"
)
SELECT
  s."id",
  false,
  60,
  '["sms"]'::jsonb,
  false,
  true,
  NOW(),
  NOW()
FROM "stores" s
LEFT JOIN "store_automation_settings" a ON a."store_id" = s."id"
WHERE a."id" IS NULL;
