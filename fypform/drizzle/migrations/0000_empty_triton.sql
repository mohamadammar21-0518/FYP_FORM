CREATE TYPE "public"."intake_year" AS ENUM('2026/2027 October', '2026/27 March');--> statement-breakpoint
CREATE TABLE "attendance_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"full_name" varchar(150) NOT NULL,
	"student_id" varchar(80) NOT NULL,
	"intake_year" "intake_year" NOT NULL,
	"course_attendance" json NOT NULL,
	"gpa" numeric(3, 2),
	"cgpa" numeric(3, 2),
	"created_at" timestamp DEFAULT now() NOT NULL
);
