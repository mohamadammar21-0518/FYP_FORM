import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { Pool } from "pg";
import { InsertAttendanceSubmission, attendanceSubmissions } from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!_db) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL environment variable is not set");
    const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });
    _db = drizzle(pool);
  }
  return _db;
}

export async function createAttendanceSubmission(submission: InsertAttendanceSubmission) {
  const db = getDb();
  const result = await db.insert(attendanceSubmissions).values(submission);
  return result;
}

export async function getAllSubmissions() {
  const db = getDb();
  return db
    .select()
    .from(attendanceSubmissions)
    .orderBy(attendanceSubmissions.createdAt);
}

export async function updateSubmission(id: number, data: Partial<InsertAttendanceSubmission>) {
  const db = getDb();
  return db.update(attendanceSubmissions).set(data).where(eq(attendanceSubmissions.id, id));
}

export async function deleteSubmission(id: number) {
  const db = getDb();
  return db.delete(attendanceSubmissions).where(eq(attendanceSubmissions.id, id));
}

export async function deleteAllSubmissions() {
  const db = getDb();
  return db.delete(attendanceSubmissions);
}
