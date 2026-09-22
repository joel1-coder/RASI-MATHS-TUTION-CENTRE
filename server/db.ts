import { and, asc, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { colleges, governmentExams, InsertCollege, InsertGovernmentExam, InsertMarkStatement, InsertStudentAttendance, InsertStudentProject, InsertUser, InsertScheduleSession, markStatements, scheduleSessions, studentAttendance, studentProjects, subjects, InsertSubject, users, questionPapers, unitQuestions, InsertQuestionPaper, InsertUnitQuestion } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let _client: ReturnType<typeof postgres> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _client = postgres(process.env.DATABASE_URL);
      _db = drizzle(_client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  const values: InsertUser = { openId: user.openId } as any;
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  textFields.forEach(field => {
    const value = user[field as keyof InsertUser];
    if (value !== undefined) {
      const normalized = value ?? null;
      (values as any)[field] = normalized;
      updateSet[field] = normalized;
    }
  });

  if (user.linkedStudentEmail !== undefined) {
    values.linkedStudentEmail = user.linkedStudentEmail ?? null;
    updateSet.linkedStudentEmail = user.linkedStudentEmail ?? null;
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }

  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = 'admin';
    updateSet.role = 'admin';
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onConflictDoUpdate({ target: users.openId, set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function setUserRoleByEmail(email: string, role: "user" | "admin" | "student" | "parent" | "teacher", linkedStudentEmail?: string) {
  const db = await getDb();
  if (!db) return undefined;
  await db.update(users).set({ role, linkedStudentEmail: linkedStudentEmail ?? null }).where(eq(users.email, email));
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0];
}

export async function listFeaturedSubjects() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(subjects).where(eq(subjects.isFeatured, 1)).orderBy(asc(subjects.sortOrder), asc(subjects.id)).limit(3);
}

export async function listSubjects() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(subjects).orderBy(asc(subjects.sortOrder), desc(subjects.updatedAt), asc(subjects.id));
}

export async function createSubject(subject: InsertSubject) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(subjects).values(subject).returning({ id: subjects.id });
  return result[0].id;
}

export async function updateSubject(id: number, subject: Partial<InsertSubject>) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(subjects).set(subject).where(eq(subjects.id, id));
}

export async function deleteSubject(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.delete(subjects).where(eq(subjects.id, id));
}

export async function listStudentAttendance(studentEmail: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(studentAttendance).where(eq(studentAttendance.studentEmail, studentEmail));
}

export async function upsertStudentAttendance(record: InsertStudentAttendance) {
  const db = await getDb();
  if (!db) return undefined;
  const existing = await db.select().from(studentAttendance).where(and(eq(studentAttendance.studentEmail, record.studentEmail), eq(studentAttendance.attendanceDate, record.attendanceDate))).limit(1);
  if (existing[0]) {
    await db.update(studentAttendance).set({ status: record.status }).where(eq(studentAttendance.id, existing[0].id));
    return { ...existing[0], status: record.status };
  }
  const result = await db.insert(studentAttendance).values(record).returning({ id: studentAttendance.id });
  return { ...record, id: result[0].id };
}

export async function listScheduleSessions(studentEmail: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(scheduleSessions).where(eq(scheduleSessions.studentEmail, studentEmail));
}

export async function upsertScheduleSession(record: InsertScheduleSession & { id?: number }) {
  const db = await getDb();
  if (!db) return undefined;
  if (record.id) {
    await db.update(scheduleSessions).set({ studentEmail: record.studentEmail, sessionDate: record.sessionDate, subject: record.subject, exercise: record.exercise, sessionTime: record.sessionTime }).where(eq(scheduleSessions.id, record.id));
    return { ...record };
  }
  const existing = await db.select().from(scheduleSessions).where(and(eq(scheduleSessions.studentEmail, record.studentEmail), eq(scheduleSessions.sessionDate, record.sessionDate))).limit(1);
  if (existing[0]) {
    await db.update(scheduleSessions).set({ subject: record.subject, exercise: record.exercise, sessionTime: record.sessionTime }).where(eq(scheduleSessions.id, existing[0].id));
    return { ...existing[0], subject: record.subject, exercise: record.exercise, sessionTime: record.sessionTime };
  }
  const result = await db.insert(scheduleSessions).values(record).returning({ id: scheduleSessions.id });
  return { ...record, id: result[0].id };
}

export async function listMarkStatements(studentEmail: string, assessmentType?: "weekly" | "monthly") {
  const db = await getDb();
  if (!db) return [];
  const filters = assessmentType ? and(eq(markStatements.studentEmail, studentEmail), eq(markStatements.assessmentType, assessmentType)) : eq(markStatements.studentEmail, studentEmail);
  return db.select().from(markStatements).where(filters);
}

export async function upsertMarkStatement(record: InsertMarkStatement) {
  const db = await getDb();
  if (!db) return undefined;
  const existing = await db.select().from(markStatements).where(and(eq(markStatements.studentEmail, record.studentEmail), eq(markStatements.assessmentType, record.assessmentType), eq(markStatements.periodLabel, record.periodLabel), eq(markStatements.subject, record.subject))).limit(1);
  if (existing[0]) {
    await db.update(markStatements).set({ score: record.score, maxScore: record.maxScore }).where(eq(markStatements.id, existing[0].id));
    return { ...existing[0], score: record.score, maxScore: record.maxScore };
  }
  const result = await db.insert(markStatements).values(record).returning({ id: markStatements.id });
  return { ...record, id: result[0].id };
}

export async function listStudentProjects(studentEmail: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(studentProjects).where(eq(studentProjects.studentEmail, studentEmail));
}

export async function upsertStudentProject(record: InsertStudentProject) {
  const db = await getDb();
  if (!db) return undefined;
  const existing = await db.select().from(studentProjects).where(and(eq(studentProjects.studentEmail, record.studentEmail), eq(studentProjects.title, record.title))).limit(1);
  if (existing[0]) {
    await db.update(studentProjects).set({ subject: record.subject, dueDate: record.dueDate, status: record.status, progress: record.progress }).where(eq(studentProjects.id, existing[0].id));
    return { ...existing[0], subject: record.subject, dueDate: record.dueDate, status: record.status, progress: record.progress };
  }
  const result = await db.insert(studentProjects).values(record).returning({ id: studentProjects.id });
  return { ...record, id: result[0].id };
}

export async function listColleges() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(colleges);
}

export async function upsertCollege(record: InsertCollege) {
  const db = await getDb();
  if (!db) return undefined;
  const existing = await db.select().from(colleges).where(eq(colleges.name, record.name)).limit(1);
  if (existing[0]) {
    await db.update(colleges).set({ tier: record.tier, category: record.category, cutoff: record.cutoff }).where(eq(colleges.id, existing[0].id));
    return { ...existing[0], tier: record.tier, category: record.category, cutoff: record.cutoff };
  }
  const result = await db.insert(colleges).values(record).returning({ id: colleges.id });
  return { ...record, id: result[0].id };
}

export async function listGovernmentExams() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(governmentExams);
}

export async function upsertGovernmentExam(record: InsertGovernmentExam) {
  const db = await getDb();
  if (!db) return undefined;
  const existing = await db.select().from(governmentExams).where(eq(governmentExams.name, record.name)).limit(1);
  if (existing[0]) {
    await db.update(governmentExams).set({ groupName: record.groupName, qualification: record.qualification, maxMarks: record.maxMarks, benchmark: record.benchmark }).where(eq(governmentExams.id, existing[0].id));
    return { ...existing[0], groupName: record.groupName, qualification: record.qualification, maxMarks: record.maxMarks, benchmark: record.benchmark };
  }
  const result = await db.insert(governmentExams).values(record).returning({ id: governmentExams.id });
  return { ...record, id: result[0].id };
}

export async function listQuestionPapers(targetClass?: string) {
  const db = await getDb();
  if (!db) return [];
  if (targetClass) {
    return db.select().from(questionPapers).where(eq(questionPapers.targetClass, targetClass)).orderBy(desc(questionPapers.createdAt));
  }
  return db.select().from(questionPapers).orderBy(desc(questionPapers.createdAt));
}

export async function createQuestionPaper(paper: InsertQuestionPaper) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(questionPapers).values(paper).returning({ id: questionPapers.id });
  return result[0].id;
}

export async function deleteQuestionPaper(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.delete(questionPapers).where(eq(questionPapers.id, id));
}

export async function listUnitQuestions(targetClass?: string) {
  const db = await getDb();
  if (!db) return [];
  if (targetClass) {
    return db.select().from(unitQuestions).where(eq(unitQuestions.targetClass, targetClass)).orderBy(desc(unitQuestions.createdAt));
  }
  return db.select().from(unitQuestions).orderBy(desc(unitQuestions.createdAt));
}

export async function createUnitQuestion(question: InsertUnitQuestion) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(unitQuestions).values(question).returning({ id: unitQuestions.id });
  return result[0].id;
}

export async function deleteUnitQuestion(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.delete(unitQuestions).where(eq(unitQuestions.id, id));
}
