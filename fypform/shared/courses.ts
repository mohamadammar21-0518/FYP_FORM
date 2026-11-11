export const courseList = [
  { code: "BIS2013", name: "BIS2013 – Information Systems" },
  { code: "BIS2023", name: "BIS2023 – Database Management" },
  { code: "BIS3013", name: "BIS3013 – System Analysis & Design" },
  { code: "BIS3023", name: "BIS3023 – Web Technologies" },
  { code: "BIS3033", name: "BIS3033 – Network & Communications" },
  { code: "BIS3043", name: "BIS3043 – IT Project Management" },
  { code: "BIS3053", name: "BIS3053 – Human Computer Interaction" },
  { code: "BIS4013", name: "BIS4013 – Information Security" },
  { code: "BIS4023", name: "BIS4023 – Business Intelligence" },
  { code: "BIS4033", name: "BIS4033 – Cloud Computing" },
  { code: "BIT2013", name: "BIT2013 – Programming Fundamentals" },
  { code: "BIT2023", name: "BIT2023 – Data Structures & Algorithms" },
  { code: "BIT3013", name: "BIT3013 – Software Engineering" },
  { code: "BIT3023", name: "BIT3023 – Operating Systems" },
  { code: "BIT4013", name: "BIT4013 – Artificial Intelligence" },
  { code: "MPU3113", name: "MPU3113 – Bahasa Malaysia" },
  { code: "MPU3123", name: "MPU3123 – Malaysian Studies" },
  { code: "MPU3143", name: "MPU3143 – Ethnic Relations" },
  { code: "MPU3163", name: "MPU3163 – Integrity & Anti-Corruption" },
  { code: "GEB1013", name: "GEB1013 – English Communication" },
  { code: "GEB2013", name: "GEB2013 – Business Communication" },
  { code: "GEB3013", name: "GEB3013 – Professional Communication" },
  { code: "MAT1013", name: "MAT1013 – Mathematics for Computing" },
  { code: "STT1013", name: "STT1013 – Statistics" },
] as const;

export type CourseCode = typeof courseList[number]["code"];

export type CourseAttendanceEntry = {
  courseCode: string;
  courseName: string;
  attendancePercentage: number;
};

export const semesterList = [
  "Semester 1",
  "Semester 2",
  "Semester 3",
] as const;

export type Semester = typeof semesterList[number];
