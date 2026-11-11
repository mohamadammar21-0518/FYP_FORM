import { json, pgEnum, pgTable, serial, timestamp, varchar, numeric } from "drizzle-orm/pg-core";
import type { CourseAttendanceEntry, Semester } from "../shared/courses";

export const intakeYearEnum = pgEnum("intake_year", ["2026/2027 October", "2026/27 March"]);

export const attendanceSubmissions = pgTable("attendance_submissions", {
  id: serial("id").primaryKey(),
  fullName: varchar("full_name", { length: 150 }).notNull(),
  studentId: varchar("student_id", { length: 11 }).notNull(),
  intakeYear: intakeYearEnum("intake_year").notNull(),
  semester: varchar("semester", { length: 20 }).notNull(),
  // JSON array: [{ courseCode, courseName, attendancePercentage }]
  courseAttendance: json("course_attendance").$type<CourseAttendanceEntry[]>().notNull(),
  // GPA/CGPA on 0–4.00 scale, now required
  gpa: numeric("gpa", { precision: 3, scale: 2 }).notNull(),
  cgpa: numeric("cgpa", { precision: 3, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AttendanceSubmission = typeof attendanceSubmissions.$inferSelect;
export type InsertAttendanceSubmission = typeof attendanceSubmissions.$inferInsert;
