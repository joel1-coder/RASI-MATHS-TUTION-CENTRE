CREATE TABLE IF NOT EXISTS "announcements" (
  "id" serial PRIMARY KEY,
  "recipientEmail" varchar(320) NOT NULL,
  "studentEmail" varchar(320) NOT NULL,
  "title" varchar(160) NOT NULL,
  "message" text NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);
