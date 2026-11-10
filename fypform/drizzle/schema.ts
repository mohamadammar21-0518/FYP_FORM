import { pgEnum, pgTable, serial, timestamp, varchar, numeric } from "drizzle-orm/pg-core";

export const intakeYearEnum = pgEnum("intake_year", ["2026/2027 October", "2026/27 March"]);

export const attendanceSubmissions = pgTable("attendance_submissions", {
  id: serial("id").primaryKey(),
  fullName: varchar("full_name", { length: 150 }).notNull(),
  studentId: varchar("student_id", { length: 80 }).notNull(),
  intakeYear: intakeYearEnum("intake_year").notNull(),
  // 5 separate course attendance columns (percentage 0–100)
  course1: numeric("course1", { precision: 5, scale: 2 }).notNull(),
  course2: numeric("course2", { precision: 5, scale: 2 }).notNull(),
  course3: numeric("course3", { precision: 5, scale: 2 }).notNull(),
  course4: numeric("course4", { precision: 5, scale: 2 }).notNull(),
  course5: numeric("course5", { precision: 5, scale: 2 }).notNull(),
  // GPA/CGPA on 0–4.00 scale
  gpa: numeric("gpa", { precision: 3, scale: 2 }),
  cgpa: numeric("cgpa", { precision: 3, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AttendanceSubmission = typeof attendanceSubmissions.$inferSelect;
export type InsertAttendanceSubmission = typeof attendanceSubmissions.$inferInsert;
