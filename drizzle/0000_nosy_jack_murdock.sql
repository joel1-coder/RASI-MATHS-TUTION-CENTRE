CREATE TYPE "public"."assessmentType" AS ENUM('weekly', 'monthly');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('present', 'late', 'absent');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin', 'student', 'parent');--> statement-breakpoint
CREATE TABLE "colleges" (
	"id" serial PRIMARY KEY NOT NULL,
	"tier" varchar(80) NOT NULL,
	"name" varchar(160) NOT NULL,
	"category" varchar(100) NOT NULL,
	"cutoff" varchar(180) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "government_exams" (
	"id" serial PRIMARY KEY NOT NULL,
	"groupName" varchar(120) NOT NULL,
	"name" varchar(160) NOT NULL,
	"qualification" text NOT NULL,
	"maxMarks" varchar(120) NOT NULL,
	"benchmark" varchar(180) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mark_statements" (
	"id" serial PRIMARY KEY NOT NULL,
	"studentEmail" varchar(320) NOT NULL,
	"assessmentType" "assessmentType" NOT NULL,
	"periodLabel" varchar(80) NOT NULL,
	"subject" varchar(120) NOT NULL,
	"score" integer NOT NULL,
	"maxScore" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "schedule_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"studentEmail" varchar(320) NOT NULL,
	"sessionDate" varchar(10) NOT NULL,
	"subject" varchar(120) NOT NULL,
	"exercise" text NOT NULL,
	"sessionTime" varchar(80),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_attendance" (
	"id" serial PRIMARY KEY NOT NULL,
	"studentEmail" varchar(320) NOT NULL,
	"attendanceDate" varchar(10) NOT NULL,
	"status" "status" NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"studentEmail" varchar(320) NOT NULL,
	"title" varchar(160) NOT NULL,
	"subject" varchar(120) NOT NULL,
	"dueDate" varchar(40) NOT NULL,
	"status" varchar(40) NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subjects" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(80) NOT NULL,
	"code" varchar(30) NOT NULL,
	"summary" text NOT NULL,
	"paperLabel" varchar(80) NOT NULL,
	"durationMinutes" integer DEFAULT 60 NOT NULL,
	"questionCount" integer DEFAULT 20 NOT NULL,
	"accentColor" varchar(20) DEFAULT '#5968a9' NOT NULL,
	"isFeatured" integer DEFAULT 0 NOT NULL,
	"sortOrder" integer DEFAULT 10 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subjects_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"linkedStudentEmail" varchar(320),
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
