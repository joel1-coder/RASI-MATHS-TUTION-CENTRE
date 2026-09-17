import { COOKIE_NAME } from "../shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { createSubject, deleteSubject, getDb, listFeaturedSubjects, listScheduleSessions, listStudentAttendance, listSubjects, updateSubject, upsertScheduleSession, upsertStudentAttendance, listColleges, listGovernmentExams, listMarkStatements, listStudentProjects, setUserRoleByEmail, upsertCollege, upsertGovernmentExam, upsertMarkStatement, upsertStudentProject, upsertUser } from "./db";
import { subjects } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { cloudinaryRouter } from "./cloudinaryRouter";
import { sdk } from "./_core/sdk";
import { ENV } from "./_core/env";

const subjectFields = {
  name: z.string().trim().min(2).max(80),
  code: z.string().trim().min(2).max(30).regex(/^[A-Za-z0-9-]+$/),
  summary: z.string().trim().min(10).max(240),
  paperLabel: z.string().trim().min(2).max(80),
  durationMinutes: z.number().int().min(10).max(240),
  questionCount: z.number().int().min(1).max(200),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  isFeatured: z.number().int().min(0).max(1),
  sortOrder: z.number().int().min(0).max(999),
};
const subjectInput = z.object(subjectFields);
const subjectUpdateInput = subjectInput.partial().extend({ id: z.number().int().positive() });

const VALID_CREDENTIALS: Record<string, { role: "student" | "parent" | "admin" | "teacher"; name: string; email: string; password: string; linkedStudentEmail?: string }> = {
  "student@portal.com": { role: "student", name: "Ananya Sharma", email: "student@portal.com", password: "student123" },
  "parent@portal.com":  { role: "parent",  name: "Ramesh Sharma",  email: "parent@portal.com",  password: "parent123", linkedStudentEmail: "student@portal.com" },
  "teacher@portal.com": { role: "teacher", name: "Prof. Aarav Menon", email: "teacher@portal.com", password: "teacher123" },
  "admin@portal.com":   { role: "admin",   name: "Centre Admin",  email: "admin@portal.com",   password: "admin123" },
};

async function getFeaturedCount() {
  const db = await getDb();
  if (!db) return 0;
  const featured = await db.select({ id: subjects.id }).from(subjects).where(eq(subjects.isFeatured, 1));
  return featured.length;
}

export const appRouter = router({
  system: systemRouter,
  cloudinary: cloudinaryRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(1),
        role: z.enum(["student", "parent", "admin", "teacher"]).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const emailKey = input.email.trim().toLowerCase();
        const cred = VALID_CREDENTIALS[emailKey];

        if (!cred || cred.password !== input.password) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid email or password. Access denied.",
          });
        }

        if (input.role && cred.role !== input.role) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: `This account is not registered for the ${input.role} role.`,
          });
        }

        const openId = `portal_user_${emailKey.replace(/[^a-z0-9]/g, "_")}`;

        try {
          await upsertUser({
            openId,
            email: cred.email,
            name: cred.name,
            role: cred.role,
            linkedStudentEmail: cred.linkedStudentEmail ?? null,
            loginMethod: "password",
          });
        } catch (e) {
          console.warn("[Auth Login Upsert Warning]", e);
        }

        const token = await sdk.signSession({
          openId,
          appId: ENV.appId,
          name: cred.name,
        });

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, cookieOptions);

        return {
          success: true,
          token,
          user: {
            id: 1,
            openId,
            email: cred.email,
            name: cred.name,
            role: cred.role,
            linkedStudentEmail: cred.linkedStudentEmail ?? null,
          },
        };
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  subjects: router({
    featured: publicProcedure.query(() => listFeaturedSubjects()),
    all: adminProcedure.query(() => listSubjects()),
    create: adminProcedure.input(subjectInput).mutation(async ({ input }) => {
      if (input.isFeatured === 1 && (await getFeaturedCount()) >= 3) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Keep exactly three featured papers on the student page." });
      }
      return createSubject(input);
    }),
    update: adminProcedure.input(subjectUpdateInput).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is not available" });
      const existing = await db.select().from(subjects).where(eq(subjects.id, input.id)).limit(1);
      if (!existing[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Subject not found" });
      const nextFeatured = input.isFeatured ?? existing[0].isFeatured;
      const featuredCount = await getFeaturedCount();
      if (nextFeatured === 1 && existing[0].isFeatured === 0 && featuredCount >= 3) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Keep exactly three featured papers on the student page." });
      }
      if (nextFeatured === 0 && existing[0].isFeatured === 1 && featuredCount <= 3) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "The student page must always have three featured papers." });
      }
      const { id, ...changes } = input;
      await updateSubject(id, changes);
      return { success: true } as const;
    }),
    delete: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is not available" });
      const existing = await db.select({ id: subjects.id, isFeatured: subjects.isFeatured }).from(subjects).where(eq(subjects.id, input.id)).limit(1);
      if (!existing[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Subject not found" });
      if (existing[0].isFeatured === 1 && (await getFeaturedCount()) <= 3) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Featured papers cannot be deleted until another paper replaces them." });
      }
      await deleteSubject(input.id);
      return { success: true } as const;
    }),
  }),
  student: router({
    attendance: protectedProcedure.input(z.object({ studentEmail: z.string().email() })).query(({ ctx, input }) => { if (ctx.user.role !== "admin" && ctx.user.email !== input.studentEmail && ctx.user.linkedStudentEmail !== input.studentEmail) throw new TRPCError({ code: "FORBIDDEN" }); return listStudentAttendance(input.studentEmail); }),
    schedule: protectedProcedure.input(z.object({ studentEmail: z.string().email() })).query(({ ctx, input }) => { if (ctx.user.role !== "admin" && ctx.user.email !== input.studentEmail && ctx.user.linkedStudentEmail !== input.studentEmail) throw new TRPCError({ code: "FORBIDDEN" }); return listScheduleSessions(input.studentEmail); }),
    marks: protectedProcedure.input(z.object({ studentEmail: z.string().email(), assessmentType: z.enum(["weekly", "monthly"]).optional() })).query(({ ctx, input }) => { if (ctx.user.role !== "admin" && ctx.user.email !== input.studentEmail && ctx.user.linkedStudentEmail !== input.studentEmail) throw new TRPCError({ code: "FORBIDDEN" }); return listMarkStatements(input.studentEmail, input.assessmentType); }),
    projects: protectedProcedure.input(z.object({ studentEmail: z.string().email() })).query(({ ctx, input }) => { if (ctx.user.role !== "admin" && ctx.user.email !== input.studentEmail && ctx.user.linkedStudentEmail !== input.studentEmail) throw new TRPCError({ code: "FORBIDDEN" }); return listStudentProjects(input.studentEmail); }),
  }),
  admin: router({
    attendance: adminProcedure.input(z.object({ studentEmail: z.string().email(), attendanceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), status: z.enum(["present", "late", "absent"]) })).mutation(({ input }) => upsertStudentAttendance(input)),
    attendanceBulk: adminProcedure.input(z.object({ records: z.array(z.object({ studentEmail: z.string().email(), attendanceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), status: z.enum(["present", "late", "absent"]) })).min(1).max(1000) })).mutation(async ({ input }) => Promise.all(input.records.map(record => upsertStudentAttendance(record)))),
    schedule: adminProcedure.input(z.object({ id: z.number().int().positive().optional(), studentEmail: z.string().email(), sessionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), subject: z.string().min(1), exercise: z.string().min(1), sessionTime: z.string().optional() })).mutation(({ input }) => upsertScheduleSession(input)),
    marks: adminProcedure.input(z.object({ studentEmail: z.string().email(), assessmentType: z.enum(["weekly", "monthly"]), periodLabel: z.string().min(1), subject: z.string().min(1), score: z.number().int().min(0), maxScore: z.number().int().positive() })).mutation(({ input }) => upsertMarkStatement(input)),
    project: adminProcedure.input(z.object({ studentEmail: z.string().email(), title: z.string().min(1), subject: z.string().min(1), dueDate: z.string().min(1), status: z.string().min(1), progress: z.number().int().min(0).max(100) })).mutation(({ input }) => upsertStudentProject(input)),
    college: adminProcedure.input(z.object({ tier: z.string().min(1), name: z.string().min(1), category: z.string().min(1), cutoff: z.string().min(1) })).mutation(({ input }) => upsertCollege(input)),
    exam: adminProcedure.input(z.object({ groupName: z.string().min(1), name: z.string().min(1), qualification: z.string().min(1), maxMarks: z.string().min(1), benchmark: z.string().min(1) })).mutation(({ input }) => upsertGovernmentExam(input)),
    setUserRole: adminProcedure.input(z.object({ email: z.string().email(), role: z.enum(["user", "admin", "student", "parent", "teacher"]), linkedStudentEmail: z.string().email().optional() })).mutation(({ input }) => setUserRoleByEmail(input.email, input.role, input.linkedStudentEmail)),
  }),

  guidance: router({
    colleges: publicProcedure.query(() => listColleges()),
    exams: publicProcedure.query(() => listGovernmentExams()),
  }),
});

export type AppRouter = typeof appRouter;
