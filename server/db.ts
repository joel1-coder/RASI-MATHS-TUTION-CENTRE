import { and, asc, desc, eq, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { colleges, governmentExams, InsertCollege, InsertGovernmentExam, InsertMarkStatement, InsertStudentAttendance, InsertStudentProject, InsertUser, InsertScheduleSession, markStatements, scheduleSessions, studentAttendance, studentProjects, subjects, InsertSubject, users, questionPapers, unitQuestions, InsertQuestionPaper, InsertUnitQuestion, siteSettings, InsertSiteSetting } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let _client: ReturnType<typeof postgres> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      // Supabase's transaction pooler (port 6543) does not support prepared
      // statements because connections can move between transactions.
      _client = postgres(process.env.DATABASE_URL, { prepare: false });
      _db = drizzle(_client);
      // Keep the materials tables compatible with the current Drizzle schema
      // even when the Supabase project was reset from an older snapshot.
      await _client.unsafe(`
        CREATE TABLE IF NOT EXISTS "question_papers" (
          "id" serial PRIMARY KEY,
          "title" varchar(200) NOT NULL,
          "subject" varchar(120) NOT NULL,
          "link" text NOT NULL DEFAULT '',
          "targetClass" varchar(120) NOT NULL,
          "createdAt" timestamp DEFAULT now() NOT NULL,
          "updatedAt" timestamp DEFAULT now() NOT NULL
        );
        ALTER TABLE "question_papers" ADD COLUMN IF NOT EXISTS "title" varchar(200);
        ALTER TABLE "question_papers" ADD COLUMN IF NOT EXISTS "subject" varchar(120);
        ALTER TABLE "question_papers" ADD COLUMN IF NOT EXISTS "link" text DEFAULT '';
        ALTER TABLE "question_papers" ADD COLUMN IF NOT EXISTS "targetClass" varchar(120);
        ALTER TABLE "question_papers" ADD COLUMN IF NOT EXISTS "createdAt" timestamp DEFAULT now();
        ALTER TABLE "question_papers" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp DEFAULT now();
        CREATE TABLE IF NOT EXISTS "unit_questions" (
          "id" serial PRIMARY KEY,
          "title" varchar(200) NOT NULL,
          "subject" varchar(120) NOT NULL,
          "link" text NOT NULL DEFAULT '',
          "targetClass" varchar(120) NOT NULL,
          "section" varchar(50) DEFAULT 'All Sections',
          "createdAt" timestamp DEFAULT now() NOT NULL,
          "updatedAt" timestamp DEFAULT now() NOT NULL
        );
        ALTER TABLE "unit_questions" ADD COLUMN IF NOT EXISTS "title" varchar(200);
        ALTER TABLE "unit_questions" ADD COLUMN IF NOT EXISTS "subject" varchar(120);
        ALTER TABLE "unit_questions" ADD COLUMN IF NOT EXISTS "link" text DEFAULT '';
        ALTER TABLE "unit_questions" ADD COLUMN IF NOT EXISTS "targetClass" varchar(120);
        ALTER TABLE "unit_questions" ADD COLUMN IF NOT EXISTS "section" varchar(50) DEFAULT 'All Sections';
        ALTER TABLE "unit_questions" ADD COLUMN IF NOT EXISTS "createdAt" timestamp DEFAULT now();
        ALTER TABLE "unit_questions" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp DEFAULT now();
      `).catch(() => {});
      // Ensure users has academic enrollment fields (department, section, session, joinedDate)
      await _client.unsafe(`
        ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "department" varchar(120);
        ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "section" varchar(60);
        ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "session" varchar(120);
        ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "joinedDate" varchar(60);
        ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "portalPassword" text;
        ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "status" varchar(20) NOT NULL DEFAULT 'active';
      `).catch(() => {});
      await _client.unsafe(`ALTER TABLE "student_attendance" ADD COLUMN IF NOT EXISTS "description" text NOT NULL DEFAULT '';`).catch(() => {});
      // Vercel does not run Drizzle migrations automatically. Keep existing
      // project rows readable after adding the persisted description field.
      await _client.unsafe(`ALTER TABLE "student_projects" ADD COLUMN IF NOT EXISTS "description" text NOT NULL DEFAULT '';`).catch((error) => {
        console.error("[Database] Could not add student_projects.description:", error);
      });
      // Ensure site_settings table exists for persistent portfolio content
      _client.unsafe(`
        CREATE TABLE IF NOT EXISTS "site_settings" (
          "id" serial PRIMARY KEY,
          "key" varchar(80) NOT NULL UNIQUE,
          "value" text NOT NULL,
          "updatedAt" timestamp DEFAULT now() NOT NULL
        );
      `).catch(() => {});
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

/** Look up a portal user by email or student ID (used for password-based login) */
export async function getUserByEmail(emailOrId: string, role?: string) {
  const db = await getDb();
  if (!db) return undefined;
  const key = emailOrId.trim().toLowerCase();
  const openIdWithRole = role ? `portal_user_${role}_${key.replace(/[^a-z0-9]/g, "_")}` : null;
  const legacyOpenId = `portal_user_${key.replace(/[^a-z0-9]/g, "_")}`;
  
  const idOrEmailMatches = [
    eq(users.email, key),
    eq(users.openId, legacyOpenId)
  ];
  if (openIdWithRole) {
    idOrEmailMatches.push(eq(users.openId, openIdWithRole));
  }
  
  const conditions = [or(...idOrEmailMatches)];
  if (role) {
    conditions.push(eq(users.role, role as any));
  }
  
  const result = await db.select().from(users).where(and(...conditions)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Create or fully update a portal user (admin-managed account with password).
 * openId includes role so parent and student sharing the same email never collide.
 */
export async function upsertPortalUser(input: {
  email: string;
  name: string;
  password: string;
  role: "student" | "parent" | "teacher" | "admin";
  linkedStudentEmail?: string | null;
  department?: string | null;
  section?: string | null;
  session?: string | null;
  joinedDate?: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const emailKey = input.email.trim().toLowerCase();
  const openId = `portal_user_${input.role}_${emailKey.replace(/[^a-z0-9]/g, "_")}`;
  const values = {
    openId,
    email: emailKey,
    name: input.name,
    role: input.role,
    portalPassword: input.password,
    linkedStudentEmail: input.linkedStudentEmail ?? null,
    department: input.department ?? null,
    section: input.section ?? null,
    session: input.session ?? null,
    joinedDate: input.joinedDate ?? null,
    loginMethod: "password" as const,
    lastSignedIn: new Date(),
  };
  await db
    .insert(users)
    .values(values)
    .onConflictDoUpdate({
      target: users.openId,
      set: {
        email: values.email,
        name: values.name,
        role: values.role,
        portalPassword: values.portalPassword,
        linkedStudentEmail: values.linkedStudentEmail,
        department: values.department,
        section: values.section,
        session: values.session,
        joinedDate: values.joinedDate,
        loginMethod: values.loginMethod,
        status: "active",
        updatedAt: new Date(),
      },
    });
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

/** Update one existing portal account without replacing fields managed elsewhere. */
export async function updatePortalUser(input: {
  currentEmail: string;
  email?: string;
  name?: string;
  password?: string;
  role?: "student" | "parent" | "teacher" | "admin";
  linkedStudentEmail?: string | null;
  department?: string | null;
  section?: string | null;
  session?: string | null;
  joinedDate?: string | null;
  status?: "active" | "inactive";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const currentEmail = input.currentEmail.trim().toLowerCase();
  const current = await db.select().from(users).where(eq(users.email, currentEmail)).limit(1);
  if (!current[0]) throw new Error("Portal account was not found");

  const account = current[0];
  const nextEmail = input.email?.trim().toLowerCase() || currentEmail;
  const nextRole = input.role ?? account.role;
  const updateSet: Record<string, unknown> = { updatedAt: new Date() };
  if (input.email !== undefined) updateSet.email = nextEmail;
  if (input.name !== undefined) updateSet.name = input.name;
  if (input.password !== undefined) updateSet.portalPassword = input.password;
  if (input.role !== undefined) updateSet.role = input.role;
  if (input.linkedStudentEmail !== undefined) updateSet.linkedStudentEmail = input.linkedStudentEmail;
  if (input.department !== undefined) updateSet.department = input.department;
  if (input.section !== undefined) updateSet.section = input.section;
  if (input.session !== undefined) updateSet.session = input.session;
  if (input.joinedDate !== undefined) updateSet.joinedDate = input.joinedDate;
  if (input.status !== undefined) updateSet.status = input.status;
  if (nextEmail !== currentEmail || input.role !== undefined) {
    updateSet.openId = `portal_user_${nextRole}_${nextEmail.replace(/[^a-z0-9]/g, "_")}`;
  }

  await db.update(users).set(updateSet as any).where(eq(users.id, account.id));

  // Keep parent/alias relationships valid when the canonical student email changes.
  if (account.role === "student" && !account.linkedStudentEmail && nextEmail !== currentEmail) {
    await db.update(users).set({ linkedStudentEmail: nextEmail, updatedAt: new Date() }).where(eq(users.linkedStudentEmail, currentEmail));
  }

  const result = await db.select().from(users).where(eq(users.id, account.id)).limit(1);
  return result[0];
}

/** Delete a portal user by email or studentId, including linked accounts */
export async function deletePortalUser(email: string) {
  const db = await getDb();
  if (!db) return;
  const target = email.trim().toLowerCase();
  await db.delete(users).where(
    or(
      eq(users.email, target),
      eq(users.linkedStudentEmail, target)
    )
  );
}

/** List all portal users (with password) - admin only */
export async function listPortalUsers(role?: "student" | "parent" | "teacher" | "admin") {
  const db = await getDb();
  if (!db) return [];
  if (role) {
    return db.select().from(users).where(eq(users.role, role)).orderBy(asc(users.createdAt));
  }
  return db.select().from(users).orderBy(asc(users.role), asc(users.createdAt));
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
  if (!db) throw new Error("Database is not available while loading attendance");
  return db.select().from(studentAttendance).where(eq(studentAttendance.studentEmail, studentEmail)).orderBy(desc(studentAttendance.attendanceDate));
}

export async function listAllStudentAttendance() {
  const db = await getDb();
  if (!db) throw new Error("Database is not available while loading attendance");
  return db.select().from(studentAttendance).orderBy(desc(studentAttendance.attendanceDate));
}

export async function upsertStudentAttendance(record: InsertStudentAttendance) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available while saving attendance");
  const existing = await db.select().from(studentAttendance).where(and(eq(studentAttendance.studentEmail, record.studentEmail), eq(studentAttendance.attendanceDate, record.attendanceDate))).limit(1);
  if (existing[0]) {
    await db.update(studentAttendance).set({ status: record.status, description: record.description ?? "" }).where(eq(studentAttendance.id, existing[0].id));
    return { ...existing[0], status: record.status, description: record.description ?? "" };
  }
  const result = await db.insert(studentAttendance).values(record).returning({ id: studentAttendance.id });
  return { ...record, id: result[0].id };
}

export async function deleteStudentAttendanceById(id: number) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(studentAttendance).where(eq(studentAttendance.id, id));
  return true;
}

export async function deleteStudentAttendanceBatch(ids: number[]) {
  const db = await getDb();
  if (!db || !ids.length) return false;
  for (const id of ids) {
    await db.delete(studentAttendance).where(eq(studentAttendance.id, id));
  }
  return true;
}

export async function updateStudentAttendanceById(id: number, status: "present" | "late" | "absent", attendanceDate?: string, description?: string) {
  const db = await getDb();
  if (!db) return undefined;
  const payload: any = { status };
  if (attendanceDate) payload.attendanceDate = attendanceDate;
  if (description !== undefined) payload.description = description;
  await db.update(studentAttendance).set(payload).where(eq(studentAttendance.id, id));
  return { id, status, attendanceDate };
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
  try {
    return await db.select().from(studentProjects).where(eq(studentProjects.studentEmail, studentEmail));
  } catch (error) {
    // Keep older Supabase deployments readable while their schema catches up.
    // The compatibility query intentionally omits the recently added field.
    console.error("[Database] Project schema is older than the app; using compatibility query:", error);
    const legacyRows = await db.select({
      id: studentProjects.id,
      studentEmail: studentProjects.studentEmail,
      title: studentProjects.title,
      subject: studentProjects.subject,
      dueDate: studentProjects.dueDate,
      status: studentProjects.status,
      progress: studentProjects.progress,
      createdAt: studentProjects.createdAt,
      updatedAt: studentProjects.updatedAt,
    }).from(studentProjects).where(eq(studentProjects.studentEmail, studentEmail));
    return legacyRows.map(row => ({ ...row, description: "" }));
  }
}

export async function upsertStudentProject(record: InsertStudentProject) {
  const db = await getDb();
  if (!db) return undefined;
  const existing = await db.select().from(studentProjects).where(and(eq(studentProjects.studentEmail, record.studentEmail), eq(studentProjects.title, record.title))).limit(1);
  if (existing[0]) {
    await db.update(studentProjects).set({ description: record.description, subject: record.subject, dueDate: record.dueDate, status: record.status, progress: record.progress }).where(eq(studentProjects.id, existing[0].id));
    return { ...existing[0], description: record.description, subject: record.subject, dueDate: record.dueDate, status: record.status, progress: record.progress };
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
  const exams = await db.select().from(governmentExams);
  const higherSecondaryPattern = /12th|10\+2|higher secondary|senior secondary|intermediate/i;
  const excludedPattern = /10th|sslc|matric|degree|bachelor|graduate|post[- ]?graduation|any degree/i;
  return exams.filter((exam) => {
    const details = `${exam.name} ${exam.qualification}`;
    return higherSecondaryPattern.test(details) && !excludedPattern.test(details);
  });
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

export async function upsertBulkMarks(records: InsertMarkStatement[]) {
  const db = await getDb();
  if (!db) return [];
  const results = [];
  for (const record of records) {
    const res = await upsertMarkStatement(record);
    if (res) results.push(res);
  }
  return results;
}

export async function upsertBulkProjects(records: InsertStudentProject[]) {
  const db = await getDb();
  if (!db) return [];
  const results = [];
  for (const record of records) {
    const res = await upsertStudentProject(record);
    if (res) results.push(res);
  }
  return results;
}

export async function upsertBulkGovernmentExams(records: InsertGovernmentExam[]) {
  const db = await getDb();
  if (!db) return [];
  const results = [];
  for (const record of records) {
    const res = await upsertGovernmentExam(record);
    if (res) results.push(res);
  }
  return results;
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

export async function listUnitQuestions(targetClass?: string, section?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (targetClass && targetClass !== "All classes" && targetClass !== "All") {
    conditions.push(eq(unitQuestions.targetClass, targetClass));
  }
  if (section && section !== "All Sections" && section !== "All") {
    conditions.push(or(eq(unitQuestions.section, section), eq(unitQuestions.section, "All Sections")));
  }
  if (conditions.length > 0) {
    return db.select().from(unitQuestions).where(and(...conditions)).orderBy(desc(unitQuestions.createdAt));
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

export async function getSiteSettings(key: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(siteSettings).where(eq(siteSettings.key, key)).limit(1);
  return result[0]?.value ?? null;
}

export async function upsertSiteSettings(key: string, value: string): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save site settings: DB unavailable");
    return;
  }
  if (_client) {
    await _client.unsafe(
      `INSERT INTO "site_settings" ("key", "value", "updatedAt") 
       VALUES ($1, $2, NOW()) 
       ON CONFLICT ("key") DO UPDATE 
       SET "value" = EXCLUDED."value", "updatedAt" = NOW();`,
      [key, value]
    );
  }
}
