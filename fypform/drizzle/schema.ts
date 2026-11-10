import { json, pgEnum, pgTable, serial, timestamp, varchar, numeric } from "drizzle-orm/pg-core";
import type { CourseAttendanceEntry } from "../shared/courses";

export const intakeYearEnum = pgEnum("intake_year", ["2026/2027 October", "2026/27 March"]);

export const attendanceSubmissions = pgTable("attendance_submissions", {
  id: serial("id").primaryKey(),
  fullName: varchar("full_name", { length: 150 }).notNull(),
  studentId: varchar("student_id", { length: 80 }).notNull(),
  intakeYear: intakeYearEnum("intake_year").notNull(),
  courseAttendance: json("course_attendance").$type<CourseAttendanceEntry[]>().notNull(),
  // GPA and CGPA on a 0–4.00 scale (precision 3, scale 2 → e.g. 3.75)
  gpa: numeric("gpa", { precision: 3, scale: 2 }),
  cgpa: numeric("cgpa", { precision: 3, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AttendanceSubmission = typeof attendanceSubmissions.$inferSelect;
export type InsertAttendanceSubmission = typeof attendanceSubmissions.$inferInsert;
