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

  // Fallback for demo portal mode: if no auth session cookie but x-demo-user header is sent
  if (!user) {
    const demoEmail = opts.req.headers["x-demo-user"] as string | undefined;
    if (demoEmail) {
      try {
        const db = await getDb();
        if (db) {
          const found = await db.select().from(users).where(eq(users.email, demoEmail.toLowerCase())).limit(1);
          if (found[0]) {
            user = found[0];
          } else {
            // Construct transient demo user if database user record does not exist yet
            const role = demoEmail.includes("admin") ? "admin" : demoEmail.includes("parent") ? "parent" : "student";
            user = {
              id: 1,
              email: demoEmail,
              name: demoEmail.includes("admin") ? "Centre Admin" : demoEmail.includes("parent") ? "Ramesh Sharma" : "Ananya Sharma",
              role: role as any,
              linkedStudentEmail: demoEmail.includes("parent") ? "student@portal.com" : null,
              createdAt: new Date(),
              updatedAt: new Date(),
            } as any;
          }
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
