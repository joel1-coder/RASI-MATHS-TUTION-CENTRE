-- Add section column to unit_questions table
ALTER TABLE "unit_questions" ADD COLUMN IF NOT EXISTS "section" varchar(50) DEFAULT 'All Sections';
