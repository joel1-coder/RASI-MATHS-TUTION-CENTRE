ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "status" varchar(20) NOT NULL DEFAULT 'active';
