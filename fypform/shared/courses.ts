export const courseNames = [
  "Course 1",
  "Course 2",
  "Course 3",
  "Course 4",
  "Course 5",
] as const;

export type CourseAttendanceEntry = {
  courseName: string;
  attendancePercentage: number;
};
