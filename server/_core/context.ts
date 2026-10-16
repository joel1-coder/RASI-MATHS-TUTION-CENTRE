import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { users } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { getDb } from "../db";
import { eq } from "drizzle-orm";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }

  const rawDemoEmail = opts.req.headers["x-demo-user"];
  const rawDemoRole = opts.req.headers["x-demo-role"];
  const rawDemoName = opts.req.headers["x-demo-name"];
  const rawLinkedStudent = opts.req.headers["x-linked-student"];

  const demoEmail = (Array.isArray(rawDemoEmail) ? rawDemoEmail[0] : rawDemoEmail)?.trim();
  const demoRole = (Array.isArray(rawDemoRole) ? rawDemoRole[0] : rawDemoRole)?.trim();
  const demoName = rawDemoName ? decodeURIComponent(Array.isArray(rawDemoName) ? rawDemoName[0] : rawDemoName).trim() : "";
  const linkedStudent = (Array.isArray(rawLinkedStudent) ? rawLinkedStudent[0] : rawLinkedStudent)?.trim();

  // If a tab explicitly sent x-demo-role or x-demo-user, but the cookie returned a different user/role (cross-tab cookie bleed),
  // override the cookie session with the tab's explicit role/user identity.
  if (user && ((demoRole && user.role !== demoRole) || (demoEmail && user.email?.toLowerCase() !== demoEmail.toLowerCase()))) {
    user = null;
  }

  // Fallback for portal mode: if no auth session cookie but x-demo-user / x-demo-role header is sent
  if (!user) {
    if (demoEmail || demoRole) {
      try {
        const db = await getDb();
        if (db && demoEmail) {
          const found = await db.select().from(users).where(eq(users.email, demoEmail.toLowerCase())).limit(1);
          if (found[0]) {
            user = {
              ...found[0],
              name: demoName || found[0].name || (demoEmail.split("@")[0]),
              role: (demoRole as any) || found[0].role,
              linkedStudentEmail: linkedStudent || found[0].linkedStudentEmail || null,
            };
          }
        }
        if (!user && (demoEmail || demoRole)) {
          const role = demoRole || (demoEmail?.includes("admin") ? "admin" : demoEmail?.includes("parent") ? "parent" : "student");
          user = {
            id: 1,
            email: demoEmail || (role === "admin" ? "admin@portal.com" : `${role}@portal.com`),
            name: demoName || (role === "admin" ? "Centre Admin" : role === "teacher" ? "Faculty" : (demoEmail ? demoEmail.split("@")[0] : "Portal User")),
            role: role as any,
            linkedStudentEmail: linkedStudent || null,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as any;
        }
      } catch (err) {
        console.error("[Context Auth Error]", err);
      }
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
