ALTER TABLE "users" RENAME COLUMN "otp" TO "otp_hash";
UPDATE "users" SET "otp_hash" = NULL WHERE "otp_hash" IS NOT NULL;
