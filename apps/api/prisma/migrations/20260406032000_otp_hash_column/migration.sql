ALTER TABLE "users" RENAME COLUMN "otp" TO "otp_hash";
ALTER TABLE "users" ALTER COLUMN "otp_hash" TYPE VARCHAR(255);
UPDATE "users" SET "otp_hash" = NULL WHERE "otp_hash" IS NOT NULL;
