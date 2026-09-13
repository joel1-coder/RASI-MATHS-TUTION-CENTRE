import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  linkedStudentEmail: varchar("linkedStudentEmail", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "student", "parent"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const subjects = mysqlTable("subjects", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 80 }).notNull(),
  code: varchar("code", { length: 30 }).notNull().unique(),
  summary: text("summary").notNull(),
  paperLabel: varchar("paperLabel", { length: 80 }).notNull(),
  durationMinutes: int("durationMinutes").notNull().default(60),
  questionCount: int("questionCount").notNull().default(20),
  accentColor: varchar("accentColor", { length: 20 }).notNull().default("#5968a9"),
  isFeatured: int("isFeatured").notNull().default(0),
  sortOrder: int("sortOrder").notNull().default(10),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subject = typeof subjects.$inferSelect;
export type InsertSubject = typeof subjects.$inferInsert;

export const studentAttendance = mysqlTable("student_attendance", {
  id: int("id").autoincrement().primaryKey(),
  studentEmail: varchar("studentEmail", { length: 320 }).notNull(),
  attendanceDate: varchar("attendanceDate", { length: 10 }).notNull(),
  status: mysqlEnum("status", ["present", "late", "absent"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StudentAttendance = typeof studentAttendance.$inferSelect;
export type InsertStudentAttendance = typeof studentAttendance.$inferInsert;

export const scheduleSessions = mysqlTable("schedule_sessions", {
  id: int("id").autoincrement().primaryKey(),
  studentEmail: varchar("studentEmail", { length: 320 }).notNull(),
  sessionDate: varchar("sessionDate", { length: 10 }).notNull(),
  subject: varchar("subject", { length: 120 }).notNull(),
  exercise: text("exercise").notNull(),
  sessionTime: varchar("sessionTime", { length: 80 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ScheduleSession = typeof scheduleSessions.$inferSelect;
export type InsertScheduleSession = typeof scheduleSessions.$inferInsert;

export const markStatements = mysqlTable("mark_statements", {
  id: int("id").autoincrement().primaryKey(),
  studentEmail: varchar("studentEmail", { length: 320 }).notNull(),
  assessmentType: mysqlEnum("assessmentType", ["weekly", "monthly"]).notNull(),
  periodLabel: varchar("periodLabel", { length: 80 }).notNull(),
  subject: varchar("subject", { length: 120 }).notNull(),
  score: int("score").notNull(),
  maxScore: int("maxScore").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const studentProjects = mysqlTable("student_projects", {
  id: int("id").autoincrement().primaryKey(),
  studentEmail: varchar("studentEmail", { length: 320 }).notNull(),
  title: varchar("title", { length: 160 }).notNull(),
  subject: varchar("subject", { length: 120 }).notNull(),
  dueDate: varchar("dueDate", { length: 40 }).notNull(),
  status: varchar("status", { length: 40 }).notNull(),
  progress: int("progress").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const colleges = mysqlTable("colleges", {
  id: int("id").autoincrement().primaryKey(),
  tier: varchar("tier", { length: 80 }).notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  cutoff: varchar("cutoff", { length: 180 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const governmentExams = mysqlTable("government_exams", {
  id: int("id").autoincrement().primaryKey(),
  groupName: varchar("groupName", { length: 120 }).notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  qualification: text("qualification").notNull(),
  maxMarks: varchar("maxMarks", { length: 120 }).notNull(),
  benchmark: varchar("benchmark", { length: 180 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MarkStatement = typeof markStatements.$inferSelect;
export type InsertMarkStatement = typeof markStatements.$inferInsert;
export type StudentProject = typeof studentProjects.$inferSelect;
export type InsertStudentProject = typeof studentProjects.$inferInsert;
export type College = typeof colleges.$inferSelect;
export type InsertCollege = typeof colleges.$inferInsert;
export type GovernmentExam = typeof governmentExams.$inferSelect;
export type InsertGovernmentExam = typeof governmentExams.$inferInsert;
