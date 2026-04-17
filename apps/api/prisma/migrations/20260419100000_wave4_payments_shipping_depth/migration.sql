-- AlterTable
ALTER TABLE "stores"
ADD COLUMN "payment_settings" JSONB,
ADD COLUMN "shipping_settings" JSONB;
