import { describe, expect, it } from "vitest";
import { DEFAULT_SUBJECTS } from "../client/src/pages/Home";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const context = (role: "user" | "admin" | "student" | "parent" | undefined): TrpcContext => ({
  user: role ? { id: 1, openId: "test-user", name: "Test User", email: "student@example.com", linkedStudentEmail: "student@example.com", loginMethod: "test", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() } : null,
  req: { protocol: "https", headers: {} } as TrpcContext["req"],
  res: {} as TrpcContext["res"],
});

describe("question paper subjects", () => {
  it("exposes exactly the three required featured subjects", () => {
    expect(DEFAULT_SUBJECTS).toHaveLength(3);
    expect(DEFAULT_SUBJECTS.map(subject => subject.name)).toEqual(["MATHS", "PHYSICS", "CHEMISTRY"]);
    expect(DEFAULT_SUBJECTS.every(subject => subject.isFeatured === 1)).toBe(true);
  });

  it("keeps each paper ready for the student-facing card", () => {
    for (const subject of DEFAULT_SUBJECTS) {
      expect(subject.code).toMatch(/^[A-Z]{3}-01$/);
      expect(subject.summary.length).toBeGreaterThan(10);
      expect(subject.questionCount).toBeGreaterThan(0);
      expect(subject.durationMinutes).toBeGreaterThan(0);
    }
  });

  it("blocks non-admin users from changing attendance", async () => {
    const caller = appRouter.createCaller(context("student"));
    await expect(caller.admin.attendance({ studentEmail: "student@example.com", attendanceDate: "2026-09-12", status: "present" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("requires authentication to read student records", async () => {
    const caller = appRouter.createCaller(context(undefined));
    await expect(caller.student.projects({ studentEmail: "student@example.com" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
