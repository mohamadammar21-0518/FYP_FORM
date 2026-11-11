import { z } from "zod";
import { semesterList } from "../shared/courses";
import { publicProcedure, router } from "./_core/trpc";
import { createAttendanceSubmission, getAllSubmissions, deleteSubmission, deleteAllSubmissions } from "./db";
import { TRPCError } from "@trpc/server";

const gpaField = z.number().finite().min(0).max(4);

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "fypadmin2026";

export const appRouter = router({
  studentSurvey: router({
    submit: publicProcedure
      .input(z.object({
        fullName: z.string().trim().min(1, "Enter your full name.").max(150),
        studentId: z.string().trim().min(1, "Enter your student ID.").max(11)
          .regex(/^[Aa][Ii][Uu].{8}$/, "Student ID must be 11 characters starting with AIU"),
        intakeYear: z.enum(["2026/2027 October", "2026/27 March"]),
        semester: z.enum(semesterList),
        courseAttendance: z.array(z.object({
          courseCode: z.string().min(1),
          courseName: z.string().min(1),
          attendancePercentage: z.number().finite().min(0).max(100),
        })).min(1, "Add at least one course.").max(10),
        gpa: gpaField,
        cgpa: gpaField,
      }))
      .mutation(async ({ input }) => {
        try {
          await createAttendanceSubmission({
            fullName: input.fullName,
            studentId: input.studentId,
            intakeYear: input.intakeYear,
            semester: input.semester,
            courseAttendance: input.courseAttendance,
            gpa: String(input.gpa),
            cgpa: String(input.cgpa),
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
        return getAllSubmissions();
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
