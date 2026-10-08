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

  // Fallback for demo portal mode: if no auth session cookie but x-demo-user / x-demo-role header is sent
  if (!user) {
    const demoEmail = opts.req.headers["x-demo-user"] as string | undefined;
    const demoRole = opts.req.headers["x-demo-role"] as string | undefined;
    if (demoEmail || demoRole) {
      try {
        const db = await getDb();
        if (db && demoEmail) {
          const found = await db.select().from(users).where(eq(users.email, demoEmail.toLowerCase())).limit(1);
          if (found[0]) {
            user = {
              ...found[0],
              role: (demoRole as any) || found[0].role,
            };
          }
        }
        if (!user && (demoEmail || demoRole)) {
          const role = demoRole || (demoEmail?.includes("admin") ? "admin" : demoEmail?.includes("parent") ? "parent" : "student");
          user = {
            id: 1,
            email: demoEmail || (role === "admin" ? "admin@portal.com" : `${role}@portal.com`),
            name: role === "admin" ? "Centre Admin" : role === "parent" ? "Ramesh Sharma" : "Portal User",
            role: role as any,
            linkedStudentEmail: role === "parent" ? "student@portal.com" : null,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as any;
        }
      } catch (err) {
        console.error("[Context Demo Auth Error]", err);
      }
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
