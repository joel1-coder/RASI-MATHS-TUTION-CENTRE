-- Add portalPassword column for DB-backed portal login
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "portalPassword" text;
