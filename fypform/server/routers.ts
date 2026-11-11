import { z } from "zod";
import { courseNames } from "../shared/courses";
import { publicProcedure, router } from "./_core/trpc";
import { createAttendanceSubmission, getAllSubmissions, updateSubmission, deleteSubmission, deleteAllSubmissions } from "./db";
import { TRPCError } from "@trpc/server";

// Attendance: 0–100 percentage
const attendanceField = z.number().finite().min(0).max(100);

// GPA/CGPA: 0–4.00 scale (AIU standard)
const gpaField = z.number().finite().min(0).max(4).optional();

// Admin password — set ADMIN_PASSWORD env var on Render, fallback for dev
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "fypadmin2026";

export const appRouter = router({
  studentSurvey: router({
    submit: publicProcedure
      .input(z.object({
        fullName: z.string().trim().min(1, "Enter your full name.").max(150),
        studentId: z.string().trim().min(1, "Enter your student ID.").max(80)
          .regex(/^[Aa][Ii][Uu].{8}$/, "Student ID must be 11 characters starting with AIU (e.g. AIU26102205)"),
        intakeYear: z.enum(["2026/2027 October", "2026/27 March"]),
        attendance: z.array(attendanceField).length(courseNames.length),
        gpa: gpaField,
        cgpa: gpaField,
      }))
      .mutation(async ({ input }) => {
        try {
          await createAttendanceSubmission({
            fullName: input.fullName,
            studentId: input.studentId,
            intakeYear: input.intakeYear,
            course1: String(input.attendance[0]),
            course2: String(input.attendance[1]),
            course3: String(input.attendance[2]),
            course4: String(input.attendance[3]),
            course5: String(input.attendance[4]),
            gpa: input.gpa != null ? String(input.gpa) : null,
            cgpa: input.cgpa != null ? String(input.cgpa) : null,
          });
          return { success: true } as const;
        } catch (error) {
          console.error("[Student survey] Failed to save response:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Unable to save your response.",
          });
        }
      }),
  }),

  admin: router({
    login: publicProcedure
      .input(z.object({ password: z.string() }))
      .mutation(({ input }) => {
        if (input.password !== ADMIN_PASSWORD) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Incorrect password." });
        }
        return { success: true } as const;
      }),

    getSubmissions: publicProcedure
      .input(z.object({ password: z.string() }))
      .query(async ({ input }) => {
        if (input.password !== ADMIN_PASSWORD) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Incorrect password." });
        }
        const rows = await getAllSubmissions();
        return rows;
      }),

    updateSubmission: publicProcedure
      .input(z.object({
        password: z.string(),
        id: z.number(),
        fullName: z.string().trim().min(1).max(150),
        studentId: z.string().trim().min(1).max(11),
        intakeYear: z.enum(["2026/2027 October", "2026/27 March"]),
        course1: z.string(),
        course2: z.string(),
        course3: z.string(),
        course4: z.string(),
        course5: z.string(),
        gpa: z.string().nullable(),
        cgpa: z.string().nullable(),
      }))
      .mutation(async ({ input }) => {
        if (input.password !== ADMIN_PASSWORD) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Incorrect password." });
        }
        const { password: _, id, ...data } = input;
        await updateSubmission(id, data);
        return { success: true } as const;
      }),

    deleteSubmission: publicProcedure
      .input(z.object({ password: z.string(), id: z.number() }))
      .mutation(async ({ input }) => {
        if (input.password !== ADMIN_PASSWORD) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Incorrect password." });
        }
        await deleteSubmission(input.id);
        return { success: true } as const;
      }),

    deleteAll: publicProcedure
      .input(z.object({ password: z.string() }))
      .mutation(async ({ input }) => {
        if (input.password !== ADMIN_PASSWORD) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Incorrect password." });
        }
        await deleteAllSubmissions();
        return { success: true } as const;
      }),
  }),
});

export type AppRouter = typeof appRouter;
