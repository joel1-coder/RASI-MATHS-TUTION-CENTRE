import { serial, pgEnum, pgTable, text, timestamp, varchar, integer } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["user", "admin", "student", "parent", "teacher"]);
export const attendanceStatusEnum = pgEnum("status", ["present", "late", "absent"]);
export const assessmentTypeEnum = pgEnum("assessmentType", ["weekly", "monthly"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  linkedStudentEmail: varchar("linkedStudentEmail", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 80 }).notNull(),
  code: varchar("code", { length: 30 }).notNull().unique(),
  summary: text("summary").notNull(),
  paperLabel: varchar("paperLabel", { length: 80 }).notNull(),
  durationMinutes: integer("durationMinutes").notNull().default(60),
  questionCount: integer("questionCount").notNull().default(20),
  accentColor: varchar("accentColor", { length: 20 }).notNull().default("#5968a9"),
  isFeatured: integer("isFeatured").notNull().default(0),
  sortOrder: integer("sortOrder").notNull().default(10),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Subject = typeof subjects.$inferSelect;
export type InsertSubject = typeof subjects.$inferInsert;

export const studentAttendance = pgTable("student_attendance", {
  id: serial("id").primaryKey(),
  studentEmail: varchar("studentEmail", { length: 320 }).notNull(),
  attendanceDate: varchar("attendanceDate", { length: 10 }).notNull(),
  status: attendanceStatusEnum("status").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type StudentAttendance = typeof studentAttendance.$inferSelect;
export type InsertStudentAttendance = typeof studentAttendance.$inferInsert;

export const scheduleSessions = pgTable("schedule_sessions", {
  id: serial("id").primaryKey(),
  studentEmail: varchar("studentEmail", { length: 320 }).notNull(),
  sessionDate: varchar("sessionDate", { length: 10 }).notNull(),
  subject: varchar("subject", { length: 120 }).notNull(),
  exercise: text("exercise").notNull(),
  sessionTime: varchar("sessionTime", { length: 80 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type ScheduleSession = typeof scheduleSessions.$inferSelect;
export type InsertScheduleSession = typeof scheduleSessions.$inferInsert;

export const markStatements = pgTable("mark_statements", {
  id: serial("id").primaryKey(),
  studentEmail: varchar("studentEmail", { length: 320 }).notNull(),
  assessmentType: assessmentTypeEnum("assessmentType").notNull(),
  periodLabel: varchar("periodLabel", { length: 80 }).notNull(),
  subject: varchar("subject", { length: 120 }).notNull(),
  score: integer("score").notNull(),
  maxScore: integer("maxScore").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const studentProjects = pgTable("student_projects", {
  id: serial("id").primaryKey(),
  studentEmail: varchar("studentEmail", { length: 320 }).notNull(),
  title: varchar("title", { length: 160 }).notNull(),
  subject: varchar("subject", { length: 120 }).notNull(),
  dueDate: varchar("dueDate", { length: 40 }).notNull(),
  status: varchar("status", { length: 40 }).notNull(),
  progress: integer("progress").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const colleges = pgTable("colleges", {
  id: serial("id").primaryKey(),
  tier: varchar("tier", { length: 80 }).notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  cutoff: varchar("cutoff", { length: 180 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const governmentExams = pgTable("government_exams", {
  id: serial("id").primaryKey(),
  groupName: varchar("groupName", { length: 120 }).notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  qualification: text("qualification").notNull(),
  maxMarks: varchar("maxMarks", { length: 120 }).notNull(),
  benchmark: varchar("benchmark", { length: 180 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type MarkStatement = typeof markStatements.$inferSelect;
export type InsertMarkStatement = typeof markStatements.$inferInsert;
export type StudentProject = typeof studentProjects.$inferSelect;
export type InsertStudentProject = typeof studentProjects.$inferInsert;
export type College = typeof colleges.$inferSelect;
export type InsertCollege = typeof colleges.$inferInsert;
export type GovernmentExam = typeof governmentExams.$inferSelect;
export type InsertGovernmentExam = typeof governmentExams.$inferInsert;
