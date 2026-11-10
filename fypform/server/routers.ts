import { z } from "zod";
import { courseNames } from "../shared/courses";
import { publicProcedure, router } from "./_core/trpc";
import { createAttendanceSubmission } from "./db";
import { TRPCError } from "@trpc/server";

// Attendance: 0–100 percentage
const attendanceField = z.number().finite().min(0).max(100);

// GPA/CGPA: 0–4.00 scale (AIU standard)
const gpaField = z.number().finite().min(0).max(4).optional();

export const appRouter = router({
  studentSurvey: router({
    submit: publicProcedure
      .input(z.object({
        fullName: z.string().trim().min(1, "Enter your full name.").max(150),
        studentId: z.string().trim().min(1, "Enter your student ID.").max(80),
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
});

export type AppRouter = typeof appRouter;
