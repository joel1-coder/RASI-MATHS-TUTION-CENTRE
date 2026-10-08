import { COOKIE_NAME } from "../shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { createSubject, deleteSubject, getDb, listFeaturedSubjects, listScheduleSessions, listStudentAttendance, listSubjects, updateSubject, upsertScheduleSession, upsertStudentAttendance, listColleges, listGovernmentExams, listMarkStatements, listStudentProjects, setUserRoleByEmail, upsertCollege, upsertGovernmentExam, upsertMarkStatement, upsertStudentProject, upsertUser, createQuestionPaper, deleteQuestionPaper, listQuestionPapers, createUnitQuestion, deleteUnitQuestion, listUnitQuestions, upsertBulkMarks, upsertBulkProjects, upsertBulkGovernmentExams, getUserByEmail, upsertPortalUser, deletePortalUser, listPortalUsers } from "./db";
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

// ── Admin bootstrap: one hard-coded admin account for first-time setup ────────
// Once you log in as admin and create real accounts via User Management,
// you may rotate this password by updating ADMIN_BOOTSTRAP_PASSWORD in Vercel env.
const BOOTSTRAP_ADMIN_EMAIL    = process.env.ADMIN_BOOTSTRAP_EMAIL    ?? "admin@rasi.edu";
const BOOTSTRAP_ADMIN_PASSWORD = process.env.ADMIN_BOOTSTRAP_PASSWORD ?? "RasiAdmin@2026";
const BOOTSTRAP_ADMIN_NAME     = "Centre Admin";

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
        email: z.string().min(1),
        password: z.string().min(1),
        role: z.enum(["student", "parent", "admin", "teacher"]).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const emailKey = input.email.trim().toLowerCase();

        // ── 1. Bootstrap admin check (works even before DB migration runs) ──
        if (
          emailKey === BOOTSTRAP_ADMIN_EMAIL.toLowerCase() &&
          input.password === BOOTSTRAP_ADMIN_PASSWORD &&
          (!input.role || input.role === "admin")
        ) {
          // Seed this admin into the DB so it persists
          try {
            await upsertPortalUser({
              email: emailKey,
              name: BOOTSTRAP_ADMIN_NAME,
              password: BOOTSTRAP_ADMIN_PASSWORD,
              role: "admin",
            });
          } catch (e) {
            console.warn("[Auth] Bootstrap admin DB seed warning:", e);
          }
          const openId = `portal_user_${emailKey.replace(/[^a-z0-9]/g, "_")}`;
          const token = await sdk.signSession({ openId, appId: ENV.appId, name: BOOTSTRAP_ADMIN_NAME });
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, token, cookieOptions);
          return {
            success: true,
            token,
            user: { id: 0, openId, email: emailKey, name: BOOTSTRAP_ADMIN_NAME, role: "admin" as const, linkedStudentEmail: null },
          };
        }

        // ── 2. DB lookup ──────────────────────────────────────────────────────
        const dbUser = await getUserByEmail(emailKey);

        if (!dbUser || !dbUser.portalPassword || dbUser.portalPassword !== input.password) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid email or password. Access denied.",
          });
        }

        if (input.role && dbUser.role !== input.role) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: `This account is not registered for the ${input.role} role.`,
          });
        }

        // Update last signed-in timestamp
        try {
          await upsertUser({
            openId: dbUser.openId,
            lastSignedIn: new Date(),
          });
        } catch (e) {
          console.warn("[Auth] lastSignedIn update warning:", e);
        }

        const token = await sdk.signSession({
          openId: dbUser.openId,
          appId: ENV.appId,
          name: dbUser.name ?? "",
        });

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, cookieOptions);

        return {
          success: true,
          token,
          user: {
            id: dbUser.id,
            openId: dbUser.openId,
            email: dbUser.email ?? emailKey,
            name: dbUser.name ?? "",
            role: dbUser.role,
            linkedStudentEmail: dbUser.linkedStudentEmail ?? null,
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
    marksBulk: adminProcedure.input(z.object({ records: z.array(z.object({ studentEmail: z.string().email(), assessmentType: z.enum(["weekly", "monthly"]), periodLabel: z.string().min(1), subject: z.string().min(1), score: z.number().int().min(0), maxScore: z.number().int().positive() })).min(1) })).mutation(({ input }) => upsertBulkMarks(input.records)),
    project: adminProcedure.input(z.object({ studentEmail: z.string().email(), title: z.string().min(1), subject: z.string().min(1), dueDate: z.string().min(1), status: z.string().min(1), progress: z.number().int().min(0).max(100) })).mutation(({ input }) => upsertStudentProject(input)),
    projectBulk: adminProcedure.input(z.object({ records: z.array(z.object({ studentEmail: z.string().email(), title: z.string().min(1), subject: z.string().min(1), dueDate: z.string().min(1), status: z.string().min(1), progress: z.number().int().min(0).max(100) })).min(1) })).mutation(({ input }) => upsertBulkProjects(input.records)),
    college: adminProcedure.input(z.object({ tier: z.string().min(1), name: z.string().min(1), category: z.string().min(1), cutoff: z.string().min(1) })).mutation(({ input }) => upsertCollege(input)),
    exam: adminProcedure.input(z.object({ groupName: z.string().min(1), name: z.string().min(1), qualification: z.string().min(1), maxMarks: z.string().min(1), benchmark: z.string().min(1) })).mutation(({ input }) => upsertGovernmentExam(input)),
    examBulk: adminProcedure.input(z.object({ records: z.array(z.object({ groupName: z.string().min(1), name: z.string().min(1), qualification: z.string().min(1), maxMarks: z.string().min(1), benchmark: z.string().min(1) })).min(1) })).mutation(({ input }) => upsertBulkGovernmentExams(input.records)),
    setUserRole: adminProcedure.input(z.object({ email: z.string().email(), role: z.enum(["user", "admin", "student", "parent", "teacher"]), linkedStudentEmail: z.string().email().optional() })).mutation(({ input }) => setUserRoleByEmail(input.email, input.role, input.linkedStudentEmail)),
    createQuestionPaper: adminProcedure.input(z.object({ title: z.string().min(1), subject: z.string().min(1), link: z.string().min(1), targetClass: z.string().min(1) })).mutation(({ input }) => createQuestionPaper(input)),
    deleteQuestionPaper: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => deleteQuestionPaper(input.id)),
    listQuestionPapers: adminProcedure.query(() => listQuestionPapers()),
    createUnitQuestion: adminProcedure.input(z.object({ title: z.string().min(1), subject: z.string().min(1), link: z.string().min(1), targetClass: z.string().min(1) })).mutation(({ input }) => createUnitQuestion(input)),
    deleteUnitQuestion: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => deleteUnitQuestion(input.id)),
    listUnitQuestions: adminProcedure.query(() => listUnitQuestions()),

    // ── Portal User Management (saves to Supabase DB) ────────────────────────
    createPortalUser: adminProcedure
      .input(z.object({
        email: z.string().email(),
        name: z.string().min(1).max(120),
        password: z.string().min(4).max(100),
        role: z.enum(["student", "parent", "teacher", "admin"]),
        linkedStudentEmail: z.string().email().optional().nullable(),
      }))
      .mutation(({ input }) => upsertPortalUser({
        email: input.email,
        name: input.name,
        password: input.password,
        role: input.role,
        linkedStudentEmail: input.linkedStudentEmail ?? null,
      })),

    updatePortalUser: adminProcedure
      .input(z.object({
        email: z.string().email(),
        name: z.string().min(1).max(120),
        password: z.string().min(4).max(100),
        role: z.enum(["student", "parent", "teacher", "admin"]),
        linkedStudentEmail: z.string().email().optional().nullable(),
      }))
      .mutation(({ input }) => upsertPortalUser({
        email: input.email,
        name: input.name,
        password: input.password,
        role: input.role,
        linkedStudentEmail: input.linkedStudentEmail ?? null,
      })),

    deletePortalUser: adminProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(({ input }) => deletePortalUser(input.email)),

    listPortalUsers: adminProcedure
      .input(z.object({ role: z.enum(["student", "parent", "teacher"]).optional() }))
      .query(({ input }) => listPortalUsers(input.role)),

    // ── Bulk student + parent login creation (called when admin adds students) ──
    bulkCreateStudentLogins: publicProcedure
      .input(z.object({
        students: z.array(z.object({
          studentId:      z.string().optional(),
          studentName:    z.string().min(1),
          studentEmail:   z.string().min(1),
          studentPassword: z.string().min(1),
          parentName:     z.string().optional().default("Parent"),
          parentEmail:    z.string().optional(),
          parentPassword: z.string().min(1).optional(),
        })).min(1).max(500),
      }))
      .mutation(async ({ input }) => {
        const results: { email: string; role: string; success: boolean; error?: string }[] = [];
        for (const s of input.students) {
          // Create student portal login (by studentEmail)
          try {
            await upsertPortalUser({
              email: s.studentEmail,
              name:  s.studentName,
              password: s.studentPassword,
              role: "student",
              linkedStudentEmail: null,
            });
            // If studentId is distinct, also register login alias so student can log in using studentId
            if (s.studentId && s.studentId.trim().toLowerCase() !== s.studentEmail.trim().toLowerCase()) {
              await upsertPortalUser({
                email: s.studentId.trim(),
                name:  s.studentName,
                password: s.studentPassword,
                role: "student",
                linkedStudentEmail: s.studentEmail,
              });
            }
            results.push({ email: s.studentEmail, role: "student", success: true });
          } catch (e: any) {
            results.push({ email: s.studentEmail, role: "student", success: false, error: e?.message });
          }
          // Create parent portal login (only if parent email + password provided)
          if (s.parentEmail && s.parentPassword) {
            try {
              await upsertPortalUser({
                email: s.parentEmail,
                name:  s.parentName || "Parent",
                password: s.parentPassword,
                role: "parent",
                linkedStudentEmail: s.studentEmail,
              });
              results.push({ email: s.parentEmail, role: "parent", success: true });
            } catch (e: any) {
              results.push({ email: s.parentEmail, role: "parent", success: false, error: e?.message });
            }
          }
        }
        const successful = results.filter(r => r.success).length;
        const failed     = results.filter(r => !r.success).length;
        return { successful, failed, results };
      }),
  }),  // end admin router

  materials: router({
    questionPapers: protectedProcedure.input(z.object({ targetClass: z.string().optional() })).query(({ input }) => listQuestionPapers(input.targetClass)),
    unitQuestions: protectedProcedure.input(z.object({ targetClass: z.string().optional() })).query(({ input }) => listUnitQuestions(input.targetClass)),
  }),

  guidance: router({
    colleges: publicProcedure.query(() => listColleges()),
    exams: publicProcedure.query(() => listGovernmentExams()),
  }),
});

export type AppRouter = typeof appRouter;
